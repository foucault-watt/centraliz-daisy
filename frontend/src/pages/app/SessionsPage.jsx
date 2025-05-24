import axios from "axios";
import { Laptop, MonitorSpeaker, Smartphone, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";

const SessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/sessions/my-sessions`,
        { withCredentials: true }
      );
      setSessions(response.data.sessions || []);
      setError(null);
    } catch (error) {
      console.error("Erreur lors de la récupération des sessions:", error);
      setError("Impossible de récupérer vos sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId) => {
    try {
      await axios.delete(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/sessions/my-sessions/${sessionId}`,
        { withCredentials: true }
      );
      setSessions(sessions.filter((session) => session.id !== sessionId));
    } catch (error) {
      console.error("Erreur lors de la révocation de la session:", error);
      setError("Impossible de révoquer cette session");
    }
  };

  const handleRevokeAllSessions = async () => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir révoquer toutes vos sessions ? Vous devrez vous reconnecter sur tous vos appareils."
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/sessions/my-sessions`,
        { withCredentials: true }
      );
      setSessions([]);
    } catch (error) {
      console.error(
        "Erreur lors de la révocation de toutes les sessions:",
        error
      );
      setError("Impossible de révoquer toutes les sessions");
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

  const getDeviceIcon = () => {
    // Simple heuristique basée sur la taille d'écran pour déterminer le type d'appareil
    const width = window.screen.width;
    if (width < 768) {
      return <Smartphone size={20} />;
    } else if (width < 1024) {
      return <MonitorSpeaker size={20} />;
    } else {
      return <Laptop size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Gestion des sessions</h1>
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des sessions</h1>
        {sessions.length > 0 && (
          <button
            onClick={handleRevokeAllSessions}
            className="btn btn-error btn-sm"
          >
            <Trash2 size={16} />
            Révoquer tout
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Sessions actives</h2>
          <p className="text-base-content/70 mb-4">
            Ces appareils ont accès à votre compte grâce à la fonction "Se
            souvenir de moi". Révoquiez l'accès aux appareils que vous ne
            reconnaissez pas.
          </p>

          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-base-content/50 mb-2">
                <MonitorSpeaker size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Aucune session active
              </h3>
              <p className="text-base-content/70">
                Vous n'avez aucune session "Se souvenir de moi" active.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border border-base-300 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-primary">{getDeviceIcon()}</div>
                    <div>
                      <div className="font-medium">Appareil inconnu</div>
                      <div className="text-sm text-base-content/70">
                        Créé le {formatDate(session.createdAt)}
                      </div>
                      <div className="text-sm text-base-content/70">
                        Dernière utilisation : {formatDate(session.lastUsedAt)}
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
          )}
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm mt-6">
        <div className="card-body">
          <h2 className="card-title">À propos des sessions</h2>
          <div className="space-y-2 text-sm text-base-content/70">
            <p>• Les sessions "Se souvenir de moi" durent 30 jours</p>
            <p>• Vous pouvez avoir jusqu'à 10 sessions actives simultanément</p>
            <p>
              • Les sessions expirent automatiquement après 30 jours
              d'inactivité
            </p>
            <p>
              • Révoquiez immédiatement les sessions des appareils perdus ou
              volés
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionsPage;
