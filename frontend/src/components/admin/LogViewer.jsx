import axios from "axios";
import { AlertCircle, FileText, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

const LogViewer = () => {
  const [logFiles, setLogFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [logContent, setLogContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterLevel, setFilterLevel] = useState("all");

  // Charger la liste des fichiers de logs
  const fetchLogFiles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/logs/files`,
        { withCredentials: true }
      );
      setLogFiles(response.data.files);

      // Sélectionner le premier fichier par défaut s'il existe
      if (response.data.files.length > 0 && !selectedFile) {
        setSelectedFile(response.data.files[0]);
      }

      setError(null);
    } catch (err) {
      console.error("Erreur lors du chargement des fichiers de logs:", err);
      setError("Impossible de charger les fichiers de logs.");
    } finally {
      setLoading(false);
    }
  };

  // Charger le contenu d'un fichier de log spécifique
  const fetchLogContent = async (filename) => {
    if (!filename || filename.endsWith(".gz")) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/admin/logs/content/${filename}`,
        { withCredentials: true }
      );
      setLogContent(response.data.lines);
      setError(null);
    } catch (err) {
      console.error(
        `Erreur lors du chargement du contenu du log ${filename}:`,
        err
      );
      setError(`Impossible de charger le contenu du fichier ${filename}.`);
      setLogContent([]);
    } finally {
      setLoading(false);
    }
  };

  // Charger les fichiers de logs au chargement du composant
  useEffect(() => {
    fetchLogFiles();
  }, []);

  // Charger le contenu du fichier sélectionné
  useEffect(() => {
    if (selectedFile) {
      fetchLogContent(selectedFile);
    }
  }, [selectedFile]);

  // Fonction pour déterminer la classe de couleur selon le niveau de log
  const getLevelClass = (level) => {
    if (!level) return "";

    switch (level.toLowerCase()) {
      case "error":
        return "text-error";
      case "warn":
        return "text-warning";
      case "info":
        return "text-info";
      case "debug":
        return "text-neutral";
      default:
        return "";
    }
  };

  // Filtrer les logs par niveau
  const filteredLogs =
    filterLevel === "all"
      ? logContent
      : logContent.filter(
          (log) =>
            log.level && log.level.toLowerCase() === filterLevel.toLowerCase()
        );

  return (
    <div className="p-4">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">Logs du système</h3>
          <button
            className="btn btn-outline btn-sm"
            onClick={fetchLogFiles}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4">
          {/* Sélection du fichier de log */}
          <div className="w-full md:w-1/4">
            <div className="card border">
              <div className="card-body p-4">
                <h4 className="card-title text-base">Fichiers de logs</h4>
                {logFiles.length === 0 ? (
                  <div className="text-sm text-base-content/70">
                    Aucun fichier de log disponible
                  </div>
                ) : (
                  <div className="menu bg-base-100 w-full">
                    {logFiles.map((file) => (
                      <button
                        key={file}
                        className={`btn btn-ghost justify-start text-left ${
                          selectedFile === file ? "btn-active" : ""
                        } ${file.endsWith(".gz") ? "opacity-50" : ""}`}
                        onClick={() => setSelectedFile(file)}
                        disabled={file.endsWith(".gz")}
                      >
                        <FileText size={16} className="mr-2" />
                        <span className="truncate">{file}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contenu du fichier de log */}
          <div className="w-full md:w-3/4">
            <div className="card border">
              <div className="card-body p-4">
                <div className="flex justify-between items-center">
                  <h4 className="card-title text-base">
                    {selectedFile ? selectedFile : "Sélectionnez un fichier"}
                  </h4>

                  {/* Filtre par niveau de log */}
                  <select
                    className="select select-sm select-bordered"
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                  >
                    <option value="all">Tous les niveaux</option>
                    <option value="error">Erreurs</option>
                    <option value="warn">Avertissements</option>
                    <option value="info">Informations</option>
                    <option value="debug">Debug</option>
                  </select>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center p-8">
                    <span className="loading loading-spinner loading-md"></span>
                  </div>
                ) : selectedFile && selectedFile.endsWith(".gz") ? (
                  <div className="alert alert-warning">
                    <AlertCircle size={18} />
                    <span>
                      Ce fichier est compressé et ne peut pas être affiché
                      directement.
                    </span>
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="text-sm text-base-content/70 p-4">
                    {logContent.length === 0
                      ? "Aucun contenu disponible"
                      : "Aucun log ne correspond au filtre sélectionné"}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table table-zebra table-sm w-full">
                      <thead>
                        <tr>
                          <th>Horodatage</th>
                          <th>Niveau</th>
                          <th>Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLogs.map((log, index) => (
                          <tr key={index}>
                            <td className="whitespace-nowrap">
                              {log.timestamp || "—"}
                            </td>
                            <td
                              className={`whitespace-nowrap ${getLevelClass(
                                log.level
                              )}`}
                            >
                              {log.level || "—"}
                            </td>
                            <td className="break-all">{log.message || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogViewer;
