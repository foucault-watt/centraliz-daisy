import { useCallback, useEffect, useRef, useState } from "react";
import { configService } from "../../services/configService.js";
import { downloadNotes } from "../../services/notesService.js";
import {
  calculateGeneralAverage,
  organizeModulesByUE,
  updateAveragesAfterNoteChange,
} from "../../utils/CoefficientsUtils.js";

const NotesPage = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // Nouveaux états pour les coefficients et l'organisation par UE
  const [coefficientsData, setCoefficientsData] = useState(null);
  const [organizedData, setOrganizedData] = useState(null);
  const [loadingCoefficients, setLoadingCoefficients] = useState(false);
  const [coefficientsError, setCoefficientsError] = useState("");

  // Nouvel état pour suivre quel module est en cours de simulation directement dans l'interface
  const [simulations, setSimulations] = useState({});
  // Nouveaux états pour la récupération backend
  const [password, setPassword] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const parseCSV = (csvText) => {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) {
      throw new Error(
        "Le fichier CSV doit contenir au moins un en-tête et une ligne de données."
      );
    }

    const header = lines[0].split(";").map((h) => h.trim());
    const moduleIndex = header.indexOf("Module");
    const epreuveIndex = header.indexOf("Épreuve");
    const detailControleIndex = header.indexOf("Détail sur le contrôle");
    const noteIndex = header.indexOf("Notes");
    const coeffIndex = header.indexOf(
      "Coefficient de l'Épreuve dans le Module"
    );

    if (
      moduleIndex === -1 ||
      noteIndex === -1 ||
      coeffIndex === -1 ||
      epreuveIndex === -1 ||
      detailControleIndex === -1
    ) {
      throw new Error(
        "L'en-tête du CSV est incorrect. Vérifiez les colonnes : 'Module', 'Épreuve', 'Détail sur le contrôle', 'Notes', 'Coefficient de l'Épreuve dans le Module'."
      );
    }

    const dataRows = lines.slice(1);
    const modules = {};

    dataRows.forEach((line) => {
      const values = line.split(";").map((v) => v.trim());
      if (
        values.length <
        Math.max(
          moduleIndex,
          epreuveIndex,
          detailControleIndex,
          noteIndex,
          coeffIndex
        ) +
          1
      )
        return; // Skip malformed lines

      const moduleName = values[moduleIndex];
      let epreuveName = values[epreuveIndex];
      const detailControle = values[detailControleIndex];
      const noteStr = values[noteIndex].replace(",", "."); // Handle comma as decimal separator
      const coeffStr = values[coeffIndex].replace(",", ".");

      // Transformation de epreuveName
      const separatorIndex = epreuveName.indexOf("- ");
      if (separatorIndex !== -1) {
        epreuveName = epreuveName.substring(separatorIndex + 2);
      }

      const note = parseFloat(noteStr);
      const coefficient = parseFloat(coeffStr);

      if (
        !moduleName ||
        isNaN(note) ||
        isNaN(coefficient) ||
        coefficient <= 0
      ) {
        console.warn(`Ligne ignorée ou données invalides: ${line}`);
        return;
      }

      if (!modules[moduleName]) {
        modules[moduleName] = {
          notes: [],
          totalWeightedScore: 0,
          totalCoefficients: 0,
          nextSimId: 1, // Pour des clés uniques pour les notes simulées
        };
      }
      modules[moduleName].notes.push({
        id: `csv-${moduleName}-${modules[moduleName].notes.length}`, // ID unique pour note CSV
        epreuveName,
        detailControle,
        note,
        coefficient,
        isSimulated: false,
      });
      modules[moduleName].totalWeightedScore += note * coefficient;
      modules[moduleName].totalCoefficients += coefficient;
    });

    Object.keys(modules).forEach((moduleName) => {
      const module = modules[moduleName];
      if (module.totalCoefficients > 0) {
        module.average = module.totalWeightedScore / module.totalCoefficients;
      } else {
        module.average = 0; // Or handle as an error/undefined
      }
    });
    return modules;
  }; // Fonction pour charger les coefficients et organiser les données
  const loadCoefficientsAndOrganize = useCallback(
    async (processedDataParam = null) => {
      const dataToUse = processedDataParam || processedData;
      if (!dataToUse) return;

      setLoadingCoefficients(true);
      setCoefficientsError("");

      try {
        const coefficients = await configService.getCoefficients();
        setCoefficientsData(coefficients);

        // Organiser les modules par UE
        const organized = organizeModulesByUE(dataToUse, coefficients);
        setOrganizedData(organized);

        if (organized.error) {
          setCoefficientsError(organized.error);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des coefficients:", err);
        setCoefficientsError(
          "Impossible de charger la configuration des coefficients"
        );
      } finally {
        setLoadingCoefficients(false);
      }
    },
    [processedData]
  );

  const handleFile = useCallback(
    async (file) => {
      setError("");
      setProcessedData(null);
      setOrganizedData(null);
      setCoefficientsError("");

      if (file && file.type === "text/csv") {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const parsed = parseCSV(e.target.result);
            setProcessedData(parsed);

            // Charger les coefficients après le traitement du CSV
            await loadCoefficientsAndOrganize(parsed);
          } catch (err) {
            setError(
              `Erreur lors du traitement du fichier CSV : ${err.message}`
            );
            setProcessedData(null);
          }
        };
        reader.onerror = () => {
          setError("Erreur lors de la lecture du fichier.");
          setProcessedData(null);
        };
        reader.readAsText(file);
      } else {
        setError("Veuillez sélectionner un fichier CSV valide.");
        setProcessedData(null);
      }
    },
    [loadCoefficientsAndOrganize]
  );

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      setIsDragging(false);
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
        event.dataTransfer.clearData();
      }
    },
    [handleFile]
  );

  const handleFileInputChange = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Modifions la fonction calculateModuleAverage pour ignorer les notes masquées
  const calculateModuleAverage = (notes) => {
    if (!notes || notes.length === 0) return 0;

    // Filtrer les notes pour exclure celles qui sont masquées
    const activeNotes = notes.filter((n) => !n.hidden);

    if (activeNotes.length === 0) return 0;

    const totalWeightedScore = activeNotes.reduce(
      (sum, n) => sum + n.note * n.coefficient,
      0
    );
    const totalCoefficients = activeNotes.reduce(
      (sum, n) => sum + n.coefficient,
      0
    );
    return totalCoefficients > 0 ? totalWeightedScore / totalCoefficients : 0;
  };

  useEffect(() => {
    if (processedData) {
      Object.keys(processedData).forEach((moduleName) => {
        const currentModule = processedData[moduleName];
        if (!simulations[moduleName]) {
          setSimulations((prev) => ({
            ...prev,
            [moduleName]: { note: 10, coefficient: 1 },
          }));
        } else {
          // Mettre à jour la moduleSimulation si elle existe déjà
          const tempNotes = [
            ...currentModule.notes,
            {
              note: parseFloat(simulations[moduleName].note),
              coefficient: parseFloat(simulations[moduleName].coefficient),
              isSimulated: true, // Marqueur temporaire
            },
          ];
          const newAverage = calculateModuleAverage(
            tempNotes.filter(
              (n) =>
                !isNaN(n.note) && !isNaN(n.coefficient) && n.coefficient > 0
            )
          );
          setSimulations((prev) => ({
            ...prev,
            [moduleName]: {
              ...prev[moduleName],
              simulatedAverage: newAverage,
            },
          }));
        }
      });
    }
  }, [processedData, simulations]);

  const handleSimulationInputChange = (moduleName, field, value) => {
    setSimulations((prev) => {
      const moduleSimulation = prev[moduleName] || { note: 10, coefficient: 1 };
      const updatedSimulation = { ...moduleSimulation, [field]: value };

      // Calculer la moyenne simulée
      if (processedData && processedData[moduleName]) {
        const currentModule = processedData[moduleName];
        const tempNotes = [
          ...currentModule.notes,
          {
            note: parseFloat(updatedSimulation.note),
            coefficient: parseFloat(updatedSimulation.coefficient),
            isSimulated: true,
          },
        ];

        const newAverage = calculateModuleAverage(
          tempNotes.filter(
            (n) => !isNaN(n.note) && !isNaN(n.coefficient) && n.coefficient > 0
          )
        );

        updatedSimulation.simulatedAverage = newAverage;
      }

      return { ...prev, [moduleName]: updatedSimulation };
    });
  };
  const handleAddSimulatedNote = (moduleName) => {
    if (!processedData || !simulations[moduleName]) return;

    const { note, coefficient } = simulations[moduleName];
    const noteValue = parseFloat(note);
    const coeffValue = parseFloat(coefficient);

    if (isNaN(noteValue) || isNaN(coeffValue) || coeffValue <= 0) {
      alert(
        "Veuillez entrer une note et un coefficient valides (coefficient > 0)."
      );
      return;
    }

    setProcessedData((prevData) => {
      const newData = { ...prevData };
      const targetModule = { ...newData[moduleName] };

      const simId = targetModule.nextSimId || 1;
      const generatedEpreuveName = `Simulation ${simId}`;
      const newSimulatedNote = {
        id: `sim-${moduleName}-${simId}`,
        epreuveName: generatedEpreuveName,
        detailControle: "Note simulée",
        note: noteValue,
        coefficient: coeffValue,
        isSimulated: true,
      };

      targetModule.notes = [...targetModule.notes, newSimulatedNote];
      targetModule.average = calculateModuleAverage(targetModule.notes);
      targetModule.nextSimId = simId + 1;

      newData[moduleName] = targetModule;

      // Mettre à jour les données organisées si elles existent
      if (organizedData && coefficientsData) {
        const updatedOrganized = updateAveragesAfterNoteChange(
          organizedData,
          moduleName,
          targetModule
        );
        setOrganizedData({ ...organizedData, ...updatedOrganized });
      }

      return newData;
    });

    // Réinitialiser la simulation pour ce module après l'ajout
    setSimulations((prev) => {
      const newSimulations = { ...prev };
      newSimulations[moduleName] = { note: 10, coefficient: 1 };
      return newSimulations;
    });
  };

  const handleDeleteSimulatedNote = (moduleName, noteIdToDelete) => {
    setProcessedData((prevData) => {
      const newData = { ...prevData };
      const targetModule = { ...newData[moduleName] };

      targetModule.notes = targetModule.notes.filter(
        (note) => note.id !== noteIdToDelete
      );
      targetModule.average = calculateModuleAverage(targetModule.notes);

      newData[moduleName] = targetModule;

      // Mettre à jour les données organisées si elles existent
      if (organizedData && coefficientsData) {
        const updatedOrganized = updateAveragesAfterNoteChange(
          organizedData,
          moduleName,
          targetModule
        );
        setOrganizedData({ ...organizedData, ...updatedOrganized });
      }

      return newData;
    });
  };

  // Ajout d'une fonction pour basculer la visibilité d'une note
  const handleToggleNoteVisibility = (moduleName, noteId) => {
    setProcessedData((prevData) => {
      const newData = { ...prevData };
      const targetModule = { ...newData[moduleName] };

      targetModule.notes = targetModule.notes.map((note) => {
        if (note.id === noteId) {
          return { ...note, hidden: !note.hidden };
        }
        return note;
      });

      targetModule.average = calculateModuleAverage(targetModule.notes);

      newData[moduleName] = targetModule;

      // Mettre à jour les données organisées si elles existent
      if (organizedData && coefficientsData) {
        const updatedOrganized = updateAveragesAfterNoteChange(
          organizedData,
          moduleName,
          targetModule
        );
        setOrganizedData({ ...organizedData, ...updatedOrganized });
      }

      return newData;
    });
  }; // Fonction pour télécharger les notes depuis le backend
  const handleDownloadNotes = async () => {
    if (!password.trim()) {
      setError("Veuillez entrer votre mot de passe");
      return;
    }

    setIsDownloading(true);
    setError("");
    setProcessedData(null);
    setOrganizedData(null);
    setCoefficientsError("");

    try {
      const response = await downloadNotes(password);

      if (response.success && response.csvContent) {
        // Parser le contenu CSV reçu du backend
        const parsed = parseCSV(response.csvContent);
        setProcessedData(parsed); // Charger les coefficients après le traitement du CSV
        await loadCoefficientsAndOrganize(parsed);
        setPassword("");
      } else {
        setError("Aucune donnée de notes reçue");
      }
    } catch (err) {
      console.error("Erreur lors du téléchargement des notes:", err);
      setError(err.message || "Erreur lors du téléchargement des notes");
    } finally {
      setIsDownloading(false);
    }
  };
  // Fonction utilitaire pour obtenir la couleur selon la note
  const getGradeColor = (grade) => {
    if (grade >= 10) return "text-green-600";
    if (grade >= 7) return "text-orange-500";
    return "text-red-600";
  };

  const getGradeBgColor = (grade) => {
    if (grade >= 10) return "bg-green-100 border-green-300";
    if (grade >= 7) return "bg-orange-100 border-orange-300";
    return "bg-red-100 border-red-300";
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* En-tête de page avec titre et instructions */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Calculateur de moyennes</h1>
        <p className="text-base-content/70">
          Récupérez automatiquement vos notes ou importez votre fichier CSV
        </p>
      </div>
      {/* Zone de récupération automatique des notes - PRINCIPAL */}
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="card bg-base-100 shadow-lg max-w-md w-full">
          <div className="card-body">
            <h3 className="card-title justify-center mb-4 text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Récupération automatique
            </h3>
            <p className="text-sm text-base-content/70 mb-4 text-center">
              Entrez votre mot de passe Centrale pour récupérer automatiquement
              vos notes
            </p>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Mot de passe</span>
              </label>
              <input
                type="password"
                className="input input-bordered"
                placeholder="Votre mot de passe Centrale"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && password.trim()) {
                    handleDownloadNotes();
                  }
                }}
                disabled={isDownloading}
              />
            </div>

            <div className="card-actions justify-center mt-4">
              <button
                className="btn btn-primary btn-wide"
                onClick={handleDownloadNotes}
                disabled={!password.trim() || isDownloading}
              >
                {isDownloading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Récupération...
                  </>
                ) : (
                  "Récupérer mes notes"
                )}
              </button>
            </div>

            <div className="alert alert-info mt-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm">
                Votre mot de passe n'est pas stocké et est uniquement utilisé
                pour vous connecter à Aurion.
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Séparateur avec "OU" */}
      <div className="flex items-center justify-center mb-6">
        <div className="border-t border-base-300 flex-grow mr-3"></div>
        <span className="text-base-content/60 px-3 font-medium">OU</span>
        <div className="border-t border-base-300 flex-grow ml-3"></div>
      </div>
      {/* Zone d'importation de fichier - SECONDAIRE */}
      <div className="collapse collapse-arrow bg-base-200 mb-8">
        <input type="checkbox" />
        <div className="collapse-title text-center font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 inline mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Import manuel d'un fichier CSV
        </div>
        <div className="collapse-content">
          <div className="flex flex-col items-center justify-center pt-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".csv"
              className="hidden"
            />
            <div
              className={`w-full max-w-lg h-32 flex flex-col items-center justify-center 
                        border-2 border-dashed rounded-xl cursor-pointer transition-all
                        ${
                          isDragging
                            ? "border-primary bg-primary/10"
                            : "border-base-300 hover:bg-base-200 hover:border-primary/50"
                        }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileInput}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-base-content/60 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="font-medium text-sm">Déposer un fichier CSV ici</p>
              <p className="text-xs text-base-content/60 mt-1">
                ou cliquer pour parcourir
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Message d'erreur */}
      {error && (
        <div
          role="alert"
          className="alert alert-error mb-6 max-w-lg mx-auto shadow-md"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}{" "}
      {/* Messages d'erreur pour les coefficients */}
      {coefficientsError && (
        <div
          role="alert"
          className="alert alert-warning mb-6 max-w-lg mx-auto shadow-md"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <span>{coefficientsError}</span>
        </div>
      )}
      {/* Indicateur de chargement des coefficients */}
      {loadingCoefficients && (
        <div className="flex justify-center items-center mb-6">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <span className="ml-3 text-lg">Chargement des coefficients...</span>
        </div>
      )}
      {/* Affichage organisé par UE */}
      {organizedData && !organizedData.error && (
        <div className="mt-8">
          {" "}
          {/* Moyenne générale */}
          <div
            className={`card shadow-lg mb-6 mx-auto max-w-md border-2 ${getGradeBgColor(
              calculateGeneralAverage(organizedData.organizedUEs)
            )}`}
          >
            <div className="card-body text-center">
              <h2 className="card-title justify-center text-base-content">
                Moyenne Générale
              </h2>
              <div
                className={`text-4xl font-bold ${getGradeColor(
                  calculateGeneralAverage(organizedData.organizedUEs)
                )}`}
              >
                {calculateGeneralAverage(organizedData.organizedUEs).toFixed(2)}
              </div>
              <p className="text-sm text-base-content/70">
                Groupe: {organizedData.userGroup}
              </p>
            </div>
          </div>
          {/* Affichage par UE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {Object.entries(organizedData.organizedUEs).map(
              ([ueName, ueData]) => (
                <div key={ueName} className="card bg-base-100 shadow-lg">
                  <div className="card-body">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="card-title text-lg">{ueName}</h3>{" "}
                      <div className="flex items-center gap-2">
                        <span className="badge badge-outline">
                          Coef. {ueData.coef}
                        </span>
                        <div
                          className={`badge badge-lg font-semibold border-2 ${getGradeBgColor(
                            ueData.average
                          )} ${getGradeColor(ueData.average)}`}
                        >
                          {ueData.average.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Modules dans cette UE */}
                    <div className="space-y-3">
                      {Object.entries(ueData.modules).map(
                        ([moduleName, moduleData]) => (
                          <div
                            key={moduleName}
                            className="collapse collapse-arrow bg-base-200"
                          >
                            <input type="checkbox" />
                            <div className="collapse-title flex justify-between items-center">
                              <span className="font-medium">{moduleName}</span>{" "}
                              <div className="flex items-center gap-2">
                                <span className="badge badge-outline badge-xs">
                                  Coef. {moduleData.enseignementCoef}
                                </span>
                                <span
                                  className={`badge font-semibold border-2 ${getGradeBgColor(
                                    moduleData.average
                                  )} ${getGradeColor(moduleData.average)}`}
                                >
                                  {moduleData.average.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="collapse-content">
                              {/* Affichage des notes du module */}
                              <div className="overflow-x-auto mt-2">
                                <table className="table table-xs w-full">
                                  <thead>
                                    <tr>
                                      <th>Épreuve</th>
                                      <th>Détail</th>
                                      <th className="text-right">Note</th>
                                      <th className="text-right">Coeff.</th>
                                      <th className="w-16"></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {" "}
                                    {moduleData.notes.map((note) => (
                                      <tr
                                        key={note.id}
                                        className={`
                                      ${note.isSimulated ? "bg-accent/10" : ""}
                                      ${
                                        note.hidden
                                          ? "opacity-50 line-through"
                                          : ""
                                      }
                                    `}
                                      >
                                        <td>
                                          <div className="flex items-center gap-1">
                                            {note.isSimulated && (
                                              <span className="badge badge-xs badge-accent">
                                                Sim
                                              </span>
                                            )}
                                            {note.hidden && (
                                              <span className="badge badge-xs badge-warning">
                                                Masqué
                                              </span>
                                            )}
                                            <span
                                              className="truncate max-w-[100px]"
                                              title={note.epreuveName}
                                            >
                                              {note.epreuveName}
                                            </span>
                                          </div>
                                        </td>
                                        <td>
                                          <div
                                            className="max-w-[120px] max-h-12 overflow-y-auto text-xs pr-1 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent"
                                            title={note.detailControle}
                                          >
                                            {note.detailControle}
                                          </div>
                                        </td>
                                        <td
                                          className={`text-right font-medium ${getGradeColor(
                                            note.note
                                          )}`}
                                        >
                                          {note.note.toFixed(2)}
                                        </td>
                                        <td className="text-right">
                                          {note.coefficient.toFixed(2)}
                                        </td>
                                        <td className="flex items-center justify-end gap-1">
                                          <button
                                            className={`btn btn-xs btn-ghost text-base-content ${
                                              note.hidden ? "" : "opacity-50"
                                            }`}
                                            onClick={() =>
                                              handleToggleNoteVisibility(
                                                moduleName,
                                                note.id
                                              )
                                            }
                                            title={
                                              note.hidden
                                                ? "Inclure dans la moyenne"
                                                : "Exclure de la moyenne"
                                            }
                                          >
                                            {note.hidden ? "👁️" : "🙈"}
                                          </button>
                                          {note.isSimulated && (
                                            <button
                                              className="btn btn-xs btn-circle btn-ghost text-error"
                                              onClick={() =>
                                                handleDeleteSimulatedNote(
                                                  moduleName,
                                                  note.id
                                                )
                                              }
                                              title="Supprimer"
                                            >
                                              ✕
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Zone de simulation pour ce module */}
                              <div className="bg-base-300 p-3 rounded-box mt-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-sm">
                                    Simuler une note
                                  </span>
                                  {simulations[moduleName]
                                    ?.simulatedAverage && (
                                    <div className="text-sm">
                                      <span className="text-base-content/70">
                                        Moyenne projetée :{" "}
                                      </span>
                                      <span className="font-semibold text-accent">
                                        {simulations[
                                          moduleName
                                        ].simulatedAverage.toFixed(2)}
                                      </span>
                                      <span className="text-xs text-base-content/50 ml-1">
                                        (
                                        {(
                                          simulations[moduleName]
                                            .simulatedAverage -
                                          moduleData.average
                                        ).toFixed(2)}
                                        )
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  <div className="form-control">
                                    <label className="label py-0">
                                      <span className="label-text text-xs">
                                        Coefficient
                                      </span>
                                    </label>
                                    <input
                                      type="number"
                                      className="input input-xs input-bordered w-full"
                                      value={
                                        simulations[moduleName]?.coefficient ||
                                        1
                                      }
                                      min="0.1"
                                      step="0.1"
                                      onChange={(e) =>
                                        handleSimulationInputChange(
                                          moduleName,
                                          "coefficient",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>

                                  <div className="form-control">
                                    <label className="label py-0">
                                      <span className="label-text text-xs">
                                        Note:{" "}
                                        {parseFloat(
                                          simulations[moduleName]?.note || 10
                                        ).toFixed(2)}
                                      </span>
                                    </label>
                                    <input
                                      type="range"
                                      min="0"
                                      max="20"
                                      step="0.25"
                                      value={
                                        simulations[moduleName]?.note || 10
                                      }
                                      className="range range-xs range-accent"
                                      onChange={(e) =>
                                        handleSimulationInputChange(
                                          moduleName,
                                          "note",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                </div>

                                <button
                                  className="btn btn-xs btn-accent w-full mt-1"
                                  onClick={() =>
                                    handleAddSimulatedNote(moduleName)
                                  }
                                >
                                  Ajouter cette simulation
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
          {/* Modules non mappés */}
          {Object.keys(organizedData.unmappedModules).length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4 text-center text-warning">
                Modules non classés (
                {Object.keys(organizedData.unmappedModules).length})
              </h3>
              <div className="alert alert-warning mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span>
                  Ces modules n'ont pas pu être associés à une UE. Ils ne sont
                  pas pris en compte dans la moyenne générale.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(organizedData.unmappedModules).map(
                  ([moduleName, data]) => (
                    <div
                      key={moduleName}
                      className="card bg-base-100 shadow-lg border border-warning"
                    >
                      <div className="card-body p-4">
                        {" "}
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="card-title text-lg">{moduleName}</h3>
                          <div
                            className={`badge badge-lg font-semibold border-2 ${getGradeBgColor(
                              data.average
                            )} ${getGradeColor(data.average)}`}
                          >
                            {data.average !== undefined
                              ? data.average.toFixed(2)
                              : "N/A"}
                          </div>
                        </div>
                        <div className="overflow-x-auto max-h-48 mb-4">
                          <table className="table table-xs table-zebra w-full">
                            <thead>
                              <tr>
                                <th>Épreuve</th>
                                <th>Détail</th>
                                <th className="text-right">Note</th>
                                <th className="text-right">Coeff.</th>
                                <th className="w-16"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.notes.map((note) => (
                                <tr
                                  key={note.id}
                                  className={`
                                  ${note.isSimulated ? "bg-accent/10" : ""}
                                  ${
                                    note.hidden ? "opacity-50 line-through" : ""
                                  }
                                `}
                                >
                                  <td>
                                    <div className="flex items-center gap-1">
                                      {note.isSimulated && (
                                        <span className="badge badge-xs badge-accent">
                                          Sim
                                        </span>
                                      )}
                                      {note.hidden && (
                                        <span className="badge badge-xs badge-warning">
                                          Masqué
                                        </span>
                                      )}
                                      <span
                                        className="truncate max-w-[100px]"
                                        title={note.epreuveName}
                                      >
                                        {note.epreuveName}
                                      </span>
                                    </div>
                                  </td>{" "}
                                  <td>
                                    <div
                                      className="max-w-[120px] max-h-12 overflow-y-auto text-xs pr-1 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent"
                                      title={note.detailControle}
                                    >
                                      {note.detailControle}
                                    </div>
                                  </td>
                                  <td
                                    className={`text-right font-medium ${getGradeColor(
                                      note.note
                                    )}`}
                                  >
                                    {note.note.toFixed(2)}
                                  </td>
                                  <td className="text-right">
                                    {note.coefficient.toFixed(2)}
                                  </td>
                                  <td className="flex items-center justify-end gap-1">
                                    <button
                                      className={`btn btn-xs btn-ghost text-base-content ${
                                        note.hidden ? "" : "opacity-50"
                                      }`}
                                      onClick={() =>
                                        handleToggleNoteVisibility(
                                          moduleName,
                                          note.id
                                        )
                                      }
                                      title={
                                        note.hidden
                                          ? "Inclure dans la moyenne"
                                          : "Exclure de la moyenne"
                                      }
                                    >
                                      {note.hidden ? "👁️" : "🙈"}
                                    </button>
                                    {note.isSimulated && (
                                      <button
                                        className="btn btn-xs btn-circle btn-ghost text-error"
                                        onClick={() =>
                                          handleDeleteSimulatedNote(
                                            moduleName,
                                            note.id
                                          )
                                        }
                                        title="Supprimer"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {/* Zone de simulation */}
                        <div className="bg-base-200 p-3 rounded-box mt-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">
                              Simuler une note
                            </span>
                            {simulations[moduleName]?.simulatedAverage && (
                              <div className="text-sm">
                                <span className="text-base-content/70">
                                  Moyenne projetée :{" "}
                                </span>
                                <span className="font-semibold text-accent">
                                  {simulations[
                                    moduleName
                                  ].simulatedAverage.toFixed(2)}
                                </span>
                                <span className="text-xs text-base-content/50 ml-1">
                                  (
                                  {(
                                    simulations[moduleName].simulatedAverage -
                                    data.average
                                  ).toFixed(2)}
                                  )
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div className="form-control">
                              <label className="label py-0">
                                <span className="label-text text-xs">
                                  Coefficient
                                </span>
                              </label>
                              <input
                                type="number"
                                className="input input-xs input-bordered w-full"
                                value={
                                  simulations[moduleName]?.coefficient || 1
                                }
                                min="0.1"
                                step="0.1"
                                onChange={(e) =>
                                  handleSimulationInputChange(
                                    moduleName,
                                    "coefficient",
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            <div className="form-control">
                              <label className="label py-0">
                                <span className="label-text text-xs">
                                  Note:{" "}
                                  {parseFloat(
                                    simulations[moduleName]?.note || 10
                                  ).toFixed(2)}
                                </span>
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="20"
                                step="0.25"
                                value={simulations[moduleName]?.note || 10}
                                className="range range-xs range-accent"
                                onChange={(e) =>
                                  handleSimulationInputChange(
                                    moduleName,
                                    "note",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </div>

                          <button
                            className="btn btn-xs btn-accent w-full mt-1"
                            onClick={() => handleAddSimulatedNote(moduleName)}
                          >
                            Ajouter cette simulation
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {/* Affichage de base si pas de coefficients */}
      {processedData &&
        Object.keys(processedData).length > 0 &&
        !organizedData &&
        !loadingCoefficients && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-6 text-center">
              Résultats par module (vue simplifiée)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(processedData).map(([moduleName, data]) => {
                // Initialiser la simulation du module si elle n'existe pas
                if (!simulations[moduleName]) {
                  setSimulations((prev) => ({
                    ...prev,
                    [moduleName]: { note: 10, coefficient: 1 },
                  }));
                }

                const moduleSimulation = simulations[moduleName] || {
                  note: 10,
                  coefficient: 1,
                };

                return (
                  <div key={moduleName} className="card bg-base-100 shadow-lg">
                    <div className="card-body p-4">
                      {" "}
                      {/* En-tête de la carte avec nom du module et moyenne */}
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="card-title text-lg">{moduleName}</h3>
                        <div
                          className={`badge badge-lg font-semibold border-2 ${getGradeBgColor(
                            data.average
                          )} ${getGradeColor(data.average)}`}
                        >
                          {data.average !== undefined
                            ? data.average.toFixed(2)
                            : "N/A"}
                        </div>
                      </div>
                      {/* Tableau des notes */}
                      <div className="overflow-x-auto max-h-48 mb-4">
                        <table className="table table-xs table-zebra w-full">
                          <thead>
                            <tr>
                              <th>Épreuve</th>
                              <th>Détail</th>
                              <th className="text-right">Note</th>
                              <th className="text-right">Coeff.</th>
                              <th className="w-16"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.notes.map((n) => (
                              <tr
                                key={n.id}
                                className={`
                              ${n.isSimulated ? "bg-accent/10" : ""}
                              ${n.hidden ? "opacity-50 line-through" : ""}
                            `}
                              >
                                <td>
                                  <div className="flex items-center gap-1">
                                    {n.isSimulated && (
                                      <span className="badge badge-xs badge-accent">
                                        Sim
                                      </span>
                                    )}
                                    {n.hidden && (
                                      <span className="badge badge-xs badge-warning">
                                        Masqué
                                      </span>
                                    )}
                                    <span
                                      className="truncate max-w-[100px]"
                                      title={n.epreuveName}
                                    >
                                      {n.epreuveName}
                                    </span>
                                  </div>
                                </td>{" "}
                                <td>
                                  <div
                                    className="max-w-[120px] max-h-12 overflow-y-auto text-xs pr-1 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent"
                                    title={n.detailControle}
                                  >
                                    {n.detailControle}
                                  </div>
                                </td>
                                <td
                                  className={`text-right font-medium ${getGradeColor(
                                    n.note
                                  )}`}
                                >
                                  {n.note.toFixed(2)}
                                </td>
                                <td className="text-right">
                                  {n.coefficient.toFixed(2)}
                                </td>
                                <td className="flex items-center justify-end gap-1">
                                  {/* Bouton pour masquer/afficher la note */}
                                  <button
                                    className={`btn btn-xs btn-ghost text-base-content ${
                                      n.hidden ? "" : "opacity-50"
                                    }`}
                                    onClick={() =>
                                      handleToggleNoteVisibility(
                                        moduleName,
                                        n.id
                                      )
                                    }
                                    title={
                                      n.hidden
                                        ? "Inclure dans la moyenne"
                                        : "Exclure de la moyenne"
                                    }
                                    aria-label={
                                      n.hidden
                                        ? "Inclure dans la moyenne"
                                        : "Exclure de la moyenne"
                                    }
                                  >
                                    {n.hidden ? (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                      </svg>
                                    ) : (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                        />
                                      </svg>
                                    )}
                                  </button>

                                  {/* Bouton pour supprimer une note simulée */}
                                  {n.isSimulated && (
                                    <button
                                      className="btn btn-xs btn-circle btn-ghost text-error"
                                      onClick={() =>
                                        handleDeleteSimulatedNote(
                                          moduleName,
                                          n.id
                                        )
                                      }
                                      title="Supprimer"
                                      aria-label="Supprimer la note simulée"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Zone de simulation intégrée */}
                      <div className="bg-base-200 p-3 rounded-box mt-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">
                            Simuler une note
                          </span>
                          {moduleSimulation.simulatedAverage && (
                            <div className="text-sm">
                              <span className="text-base-content/70">
                                Moyenne projetée :{" "}
                              </span>
                              <span className="font-semibold text-accent">
                                {moduleSimulation.simulatedAverage.toFixed(2)}
                              </span>
                              <span className="text-xs text-base-content/50 ml-1">
                                (
                                {(
                                  moduleSimulation.simulatedAverage -
                                  data.average
                                ).toFixed(2)}
                                )
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {/* Entrée de coefficient */}
                          <div className="form-control">
                            <label className="label py-0">
                              <span className="label-text text-xs">
                                Coefficient
                              </span>
                            </label>
                            <input
                              type="number"
                              className="input input-xs input-bordered w-full"
                              value={moduleSimulation.coefficient || 1}
                              min="0.1"
                              step="0.1"
                              onChange={(e) =>
                                handleSimulationInputChange(
                                  moduleName,
                                  "coefficient",
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          {/* Entrée de note */}
                          <div className="form-control">
                            <label className="label py-0">
                              <span className="label-text text-xs">
                                Note:{" "}
                                {parseFloat(
                                  moduleSimulation.note || 10
                                ).toFixed(2)}
                              </span>
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="20"
                              step="0.25"
                              value={moduleSimulation.note || 10}
                              className="range range-xs range-accent"
                              onChange={(e) =>
                                handleSimulationInputChange(
                                  moduleName,
                                  "note",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>

                        <button
                          className="btn btn-xs btn-accent w-full mt-1"
                          onClick={() => handleAddSimulatedNote(moduleName)}
                        >
                          Ajouter cette simulation
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
    </div>
  );
};

export default NotesPage;
