import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx"; // Importer AuthProvider
import AuthPage from "./pages/AuthPage.jsx";
// Importer les pages qui seront utilisées par Layout
import LandingPage from "./pages/LandingPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      {/* AuthPage est principalement un point de redirection après le callback CAS,
          mais avec AuthContext, sa logique de vérification d'état sera simplifiée. */}
      <Route path="/auth" element={<AuthPage />} />{" "}
      {/* Changé /auth/callback en /auth */}
      {/* ProtectedRoute pour OnboardingPage:
          - requiert authentification (isAuthenticated)
          - ne requiert PAS que l'onboarding soit déjà fait (onboardingRequired = false implicitement ou explicitement)
          - si l'onboarding EST fait, redirige vers /app/calendar
      */}
      <Route element={<ProtectedRoute onboardingSpecific={true} />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Route>
      {/* ProtectedRoute pour les routes /app/*:
          - requiert authentification (isAuthenticated)
          - requiert que l'onboarding soit fait (onboardingRequired = true)
      */}
      <Route element={<ProtectedRoute onboardingRequired={true} />}>
        <Route path="/app/*" element={<Layout />} />
      </Route>
      {/* Fallback pour les routes non trouvées */}
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        {" "}
        {/* AuthProvider englobe AppRoutes */}
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
