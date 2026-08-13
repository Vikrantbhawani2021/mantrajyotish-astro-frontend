import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Forgot from "./pages/Forgot";
import ResetPassword from "./pages/ResetPassword";
import CreateProfile from "./pages/CreateProfile";
import PendingApproval from "./pages/PendingApproval";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("astrologerToken");
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Inspect onboarding and approval status
  const userRaw = localStorage.getItem("astrologerUser");
  if (userRaw) {
    try {
      const user = JSON.parse(userRaw);
      if (user.status !== "approved" && !user.isVerified) {
        const profileDraft = localStorage.getItem("astrologer_profile_data") || localStorage.getItem("astrologer_profile_draft");
        if (!profileDraft && !user.name) {
          return <Navigate to="/create-profile" replace />;
        }
        return <Navigate to="/pending-approval" replace />;
      }
    } catch (e) {
      console.error("Error parsing user onboarding status:", e);
    }
  }

  return children;
}

function PublicRoute({ children }) {
  const token = localStorage.getItem("astrologerToken");
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function AppContent() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("astrologerToken");
    localStorage.removeItem("astrologerUser");
    navigate("/login");
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to={localStorage.getItem("astrologerToken") ? "/dashboard" : "/login"} replace />} />
      <Route
        path="/home"
        element={
          <PublicRoute>
            <Login
              onLoginSuccess={() => navigate("/dashboard")}
              onNavigateToSignup={() => navigate("/create-profile")}
              onNavigateToForgot={() => navigate("/forgot")}
            />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login
              onLoginSuccess={() => navigate("/dashboard")}
              onNavigateToSignup={() => navigate("/create-profile")}
              onNavigateToForgot={() => navigate("/forgot")}
            />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup
              onSignupSuccess={() => navigate("/create-profile")}
              onNavigateToLogin={() => navigate("/home")}
            />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot"
        element={
          <PublicRoute>
            <Forgot
              onNavigateToLogin={() => navigate("/home")}
              onNavigateToResetPassword={() => navigate("/reset-password")}
            />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword
              onNavigateToLogin={() => navigate("/home")}
            />
          </PublicRoute>
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
        element={
          <ProtectedRoute>
            <Dashboard onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/wallet"
        element={
          <ProtectedRoute>
            <Dashboard onLogout={handleLogout} initialOpenWithdraw={false} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/withdraw"
        element={
          <ProtectedRoute>
            <Dashboard onLogout={handleLogout} initialOpenWithdraw={true} />
          </ProtectedRoute>
        }
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