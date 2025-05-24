import axios from "axios";
import {
  Laptop,
  MonitorSpeaker,
  Shield,
  Smartphone,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

const AdminSessionsManager = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction pour formater les informations de l'appareil
  const formatDeviceInfo = (deviceInfo) => {
    if (!deviceInfo || typeof deviceInfo !== "object") {
      return "Informations non disponibles";
    }

    const info = [];

    // Informations principales
    if (deviceInfo.browser) info.push(`${deviceInfo.browser}`);
    if (deviceInfo.os) info.push(`${deviceInfo.os}`);
    if (
      deviceInfo.screenResolution &&
      deviceInfo.screenResolution !== "unknown"
    ) {
      info.push(`${deviceInfo.screenResolution}`);
    }
    if (deviceInfo.timezone && deviceInfo.timezone !== "unknown") {
      info.push(`${deviceInfo.timezone}`);
    }

    // Informations du frontend si disponibles
    if (deviceInfo.frontendDetected) {
      const frontend = deviceInfo.frontendDetected;
      if (frontend.touchSupport !== undefined && frontend.touchSupport) {
        info.push("Tactile");
      }
      if (frontend.connectionType && frontend.connectionType !== "unknown") {
        info.push(`${frontend.connectionType}`);
      }
    }

    return info.length > 0 ? info.join(" • ") : "Informations limitées";
  };

  const fetchAllSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/sessions/all-sessions`,
        { withCredentials: true }
      );
      setSessions(response.data.sessions || []);
      setError(null);
    } catch (error) {
      console.error("Erreur lors de la récupération des sessions:", error);
      setError("Impossible de récupérer les sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSessions();
  }, []);
  const handleRevokeSession = async (sessionId) => {
    if (!confirm("Êtes-vous sûr de vouloir révoquer cette session ?")) {
      return;
    }

    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/sessions/${sessionId}`,
        { withCredentials: true }
      );
      setSessions(sessions.filter((session) => session.id !== sessionId));
    } catch (error) {
      console.error("Erreur lors de la révocation de la session:", error);
      setError("Impossible de révoquer cette session");
    }
  };

  const handleCleanupExpiredSessions = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/sessions/cleanup`,
        {},
        { withCredentials: true }
      );
      fetchAllSessions(); // Recharger la liste
    } catch (error) {
      console.error("Erreur lors du nettoyage:", error);
      setError("Impossible de nettoyer les sessions expirées");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const getDeviceIcon = (deviceInfo) => {
    if (!deviceInfo) return <MonitorSpeaker size={20} />;

    // Vérifier d'abord les informations du frontend
    if (deviceInfo.frontendDetected) {
      if (deviceInfo.frontendDetected.isMobile) {
        return <Smartphone size={20} />;
      }
      if (deviceInfo.frontendDetected.isTablet) {
        return <Laptop size={20} />;
      }
    }

    // Puis les informations du serveur
    if (deviceInfo.isMobile) {
      return <Smartphone size={20} />;
    }

    return <MonitorSpeaker size={20} />;
  };

  const getSessionsByUser = () => {
    const sessionsByUser = {};
    sessions.forEach((session) => {
      if (!sessionsByUser[session.userName]) {
        sessionsByUser[session.userName] = {
          displayName: session.displayName,
          sessions: [],
        };
      }
      sessionsByUser[session.userName].sessions.push(session);
    });
    return sessionsByUser;
  };

  const getTotalActiveSessions = () => sessions.length;
  const getUniqueUsers = () => new Set(sessions.map((s) => s.userName)).size;

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  const sessionsByUser = getSessionsByUser();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestion des sessions</h2>
        <button
          onClick={handleCleanupExpiredSessions}
          className="btn btn-primary btn-sm"
        >
          <Shield size={16} />
          Nettoyer les sessions expirées
        </button>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-primary">
            <MonitorSpeaker size={32} />
          </div>
          <div className="stat-title">Sessions actives</div>
          <div className="stat-value text-primary">
            {getTotalActiveSessions()}
          </div>
        </div>

        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-secondary">
            <Users size={32} />
          </div>
          <div className="stat-title">Utilisateurs connectés</div>
          <div className="stat-value text-secondary">{getUniqueUsers()}</div>
        </div>

        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-figure text-accent">
            <Shield size={32} />
          </div>
          <div className="stat-title">Durée max</div>
          <div className="stat-value text-accent">30j</div>
        </div>
      </div>

      {/* Liste des sessions par utilisateur */}
      <div className="space-y-6">
        {Object.entries(sessionsByUser).length === 0 ? (
          <div className="text-center py-8">
            <div className="text-base-content/50 mb-2">
              <MonitorSpeaker size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Aucune session active
            </h3>
            <p className="text-base-content/70">
              Aucun utilisateur n'a de session "Se souvenir de moi" active.
            </p>
          </div>
        ) : (
          Object.entries(sessionsByUser).map(([userName, userData]) => (
            <div key={userName} className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="avatar placeholder">
                      <div className="bg-primary text-primary-content w-12 rounded-full">
                        <span className="text-xl">
                          {userData.displayName?.charAt(0) ||
                            userName?.charAt(0) ||
                            "?"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold">
                        {userData.displayName || userName}
                      </div>
                      <div className="text-sm text-base-content/70">
                        {userName}
                      </div>
                      <div className="text-sm text-base-content/70">
                        {userData.sessions.length} session
                        {userData.sessions.length > 1 ? "s" : ""} active
                        {userData.sessions.length > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {userData.sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 border border-base-300 rounded-lg bg-base-50"
                    >
                      {" "}
                      <div className="flex items-center space-x-3">
                        <div className="text-primary">
                          {getDeviceIcon(session.deviceInfo)}
                        </div>
                        <div>
                          <div className="font-medium">
                            {session.deviceInfo
                              ? formatDeviceInfo(session.deviceInfo)
                              : "Appareil inconnu"}
                          </div>
                          <div className="text-sm text-base-content/70">
                            IP: {session.deviceInfo?.ip || "Inconnue"}
                          </div>
                          <div className="text-sm text-base-content/70">
                            Créé le {formatDate(session.createdAt)}
                          </div>
                          <div className="text-sm text-base-content/70">
                            Dernière utilisation :{" "}
                            {formatDate(session.lastUsedAt)}
                          </div>
                          <div className="text-sm text-base-content/70">
                            Expire le : {formatDate(session.expiresAt)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="btn btn-error btn-sm"
                      >
                        <Trash2 size={16} />
                        Révoquer
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminSessionsManager;
