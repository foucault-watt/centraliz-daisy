import {
  Calendar1,
  Ellipsis,
  FileText,
  MessageSquareHeart,
  Scale,
  Settings,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.jsx";
import BibliPage from "../pages/BibliPage.jsx"; // Importer la page Bibli
import CalendarPage from "../pages/CalendarPage.jsx";
import NotesPage from "../pages/NotesPage.jsx"; // Importer la page Notes

const tabsData = [
  {
    id: "calendar",
    label: "Calendriers",
    path: "/app/calendar",
    icon: <Calendar1 size={18} />, // Assurez-vous que Calendar1 est importé si utilisé ici
    content: <CalendarPage />,
  },
  {
    id: "notes",
    label: "Notes",
    path: "/app/notes",
    icon: <FileText size={18} />, // Assurez-vous que FileText est importé si utilisé ici
    content: <NotesPage />,
  },
  {
    id: "bibli",
    label: "Bibli",
    path: "/app/bibli",
    icon: <FileText size={18} />, // Idem pour FileText
    content: <BibliPage />,
  },
];

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
      tabsData.length > 0
    ) {
      // Si l'URL est une sous-route de /app/ mais ne correspond à aucun onglet direct,
      // on peut choisir de mettre le premier onglet comme actif ou aucun.
      // Pour l'instant, si on est sur /app/calendar, activeTab sera 'calendar'.
      // Si on est sur /app/unknown, activeTab pourrait rester sur le précédent ou le premier.
      // On met à jour activeTab seulement si un onglet correspond au pathname exact.
    }
  }, [location.pathname, activeTab]);

  // const handleLogout = () => { // La logique de déconnexion n'est pas dans le JSX fourni.
  //   window.location.href = `${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`;
  // };

  return (
    <div className="preview min-h-screen bg-base-100 geist">
      <div className="navbar bg-base-100 shadow-sm px-5 border-b border-base-300">
        {" "}
        {/* Changé border-b-1 en border-b */}
        <div className="h-10 w-10 flex-none rounded-box overflow-hidden ">
          <Logo />
        </div>
        <div className="flex-1">
          <a className="btn btn-ghost text-xl normal-case">Centraliz</a>{" "}
          {/* normal-case ajouté pour correspondre à l'ancien style si besoin */}
        </div>
        <div className="flex-none">
          <div className="dropdown dropdown-hover dropdown-end">
            {" "}
            {/* dropdown-hover ajouté */}
            <div tabIndex={0} role="button" className="btn m-1 btn-ghost">
              <Ellipsis size={24} />
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow-sm mt-2" // z-[1] et mt-2 pour correspondre au style précédent
            >
              <li>
                <a>
                  <MessageSquareHeart size={18} />
                  Feedbacks<div className="badge badge-accent">
                    Dis bien
                  </div>{" "}
                  {/* Texte du badge mis à jour */}
                </a>
              </li>
              <div className="divider my-1"></div>{" "}
              {/* divider-horizontal changé en divider simple */}
              <li>
                <a>
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
              {/* Le bouton de déconnexion n'est pas dans le JSX fourni */}
            </ul>
          </div>
        </div>
        <div className="flex-none">
          <input
            type="checkbox"
            value="retro"
            className="toggle theme-controller ml-4"
          />
        </div>
      </div>
      <div className="container mx-auto p-4">
        {/* Structure des onglets avec input radio selon la demande */}
        <div role="tablist" className="tabs tabs-lifted">
          {" "}
          {/* tabs-lift changé en tabs-lifted pour correspondre à la doc daisyUI */}
          {tabsData.map((tab) => (
            <React.Fragment key={tab.id}>
              <input
                type="radio"
                name="app_tabs"
                role="tab" // role="tab" ajouté
                className="tab"
                aria-label={tab.label}
                checked={activeTab === tab.id}
                onChange={() => handleTabChange(tab)}
                id={`tab-${tab.id}`} // id peut être utile pour l'accessibilité ou le test
                readOnly // Pour éviter les avertissements de React si checked est géré sans onChange direct sur l'input qui change la valeur
              />
              <div
                role="tabpanel"
                className="tab-content bg-base-100 border-base-300 rounded-box p-6"
              >
                {" "}
                {/* role="tabpanel" ajouté */}
                {/* Le contenu est affiché conditionnellement par CSS basé sur l'input radio coché */}
                {/* React rendra tous les contenus, mais CSS masquera les inactifs */}
                {tab.content}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
      {/* Pas de footer ici, conformément à "sans rien d'autres" */}
    </div>
  );
};

export default Layout;
