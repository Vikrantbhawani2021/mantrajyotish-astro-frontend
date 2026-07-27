import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Forgot from "./pages/Forgot";
import ResetPassword from "./pages/ResetPassword";
import CreateProfile from "./pages/CreateProfile";
import PendingApproval from "./pages/PendingApproval";

function AppContent() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/home"
        element={
          <Login
            onLoginSuccess={() => navigate("/dashboard")}
            onNavigateToSignup={() => navigate("/create-profile")}
            onNavigateToForgot={() => navigate("/forgot")}
          />
        }
      />
      <Route
        path="/login"
        element={
          <Login
            onLoginSuccess={() => navigate("/dashboard")}
            onNavigateToSignup={() => navigate("/create-profile")}
            onNavigateToForgot={() => navigate("/forgot")}
          />
        }
      />
      <Route
        path="/signup"
        element={
          <Signup
            onSignupSuccess={() => navigate("/create-profile")}
            onNavigateToLogin={() => navigate("/home")}
          />
        }
      />
      <Route
        path="/forgot"
        element={
          <Forgot
            onNavigateToLogin={() => navigate("/home")}
            onNavigateToResetPassword={() => navigate("/reset-password")}
          />
        }
      />
      <Route
        path="/reset-password"
        element={
          <ResetPassword
            onNavigateToLogin={() => navigate("/home")}
          />
        }
      />
      <Route
        path="/create-profile"
        element={
          <CreateProfile
            onCreateSuccess={() => navigate("/pending-approval")}
            onBack={() => navigate(-1)}
          />
        }
      />
      <Route
        path="/pending-approval"
        element={
          <PendingApproval
            onBackToProfile={() => navigate("/create-profile")}
            onGoToDashboard={() => navigate("/dashboard")}
          />
        }
      />
      <Route
        path="/dashboard"
        element={<Dashboard onLogout={() => navigate("/home")} />}
      />
      <Route
        path="/wallet"
        element={<Dashboard onLogout={() => navigate("/home")} initialOpenWithdraw={false} />}
      />
      <Route
        path="/withdraw"
        element={<Dashboard onLogout={() => navigate("/home")} initialOpenWithdraw={true} />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}