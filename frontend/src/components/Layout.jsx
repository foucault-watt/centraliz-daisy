import {
  Calendar1,
  Ellipsis,
  FileText,
  LogOut,
  MessageSquareHeart,
  Scale,
  Settings,
  Users,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import AdminPage from "../pages/app/AdminPage.jsx";
import BibliPage from "../pages/app/BibliPage.jsx";
import CalendarPage from "../pages/app/CalendarPage.jsx";
import NotesPage from "../pages/app/NotesPage.jsx";
import SettingsPage from "../pages/app/SettingsPage.jsx";

const tabsData = [
  {
    id: "calendar",
    label: "Calendriers",
    path: "/app/calendar",
    icon: <Calendar1 size={18} />,
    content: <CalendarPage />,
  },
  {
    id: "notes",
    label: "Notes",
    path: "/app/notes",
    icon: <FileText size={18} />,
    content: <NotesPage />,
  },
  {
    id: "bibli",
    label: "Bibli",
    path: "/app/bibli",
    icon: <FileText size={18} />,
    content: <BibliPage />,
  },
];

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState(
    tabsData.find((tab) => tab.path === location.pathname)?.id ||
      tabsData[0]?.id ||
      null
  );

  // Gestion du changement d'onglet
  const handleTabChange = (tab) => {
    setActiveTab(tab.id);
    navigate(tab.path);
  };

  // Synchroniser l'onglet actif avec l'URL
  useEffect(() => {
    const currentTab = tabsData.find((tab) => tab.path === location.pathname);
    if (currentTab && currentTab.id !== activeTab) {
      setActiveTab(currentTab.id);
    } else if (
      !currentTab &&
      location.pathname.startsWith("/app/") &&
      tabsData.length > 0 &&
      location.pathname !== "/app/admin" // Ne pas réinitialiser l'onglet si on est sur la page admin
    ) {
      // Si l'URL est une sous-route de /app/ mais ne correspond à aucun onglet direct,
      // on peut choisir de mettre le premier onglet comme actif ou aucun.
      // Pour l'instant, si on est sur /app/calendar, activeTab sera 'calendar'.
      // Si on est sur /app/unknown, activeTab pourrait rester sur le précédent ou le premier.
      // On met à jour activeTab seulement si un onglet correspond au pathname exact.
    }
  }, [location.pathname, activeTab]);

  const handleLogout = async () => {
    await logout();
    // La redirection est gérée dans la fonction logout du AuthContext
    // ou par ProtectedRoute qui détectera que l'utilisateur n'est plus authentifié.
    // navigate("/"); // Redirection explicite si nécessaire, mais AuthContext devrait le gérer.
  };

  return (
    <div className="preview min-h-screen bg-base-100 geist">
      <div className="navbar bg-base-100 shadow-sm px-5 border-b border-base-300">
        <div className="h-10 w-10 flex-none rounded-box overflow-hidden ">
          <Logo />
        </div>
        <div className="flex-1">
          <button
            className="btn btn-ghost text-xl normal-case"
            onClick={() => navigate("/app/calendar")}
          >
            Centraliz
          </button>
        </div>
        <div className="flex-none">
          <div className="dropdown dropdown-hover dropdown-end">
            <div tabIndex={0} role="button" className="btn m-1 btn-ghost">
              <Ellipsis size={24} />
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow-sm mt-2"
            >
              <li>
                <a>
                  <MessageSquareHeart size={18} />
                  Feedbacks<div className="badge badge-accent">Dis bien</div>
                </a>
              </li>
              {isAdmin && (
                <li>
                  <a onClick={() => navigate("/app/admin")}>
                    <Users size={18} />
                    Administration
                  </a>
                </li>
              )}
              <div className="divider my-1"></div>
              <li>
                <a onClick={() => navigate("/app/settings")}>
                  <Settings size={18} />
                  Paramètres
                </a>
              </li>
              <li>
                <a>
                  <Scale size={18} />
                  Mentions légales
                </a>
              </li>
              <div className="divider my-1"></div>
              <li>
                <button
                  onClick={handleLogout}
                  className="btn btn-ghost w-full justify-start"
                >
                  <LogOut size={18} className="text-error" />
                  <span className="text-error">Déconnexion</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex-none">
          <input
            type="checkbox"
            value="dracula"
            className="toggle theme-controller ml-4"
          />
        </div>
      </div>
      <div className="container mx-auto p-4">
        {location.pathname === "/app/admin" ? (
          <AdminPage />
        ) : location.pathname === "/app/settings" ? (
          <SettingsPage />
        ) : (
          <div role="tablist" className="tabs tabs-lifted">
            {tabsData.map((tab) => (
              <React.Fragment key={tab.id}>
                <input
                  type="radio"
                  name="app_tabs"
                  role="tab"
                  className="tab"
                  aria-label={tab.label}
                  checked={activeTab === tab.id}
                  onChange={() => handleTabChange(tab)}
                  id={`tab-${tab.id}`}
                  readOnly
                />
                <div
                  role="tabpanel"
                  className="tab-content bg-base-100 border-base-300 rounded-box p-6"
                >
                  {tab.content}
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Layout;
