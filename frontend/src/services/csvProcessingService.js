// frontend/src/services/csvProcessingService.js

/**
 * Récupère la configuration des coefficients depuis l'API.
 * @returns {Promise<Object>} La configuration des coefficients.
 * @throws {Error} Si la récupération échoue.
 */
async function getCoefficientsConfigFromApi() {
  try {
    const response = await fetch('/api/admin/coefficients'); // Suppose que cet endpoint est authentifié si nécessaire
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Impossible de récupérer la configuration des coefficients et d'analyser la réponse d'erreur' }));
      console.error('Réponse d'erreur de l'API:', errorData);
      throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
    }
    const data = await response.json();
    if (data && data.success) {
      return data.config; // C'est la valeur JSONB réelle de la base de données
    } else {
      throw new Error(data.message || 'Impossible de récupérer une configuration valide.');
    }
  } catch (error) {
    console.error("L'appel API pour getCoefficientsConfig a échoué:", error);
    throw error; // Relancer pour être attrapé par l'appelant
  }
}

/**
 * Traite les données des étudiants (généralement à partir d'un CSV) en utilisant la configuration des coefficients.
 * @param {Array<Object>} studentDataArray - Un tableau d'objets représentant les enregistrements des étudiants.
 *                                         Ex: [{ Etudiant: 'Alice', UE: 'UEF1', Module: 'Algo', Note: '15' }, ...]
 * @param {string} userGroup - Le groupe de l'utilisateur pour filtrer les coefficients.
 * @returns {Promise<Object>} Un objet contenant les données traitées ou un message d'erreur/avertissement.
 *                            Ex: { processedData: { Alice: { UEF1: { modules: [...], average: 14.5 } } } }
 *                            Ex: { error: "Message d'erreur" }
 *                            Ex: { warning: "Message d'avertissement", processedData: { ... } }
 */
