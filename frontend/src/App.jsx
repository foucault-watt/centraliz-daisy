import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AuthPage from "./pages/AuthPage.jsx";
// Importer les pages qui seront utilisées par Layout
import LandingPage from "./pages/LandingPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";


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
