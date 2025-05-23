import axios from "axios";
import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import ConfigManager from "../../components/admin/ConfigManager";
import JsonEditor from "../../components/admin/JsonEditor";
import LogViewer from "../../components/admin/LogViewer";
import { useAuth } from "../../context/AuthContext";

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [activeTab, setActiveTab] = useState("logs");
  const [coefficientsConfig, setCoefficientsConfig] = useState({});
  const [loadingCoefficients, setLoadingCoefficients] = useState(false);
  const [errorCoefficients, setErrorCoefficients] = useState(null);
  const { isAdmin } = useAuth();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/users`,
        { withCredentials: true }
      );
      setUsers(response.data.users);
      setError(null);
    } catch (err) {
      console.error("Erreur lors du chargement des utilisateurs:", err);
      setError("Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCoefficientsConfig = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingCoefficients(true);
    setErrorCoefficients(null);
    try {
      const response = await fetch("/api/admin/coefficients", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) {
        throw new Error(
          `Erreur lors de la récupération de la configuration des coefficients: ${response.statusText}`
        );
      }
      const data = await response.json();
      setCoefficientsConfig(data.config || {});
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la configuration des coefficients:",
        error
      );
      setErrorCoefficients(error.message);
    } finally {
      setLoadingCoefficients(false);
    }
  }, [isAdmin]);

  // Effet qui se déclenche uniquement lors du changement d'onglet vers "users"
  useEffect(() => {
    if (isAdmin && activeTab === "users" && users.length === 0) {
      fetchUsers();
    }
    if (isAdmin && activeTab === "coefficients") {
      fetchCoefficientsConfig();
    }
  }, [isAdmin, activeTab, users.length, fetchCoefficientsConfig]);

  const handleEdit = (user) => {
    setEditingUser(user.userName);
    setEditForm({
      displayName: user.displayName || "",
      group: user.group || "",
      isAdmin: !!user.isAdmin,
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({});
  };

  const handleSaveEdit = async (userName) => {
    try {
      setLoading(true);
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/users/${userName}`,
        editForm,
        { withCredentials: true }
      );

      // Mettre à jour l'utilisateur dans le state local
      setUsers(
        users.map((user) =>
          user.userName === userName ? { ...user, ...editForm } : user
        )
      );

      setEditingUser(null);
      setEditForm({});
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'utilisateur:", err);
      setError("Impossible de mettre à jour l'utilisateur.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userName) => {
    if (
      !confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userName} ?`)
    ) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/users/${userName}`,
        { withCredentials: true }
      );

      // Supprimer l'utilisateur du state local
      setUsers(users.filter((user) => user.userName !== userName));
    } catch (err) {
      console.error("Erreur lors de la suppression de l'utilisateur:", err);
      setError("Impossible de supprimer l'utilisateur.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCoefficients = async (newConfig) => {
    if (!isAdmin) return;
    setLoadingCoefficients(true);
    setErrorCoefficients(null);
    try {
      const response = await fetch("/api/admin/coefficients", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ config: newConfig }),
      });
      if (!response.ok) {
        throw new Error(
          `Erreur lors de la mise à jour de la configuration des coefficients: ${response.statusText}`
        );
      }
      const data = await response.json();
      setCoefficientsConfig(data.config || {});
      alert("Configuration des coefficients mise à jour avec succès !");
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour de la configuration des coefficients:",
        error
      );
      setErrorCoefficients(error.message);
      alert(
        `Erreur lors de la mise à jour de la configuration des coefficients: ${error.message}`
      );
    } finally {
      setLoadingCoefficients(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <AlertCircle size={48} className="text-error mb-4" />
        <h2 className="text-2xl font-bold mb-2">Accès refusé</h2>
        <p>
          Vous n'avez pas les permissions d'administrateur nécessaires pour
          accéder à cette page.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-base-200 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-primary">
        Page d'administration
      </h1>

      <div role="tablist" className="tabs tabs-lifted tabs-lg">
        <button
          role="tab"
          className={`tab ${activeTab === "logs" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("logs")}
        >
          Logs
        </button>
        <button
          role="tab"
          className={`tab ${activeTab === "users" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Utilisateurs
        </button>
        <button
          role="tab"
          className={`tab ${activeTab === "config" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("config")}
        >
          Configuration Générale
        </button>
        <button
          role="tab"
          className={`tab ${activeTab === "coefficients" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("coefficients")}
        >
          Coefficients
        </button>
      </div>

      <div className="mt-8 p-6 bg-base-100 rounded-box shadow-xl">
        {activeTab === "logs" && <LogViewer />}
        {activeTab === "users" && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-accent">
              Gestion des utilisateurs
            </h2>
            {loading && <p>Chargement des utilisateurs...</p>}
            {error && <p className="text-error">{error}</p>}
            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Nom d'utilisateur</th>
                      <th>Nom d'affichage</th>
                      <th>Groupe</th>
                      <th>Admin</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.userName}>
                        {editingUser === user.userName ? (
                          <>
                            <td>{user.userName}</td>
                            <td>
                              <input
                                type="text"
                                value={editForm.displayName || ""}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    displayName: e.target.value,
                                  })
                                }
                                className="input input-bordered input-sm w-full"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={editForm.group || ""}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    group: e.target.value,
                                  })
                                }
                                className="input input-bordered input-sm w-full"
                              />
                            </td>
                            <td>
                              <input
                                type="checkbox"
                                checked={editForm.isAdmin || false}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    isAdmin: e.target.checked,
                                  })
                                }
                                className="checkbox checkbox-sm"
                              />
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-success mr-2"
                                onClick={() => handleSaveEdit(user.userName)}
                              >
                                Enregistrer
                              </button>
                              <button
                                className="btn btn-sm btn-ghost"
                                onClick={handleCancelEdit}
                              >
                                Annuler
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{user.userName}</td>
                            <td>{user.displayName}</td>
                            <td>{user.group}</td>
                            <td>{user.isAdmin ? "Oui" : "Non"}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline btn-info mr-2"
                                onClick={() => handleEdit(user)}
                              >
                                Modifier
                              </button>
                              <button
                                className="btn btn-sm btn-outline btn-error"
                                onClick={() => handleDeleteUser(user.userName)}
                              >
                                Supprimer
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {activeTab === "config" && <ConfigManager />}
        {activeTab === "coefficients" && (
          <div /*className="prose max-w-none"*/>
            {" "}
            {/* Suppression de prose pour un contrôle plus direct */}
            <h2 className="text-2xl font-semibold mb-4 text-accent">
              Gestion des Coefficients
            </h2>
            {loadingCoefficients && (
              <div className="flex justify-center items-center h-64">
                <span className="loading loading-lg loading-spinner text-primary"></span>
              </div>
            )}
            {errorCoefficients && (
              <div role="alert" className="alert alert-error">
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
                <span>Erreur! {errorCoefficients}</span>
              </div>
            )}
            {!loadingCoefficients && !errorCoefficients && (
              <JsonEditor
                initialJson={coefficientsConfig}
                onSave={handleSaveCoefficients}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