export async function processStudentGrades(studentDataArray, userGroup) {
  if (!userGroup) {
    console.error("Groupe utilisateur non disponible pour le traitement des notes.");
    return { error: "Le groupe de l'utilisateur n'est pas disponible." };
  }

  let coefficientsConfigJson;
  try {
    coefficientsConfigJson = await getCoefficientsConfigFromApi();
  } catch (error) {
    console.error("Erreur lors de la récupération des coefficients:", error.message);
    return { error: `Impossible de charger la configuration des coefficients: ${error.message}` };
  }

  if (!coefficientsConfigJson) {
    console.warn(`Aucune configuration de coefficients trouvée ou la configuration est vide.`);
    return { 
      warning: `Aucune configuration de coefficients trouvée ou la configuration est vide. Les moyennes n'ont pas été calculées.`,
      processedData: groupDataForBasicDisplay(studentDataArray)
    };
  }

  if (!coefficientsConfigJson.groups || !coefficientsConfigJson.groups[userGroup]) {
    console.warn(`Aucune configuration de coefficients trouvée pour le groupe: ${userGroup} dans la configuration chargée.`);
    return { 
      warning: `Aucune configuration de coefficients trouvée pour le groupe: ${userGroup}. Les moyennes n'ont pas été calculées.`,
      processedData: groupDataForBasicDisplay(studentDataArray)
    };
  }

  const groupCoeffs = coefficientsConfigJson.groups[userGroup];
  const processedStudents = {};

  // Regrouper les données par étudiant
  // Ajuster les noms des champs (Etudiant, UE, Module, Note) si nécessaire, en fonction du CSV.
  const studentsMap = studentDataArray.reduce((acc, record) => {
    const studentName = record.Etudiant || record.student_name || record.Nom; // Noms de champs possibles
    if (!studentName) return acc; // Ignorer les enregistrements sans nom d'étudiant
    if (!acc[studentName]) {
      acc[studentName] = [];
    }
    acc[studentName].push(record);
    return acc;
  }, {});

  for (const studentName in studentsMap) {
    processedStudents[studentName] = {};
    const studentRecords = studentsMap[studentName];

    // Regrouper les enregistrements par UE pour l'étudiant actuel
    const ueMap = studentRecords.reduce((acc, record) => {
      const ueName = record.UE || record.ue_name; // Noms de champs possibles
      if (!ueName) return acc; // Ignorer les enregistrements sans nom d'UE
      if (!acc[ueName]) {
        acc[ueName] = [];
      }
      acc[ueName].push(record);
      return acc;
    }, {});

    for (const ueName in ueMap) {
      const ueModulesData = ueMap[ueName];
      const ueCoeffsConfig = groupCoeffs[ueName]; // Coefficients pour cette UE spécifique

      if (!ueCoeffsConfig) {
        console.warn(`Aucun coefficient trouvé pour l'UE: ${ueName} dans le groupe: ${userGroup}. Les notes pour cette UE ne seront pas pondérées.`);
        processedStudents[studentName][ueName] = {
          modules: ueModulesData.map(m => ({
            name: m.Module || m.module_name,
            note: parseFloat(m.Note || m.grade || m.note),
            coeff: "N/A"
          })).sort((a, b) => a.name.localeCompare(b.name)),
          average: "N/A (Coeffs UE manquants)",
          warning: `Coefficients manquants pour l'UE ${ueName}.`
        };
        continue;
      }

      let totalWeightedScore = 0;
      let totalCoefficients = 0;
      const modulesWithCoeffs = [];

      for (const moduleRecord of ueModulesData) {
        const moduleName = moduleRecord.Module || moduleRecord.module_name;
        const noteString = moduleRecord.Note || moduleRecord.grade || moduleRecord.note;
        const note = parseFloat(String(noteString).replace(',', '.')); // Gérer la virgule comme séparateur décimal

        if (isNaN(note)) {
            console.warn(`Note non valide pour le module: ${moduleName} de l'étudiant: ${studentName}. Module ignoré.`);
            modulesWithCoeffs.push({ name: moduleName, note: "Invalide", coeff: "N/A" });
            continue;
        }

        const coeff = ueCoeffsConfig[moduleName];

        if (coeff === undefined || coeff === null) {
          console.warn(`Aucun coefficient pour le module: ${moduleName} dans l'UE: ${ueName}, groupe: ${userGroup}. Coefficient par défaut de 1 appliqué.`);
          modulesWithCoeffs.push({ name: moduleName, note, coeff: 1, warning: "Coeff par défaut appliqué" });
          totalWeightedScore += note * 1;
          totalCoefficients += 1;
        } else {
          modulesWithCoeffs.push({ name: moduleName, note, coeff });
          totalWeightedScore += note * coeff;
          totalCoefficients += coeff;
        }
      }

      // Trier les modules au sein de l'UE (par exemple, alphabétiquement par nom)
      modulesWithCoeffs.sort((a, b) => a.name.localeCompare(b.name));

      const ueAverage = totalCoefficients > 0 ? totalWeightedScore / totalCoefficients : 0;

      processedStudents[studentName][ueName] = {
        modules: modulesWithCoeffs,
        average: parseFloat(ueAverage.toFixed(2)), // Arrondir à 2 décimales
      };
    }
  }
  return { processedData: processedStudents };
}

/**
 * Regroupe les données pour un affichage de base si les coefficients ne sont pas trouvés ou applicables.
 * @param {Array<Object>} studentDataArray - Données brutes des étudiants.
 * @returns {Object} Données groupées par étudiant et UE.
 */
function groupDataForBasicDisplay(studentDataArray) {
  const processedStudents = {};
  const studentsMap = studentDataArray.reduce((acc, record) => {
    const studentName = record.Etudiant || record.student_name || record.Nom;
    if (!studentName) return acc;
    if (!acc[studentName]) acc[studentName] = [];
    acc[studentName].push(record);
    return acc;
  }, {});

  for (const studentName in studentsMap) {
    processedStudents[studentName] = {};
    const studentRecords = studentsMap[studentName];
    const ueMap = studentRecords.reduce((acc, record) => {
      const ueName = record.UE || record.ue_name;
      if (!ueName) return acc;
      if (!acc[ueName]) acc[ueName] = [];
      acc[ueName].push(record);
      return acc;
    }, {});

    for (const ueName in ueMap) {
      processedStudents[studentName][ueName] = {
        modules: ueMap[ueName].map(m => ({
          name: m.Module || m.module_name,
          note: parseFloat(String(m.Note || m.grade || m.note).replace(',', '.')),
          coeff: "N/A"
        })).sort((a, b) => a.name.localeCompare(b.name)),
        average: "N/A",
      };
    }
  }
  return processedStudents;
}
