import { Monitor, Settings, Shield, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import SessionsPage from "./SessionsPage.jsx";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("sessions");
  const { user } = useAuth();

  const tabs = [
    {
      id: "sessions",
      label: "Sessions",
      icon: <Monitor size={18} />,
      component: <SessionsPage />,
    },
    {
      id: "profile",
      label: "Profil",
      icon: <User size={18} />,
      component: (
        <div className="p-6">
          <h2>Paramètres du profil (à venir)</h2>
        </div>
      ),
    },
    {
      id: "privacy",
      label: "Confidentialité",
      icon: <Shield size={18} />,
      component: (
        <div className="p-6">
          <h2>Paramètres de confidentialité (à venir)</h2>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Settings size={24} className="mr-2" />
        <h1 className="text-3xl font-bold">Paramètres</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <ul className="menu menu-vertical w-full">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 ${
                        activeTab === tab.id ? "active" : ""
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* User Info Card */}
          <div className="card bg-base-100 shadow-sm mt-4">
            <div className="card-body p-4">
              <div className="flex items-center space-x-3">
                <div className="avatar placeholder">
                  <div className="bg-primary text-primary-content w-12 rounded-full">
                    <span className="text-xl">
                      {user?.displayName?.charAt(0) ||
                        user?.userName?.charAt(0) ||
                        "?"}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="font-semibold">
                    {user?.displayName || user?.userName}
                  </div>
                  <div className="text-sm text-base-content/70">
                    {user?.userName}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="card bg-base-100 shadow-sm">
            {tabs.find((tab) => tab.id === activeTab)?.component}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
