import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, useParams } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Forgot from "./pages/Forgot";
import ResetPassword from "./pages/ResetPassword";
import CreateProfile from "./pages/CreateProfile";
import PendingApproval from "./pages/PendingApproval";
import { toggleOnlineApi } from "./config/api";

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
      // If status is not approved, always send them to pending-approval screen to view interview & meeting link
      if (user.status !== "approved" && !user.isVerified) {
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
    const userRaw = localStorage.getItem("astrologerUser");
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        if (user.status !== "approved" && !user.isVerified) {
          return <Navigate to="/pending-approval" replace />;
        }
      } catch (e) {}
    }
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function AppContent() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    // 1. Instantly set local status state to offline
    localStorage.setItem("astro_is_online", "false");
    // 2. Update backend to offline immediately before clearing tokens
    try {
      await toggleOnlineApi(false);
    } catch (e) {
      console.warn("Status offline update skipped on logout:", e.message);
    }
    // 3. Clear storage and redirect
    localStorage.removeItem("astrologerToken");
    localStorage.removeItem("astrologerUser");
    localStorage.removeItem("astro_is_online");
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
              onLoginSuccess={() => {
                const uRaw = localStorage.getItem("astrologerUser");
                if (uRaw) {
                  try {
                    const u = JSON.parse(uRaw);
                    if (u.status !== "approved" && !u.isVerified) {
                      navigate("/pending-approval");
                      return;
                    }
                  } catch (e) {}
                }
                navigate("/dashboard");
              }}
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
              onLoginSuccess={() => {
                const uRaw = localStorage.getItem("astrologerUser");
                if (uRaw) {
                  try {
                    const u = JSON.parse(uRaw);
                    if (u.status !== "approved" && !u.isVerified) {
                      navigate("/pending-approval");
                      return;
                    }
                  } catch (e) {}
                }
                navigate("/dashboard");
              }}
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
      <Route
        path="/call/:sessionId"
        element={
          <ProtectedRoute>
            <Dashboard onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/video/:sessionId"
        element={
          <ProtectedRoute>
            <Dashboard onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:sessionId"
        element={
          <ProtectedRoute>
            <Dashboard onLogout={handleLogout} />
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