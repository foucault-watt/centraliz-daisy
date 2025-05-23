/**
 * Utilitaire pour organiser les enseignements selon les coefficients des UE
 */

/**
 * Trouve le groupe de l'utilisateur (IE1, IE2, etc.) depuis les données CSV
 * en analysant les noms des modules
 */
export const detectUserGroup = (processedData) => {
  const moduleNames = Object.keys(processedData || {});

  // Recherche d'indices pour déterminer le groupe
  const hasIE1Modules = moduleNames.some(
    (name) =>
      name.toLowerCase().includes("mathématiques 1") ||
      name.toLowerCase().includes("mathématiques 2") ||
      name.toLowerCase().includes("ami")
  );

  const hasIE2Modules = moduleNames.some(
    (name) =>
      name.toLowerCase().includes("mathématiques 3") ||
      name.toLowerCase().includes("mathématiques 4") ||
      name.toLowerCase().includes("développement web")
  );

  if (hasIE2Modules) return "IE2";
  if (hasIE1Modules) return "IE1";

  // Par défaut, essayer IE1
  return "IE1";
};

/**
 * Trouve l'UE et le coefficient pour un enseignement donné
 */
export const findUEForEnseignement = (
  enseignementName,
  coefficientsData,
  userGroup
) => {
  if (!coefficientsData?.groups?.[userGroup]?.UE) {
    return null;
  }

  const UEs = coefficientsData.groups[userGroup].UE;

  for (const ue of UEs) {
    const ueName = Object.keys(ue)[0];
    const ueData = ue[ueName][0];

    if (ueData?.enseignements) {
      const enseignements = ueData.enseignements[0];

      // Recherche exacte d'abord
      if (enseignements[enseignementName] !== undefined) {
        return {
          ueName,
          ueCoef: ueData.coef,
          enseignementCoef: enseignements[enseignementName],
        };
      }

      // Recherche approximative (insensible à la casse et aux espaces)
      const normalizedSearch = enseignementName.toLowerCase().trim();
      for (const [enseignementKey, coef] of Object.entries(enseignements)) {
        const normalizedKey = enseignementKey.toLowerCase().trim();
        if (
          normalizedKey.includes(normalizedSearch) ||
          normalizedSearch.includes(normalizedKey)
        ) {
          return {
            ueName,
            ueCoef: ueData.coef,
            enseignementCoef: coef,
          };
        }
      }
    }
  }

  return null;
};

/**
 * Organise les modules selon les UE définies dans les coefficients
 */
export const organizeModulesByUE = (processedData, coefficientsData) => {
  const userGroup = detectUserGroup(processedData);

  if (!coefficientsData?.groups?.[userGroup]) {
    return {
      organizedUEs: {},
      unmappedModules: processedData,
      userGroup,
      error: `Groupe ${userGroup} non trouvé dans la configuration des coefficients`,
    };
  }

  const organizedUEs = {};
  const unmappedModules = {};

  // Initialiser les UEs
  const UEs = coefficientsData.groups[userGroup].UE;
  UEs.forEach((ue) => {
    const ueName = Object.keys(ue)[0];
    const ueData = ue[ueName][0];
    organizedUEs[ueName] = {
      coef: ueData.coef,
      modules: {},
      totalWeightedScore: 0,
      totalCoefficients: 0,
      average: 0,
    };
  });

  // Organiser chaque module
  Object.entries(processedData).forEach(([moduleName, moduleData]) => {
    const ueInfo = findUEForEnseignement(
      moduleName,
      coefficientsData,
      userGroup
    );

    if (ueInfo) {
      // Module trouvé dans une UE
      const ue = organizedUEs[ueInfo.ueName];
      ue.modules[moduleName] = {
        ...moduleData,
        enseignementCoef: ueInfo.enseignementCoef,
        ueName: ueInfo.ueName,
      };

      // Calculer les totaux pondérés pour l'UE
      if (moduleData.average && ueInfo.enseignementCoef > 0) {
        ue.totalWeightedScore += moduleData.average * ueInfo.enseignementCoef;
        ue.totalCoefficients += ueInfo.enseignementCoef;
      }
    } else {
      // Module non mappé
      unmappedModules[moduleName] = moduleData;
    }
  });

  // Calculer les moyennes des UEs
  Object.values(organizedUEs).forEach((ue) => {
    if (ue.totalCoefficients > 0) {
      ue.average = ue.totalWeightedScore / ue.totalCoefficients;
    }
  });

  return {
    organizedUEs,
    unmappedModules,
    userGroup,
    error: null,
  };
};

/**
 * Calcule la moyenne générale pondérée par les coefficients des UEs
 */
export const calculateGeneralAverage = (organizedUEs) => {
  let totalWeightedScore = 0;
  let totalCoefficients = 0;

  Object.values(organizedUEs).forEach((ue) => {
    if (ue.average > 0 && ue.coef > 0) {
      totalWeightedScore += ue.average * ue.coef;
      totalCoefficients += ue.coef;
    }
  });

  return totalCoefficients > 0 ? totalWeightedScore / totalCoefficients : 0;
};

/**
 * Met à jour les moyennes après modification d'une note
 */
export const updateAveragesAfterNoteChange = (
  organizedData,
  moduleName,
  newModuleData
) => {
  const { organizedUEs, unmappedModules } = organizedData;

  // Trouver dans quelle UE se trouve le module
  let targetUE = null;
  let targetUEName = null;

  Object.entries(organizedUEs).forEach(([ueName, ue]) => {
    if (ue.modules[moduleName]) {
      targetUE = ue;
      targetUEName = ueName;
    }
  });

  if (targetUE) {
    // Mettre à jour le module dans l'UE
    const enseignementCoef = targetUE.modules[moduleName].enseignementCoef;
    targetUE.modules[moduleName] = {
      ...newModuleData,
      enseignementCoef,
      ueName: targetUEName,
    };

    // Recalculer les totaux de l'UE
    targetUE.totalWeightedScore = 0;
    targetUE.totalCoefficients = 0;

    Object.values(targetUE.modules).forEach((module) => {
      if (module.average && module.enseignementCoef > 0) {
        targetUE.totalWeightedScore += module.average * module.enseignementCoef;
        targetUE.totalCoefficients += module.enseignementCoef;
      }
    });

    // Recalculer la moyenne de l'UE
    targetUE.average =
      targetUE.totalCoefficients > 0
        ? targetUE.totalWeightedScore / targetUE.totalCoefficients
        : 0;
  } else {
    // Module dans les non mappés
    unmappedModules[moduleName] = newModuleData;
  }

  return {
    organizedUEs,
    unmappedModules,
  };
};
