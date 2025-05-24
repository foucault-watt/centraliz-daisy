// Utilitaire pour collecter des informations sur l'appareil côté client
export const getDeviceInfo = () => {
  const deviceInfo = {};

  // Informations de base du navigateur
  if (typeof window !== "undefined") {
    deviceInfo.screenResolution = `${window.screen.width}x${window.screen.height}`;
    deviceInfo.viewportSize = `${window.innerWidth}x${window.innerHeight}`;
    deviceInfo.colorDepth = window.screen.colorDepth;
    deviceInfo.pixelRatio = window.devicePixelRatio || 1;
    deviceInfo.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    deviceInfo.language = navigator.language;
    deviceInfo.languages = navigator.languages?.join(",") || navigator.language;
    deviceInfo.platform = navigator.platform;
    deviceInfo.cookieEnabled = navigator.cookieEnabled;
    deviceInfo.onlineStatus = navigator.onLine;

    // Informations sur les capacités du navigateur
    deviceInfo.localStorage = typeof Storage !== "undefined";
    deviceInfo.sessionStorage = typeof Storage !== "undefined";
    deviceInfo.indexedDB = "indexedDB" in window;
    deviceInfo.webGL = !!window.WebGLRenderingContext;
    deviceInfo.touchSupport =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;

    // Type de connexion (si disponible)
    if (navigator.connection) {
      deviceInfo.connectionType = navigator.connection.effectiveType;
      deviceInfo.downlink = navigator.connection.downlink;
      deviceInfo.rtt = navigator.connection.rtt;
      deviceInfo.saveData = navigator.connection.saveData;
    }

    // Informations sur la mémoire (si disponible)
    if (navigator.deviceMemory) {
      deviceInfo.deviceMemory = navigator.deviceMemory;
    }

    // Nombre de processeurs logiques (si disponible)
    if (navigator.hardwareConcurrency) {
      deviceInfo.cpuCores = navigator.hardwareConcurrency;
    }

    // Détection du mode sombre/clair
    if (window.matchMedia) {
      deviceInfo.prefersDarkMode = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      deviceInfo.prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
    }

    // Informations sur le canvas fingerprinting (basique)
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillText("Device fingerprint", 2, 2);
      deviceInfo.canvasFingerprint = canvas.toDataURL().slice(-50); // Derniers 50 caractères
    } catch (e) {
      deviceInfo.canvasFingerprint = "unavailable";
    }

    // Informations sur les plugins (limitées dans les navigateurs modernes)
    if (navigator.plugins) {
      deviceInfo.pluginsCount = navigator.plugins.length;
      deviceInfo.plugins = Array.from(navigator.plugins)
        .map((p) => p.name)
        .slice(0, 5); // Max 5 plugins
    }

    // Détection basique du type d'appareil
    const userAgent = navigator.userAgent;
    deviceInfo.isMobile =
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      );
    deviceInfo.isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
    deviceInfo.isDesktop = !deviceInfo.isMobile && !deviceInfo.isTablet;

    // Informations sur la batterie (si disponible et autorisé)
    if (navigator.getBattery) {
      navigator
        .getBattery()
        .then((battery) => {
          deviceInfo.batteryLevel = battery.level;
          deviceInfo.batteryCharging = battery.charging;
        })
        .catch(() => {
          deviceInfo.batteryLevel = "unavailable";
        });
    }
  }

  return deviceInfo;
};

// Fonction pour envoyer les informations via headers personnalisés
export const getCustomHeaders = () => {
  const deviceInfo = getDeviceInfo();

  return {
    "X-Screen-Resolution": deviceInfo.screenResolution || "unknown",
    "X-Viewport-Size": deviceInfo.viewportSize || "unknown",
    "X-Timezone": deviceInfo.timezone || "unknown",
    "X-Connection-Type": deviceInfo.connectionType || "unknown",
    "X-Touch-Support": deviceInfo.touchSupport ? "true" : "false",
    "X-Color-Depth": deviceInfo.colorDepth?.toString() || "unknown",
    "X-Pixel-Ratio": deviceInfo.pixelRatio?.toString() || "unknown",
    "X-CPU-Cores": deviceInfo.cpuCores?.toString() || "unknown",
    "X-Device-Memory": deviceInfo.deviceMemory?.toString() || "unknown",
    "X-Prefers-Dark-Mode": deviceInfo.prefersDarkMode ? "true" : "false",
    "X-Canvas-Fingerprint": deviceInfo.canvasFingerprint || "unknown",
  };
};
