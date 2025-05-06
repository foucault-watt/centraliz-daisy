import {
  Calendar1,
  CalendarDays,
  Ellipsis,
  FileText,
  Mail,
  MessageSquareHeart,
  Scale,
  Settings,
} from "lucide-react";
import React from "react";
import BibliPage from "./pages/BibliPage.jsx";
import {
  NavLink,
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import Logo from "./assets/Logo.jsx";

// Composants de page
const CalendarPage = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold">Calendries</h1>
    <p className="mt-4">
      Gérez vos calendriers ici. Vous pouvez ajouter, modifier ou supprimer des
      événements.
    </p>
  </div>
);

const MailPage = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold">Mails</h1>
    <p className="mt-4 ">
      Gérez vos mails ici. Vous pouvez envoyer, recevoir et organiser vos mails
      facilement.
      <CalendarDays />
    </p>
  </div>
);

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
    content: <MailPage />,
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
    content: <BibliPage/>,
  },
];

function App() {
  return (
    <Router>
      <div className="preview min-h-screen bg-base-100 geist">
        <div class="navbar bg-base-100 shadow-sm px-5 border-b-1 border-base-300">
          <div class="h-10 w-10 flex-none rounded-box overflow-auto ">
            <Logo />
          </div>
          <div class="flex-1">
            <a class="btn btn-ghost text-xl">Centraliz</a>
          </div>

          <div class="flex-none">
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

          <div class="flex-none">
            <input
              type="checkbox"
              value="cyberpunk"
              className="toggle theme-controller ml-4"
            />
          </div>
        </div>
        <div className="container mx-auto p-4">
          <div role="tablist" className="tabs tabs-lift">
            {tabsData.map((tab) => (
              <NavLink
                key={tab.id}
                to={tab.path}
                className={({ isActive }) =>
                  isActive ? "tab tab-active" : "tab"
                }
                aria-label={tab.label}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </NavLink>
            ))}
          </div>
          <div className="p-6 bg-base-100 border border-base-300 rounded-box">
            <Routes>
              {tabsData.map((tab) => (
                <Route key={tab.id} path={tab.path} element={tab.content} />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
