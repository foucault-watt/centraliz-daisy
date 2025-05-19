import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AuthPage from "./pages/AuthPage.jsx";
// Importer les pages qui seront utilisées par Layout
// NotesPage est maintenant importé dans Layout.jsx
import LandingPage from "./pages/LandingPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";

// La définition de NotesPage est retirée d'ici, car elle est dans son propre fichier
// et importée directement par Layout.jsx

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/callback" element={<AuthPage />} />

      <Route element={<ProtectedRoute onboardingRequired={false} />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Route>

      <Route element={<ProtectedRoute onboardingRequired={true} />}>
        {/* Toutes les routes commençant par /app rendront le composant Layout.
            Layout utilisera ensuite location.pathname pour déterminer quel onglet/contenu afficher. */}
        <Route path="/app/*" element={<Layout />} />
        {/* Les routes enfants spécifiques ci-dessous ne sont plus nécessaires si Layout gère tout via /app/* 
            et son propre mécanisme de tab.content. Les garder ne nuirait pas mais ne serait pas utilisé
            par un <Outlet /> dans Layout.
        <Route path="/app" element={<Layout />}>
          <Route index element={<CalendarPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="notes" element={<NotesPage />} /> // NotesPage n'est plus défini ici
          <Route path="bibli" element={<BibliPage />} />
        </Route>
        */}
      </Route>

      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
