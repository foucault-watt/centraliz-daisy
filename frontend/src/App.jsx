import {
  Calendar1,
  Ellipsis,
  FileText,
  Mail,
  MessageSquareHeart,
  Scale,
  Settings,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Logo from "./assets/Logo.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import BibliPage from "./pages/BibliPage.jsx";
import CalendarPage from "./pages/CalendarPage.jsx";

const NotesPage = () => (
  <div className="p-6 bg-base-200">
    <h1 className="text-2xl font-bold">Notes</h1>
    <p className="mt-4">
      Prenez des notes ici. Vous pouvez créer, modifier et supprimer vos notes
      rapidement.
    </p>
  </div>
);

const tabsData = [
  {
    id: "calendar",
    label: "Calendriers",
    path: "/",
    icon: <Calendar1 size={18} />,
    content: <CalendarPage />,
  },
  {
    id: "mail",
    label: "Mails",
    path: "/mail",
    icon: <Mail size={18} />,
    content: <AuthPage />,
  },
  {
    id: "notes",
    label: "Notes",
    path: "/notes",
    icon: <FileText size={18} />,
    content: <NotesPage />,
  },
  {
    id: "Bibli",
    label: "Bibli",
    path: "/bibli",
    icon: <FileText size={18} />,
    content: <BibliPage />,
  },
];

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    tabsData.find((tab) => tab.path === location.pathname)?.id || tabsData[0].id
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
    }
  }, [location.pathname, activeTab]);

  return (
    <div className="preview min-h-screen bg-base-100 geist">
      <div className="navbar bg-base-100 shadow-sm px-5 border-b-1 border-base-300">
        <div className="h-10 w-10 flex-none rounded-box overflow-auto ">
          <Logo />
        </div>
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">Centraliz</a>
        </div>

        <div className="flex-none">
          <div className="dropdown dropdown-hover dropdown-end">
            <div tabIndex={0} role="button" className="btn m-1 btn-ghost">
              <Ellipsis size={24} />
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm"
            >
              <li>
                <a>
                  <MessageSquareHeart size={18} />
                  Feedbacks
                </a>
              </li>
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
            </ul>
          </div>
        </div>

        <div className="flex-none">
          <input
            type="checkbox"
            value="synthwave"
            className="toggle theme-controller ml-4"
          />
        </div>
      </div>
      <div className="container mx-auto p-4">
        {/* Structure des onglets avec input radio selon la demande */}
        <div className="tabs tabs-lift">
          {tabsData.map((tab) => (
            <React.Fragment key={tab.id}>
              <input
                type="radio"
                name="app_tabs"
                className="tab"
                aria-label={tab.label}
                checked={activeTab === tab.id}
                onChange={() => handleTabChange(tab)}
                id={`tab-${tab.id}`}
              />
              <div className="tab-content bg-base-100 border-base-300 p-6">
                {tab.content}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<AppContent />} />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </Router>
  );
}

export default App;
