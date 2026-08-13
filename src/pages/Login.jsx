import { useState, useMemo } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { API_ENDPOINTS } from "../config/api";

export default function Login({ onLoginSuccess, onNavigateToSignup, onNavigateToForgot }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Generate twinkling stars dynamically for visual depth once per mount
  const stars = useMemo(() => Array.from({ length: 45 }).map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 1.8 + 0.8, // 0.8px to 2.6px
    delay: `${Math.random() * 5}s`,
    duration: `${3 + Math.random() * 5}s`,
  })), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const inputVal = email.trim();
    const isNumeric = /^\d+$/.test(inputVal);

    if (isNumeric) {
      if (inputVal.length !== 10) {
        setErrorMessage("Please enter a valid 10-digit phone number.");
        return;
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inputVal)) {
        setErrorMessage("Please enter a valid email address.");
        return;
      }
    }

    setLoading(true);

    try {

      // Payload handles phone, email, or credential field
      const payload = {
        email: isNumeric ? "" : inputVal.toLowerCase(),
        phone: isNumeric ? inputVal : "",
        identifier: inputVal,
        password: password
      };

      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && (data.success || data.token || data.status === "success" || data.user || data.data || data.astrologer)) {
        // Store auth token or user details if returned
        if (data.token) {
          localStorage.setItem("astrologerToken", data.token);
        }
        const userObj = data.astrologer || data.user || data.data;
        if (userObj) {
          localStorage.setItem("astrologerUser", JSON.stringify(userObj));
        }
        onLoginSuccess();
      } else {
        const msg = data.message || data.error || data.msg || "Invalid credentials.";
        setErrorMessage(msg);
      }
    } catch (err) {
      console.error("Login API Error:", err);
      setErrorMessage("Network error: Please verify your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#060B16] flex justify-center items-center overflow-hidden">
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        @keyframes pulse-drift {
          0% {
            transform: translate(0, 0);
            opacity: 0.2;
          }
          50% {
            transform: translate(15px, -15px);
            opacity: 0.8;
          }
          100% {
            transform: translate(0, 0);
            opacity: 0.2;
          }
        }
        .animate-pulse-drift {
          animation: pulse-drift linear infinite;
        }
      `}</style>
      <div className="w-full h-full md:grid md:grid-cols-12 bg-[#070E1A] overflow-hidden relative shadow-2xl">

        {/* Cosmos background stars spanning the entire viewport */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute bg-white rounded-full animate-pulse-drift"
              style={{
                top: star.top,
                left: star.left,
                width: `${star.size}px`,
                height: `${star.size}px`,
                animationDelay: star.delay,
                animationDuration: star.duration,
              }}
            />
          ))}
          <div className="absolute w-[350px] h-[350px] rounded-full bg-[#ff7448]/5 blur-[90px] -top-12 -left-12" />
          <div className="absolute w-[450px] h-[450px] rounded-full bg-blue-500/5 blur-[120px] bottom-10 right-0" />
        </div>

        {/* Left Side: Brand Banner (Desktop Only) */}
        <div className="hidden md:flex md:col-span-6 lg:col-span-6 bg-[#060B16]/40 flex-col justify-center items-center p-12 text-center relative z-10 border-r border-gray-850/50">
          <div className="flex flex-col items-center max-w-[480px]">
            <div className="relative flex items-center justify-center w-[120px] h-[120px] mb-8">
              {/* Sun Emblem SVG */}
              <svg className="absolute w-full h-full text-[#ff7448] animate-spin-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="50" cy="50" r="22" />
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i * 30 * Math.PI) / 180;
                  const x1 = 50 + Math.cos(angle) * 25;
                  const y1 = 50 + Math.sin(angle) * 25;
                  const x2 = 50 + Math.cos(angle) * 34;
                  const y2 = 50 + Math.sin(angle) * 34;
                  return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeLinecap="round" strokeWidth="2.5" />;
                })}
              </svg>
              <span className="text-[#ff7448] font-bold text-5xl z-10 leading-none pt-1">A</span>
            </div>

            <span className="text-[#ff7448] text-[40px] font-extrabold tracking-widest mb-4">
              ASTROLOGER
            </span>
            <h2 className="text-white text-[24px] font-medium tracking-wide mb-3">
              Your Gateway to Astrological Wisdom
            </h2>
            <p className="text-gray-400 text-[15px] leading-relaxed font-light">
              Connect with seekers worldwide, conduct consultations seamlessly, and manage your earnings with state-of-the-art tools.
            </p>
          </div>
        </div>

        {/* Right Side: Form Container */}
        <div className="col-span-12 md:col-span-6 lg:col-span-6 h-full flex flex-col justify-center px-8 sm:px-16 md:px-12 lg:px-16 overflow-y-auto relative z-10 bg-transparent">
          <div className="w-full max-w-[400px] mx-auto flex flex-col">
            
            {/* Logo container (Mobile Only) */}
            <div className="flex flex-col items-center mb-6 md:hidden">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-[48px] h-[48px]">
                  <svg className="absolute w-full h-full text-[#ff7448] animate-spin-slow" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="50" cy="50" r="22" />
                    {Array.from({ length: 12 }).map((_, i) => {
                      const angle = (i * 30 * Math.PI) / 180;
                      const x1 = 50 + Math.cos(angle) * 25;
                      const y1 = 50 + Math.sin(angle) * 25;
                      const x2 = 50 + Math.cos(angle) * 33;
                      const y2 = 50 + Math.sin(angle) * 33;
                      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeLinecap="round" strokeWidth="3" />;
                    })}
                  </svg>
                  <span className="text-[#ff7448] font-bold text-xl z-10 leading-none pt-1">A</span>
                </div>
                <span className="text-[#ff7448] text-[28px] font-bold tracking-wide">
                  ASTROLOGER
                </span>
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-white text-[28px] md:text-[32px] font-semibold mb-2 tracking-wide leading-tight text-center md:text-left">
              Welcome back
            </h1>
            <p className="text-gray-400/80 text-[14px] mb-6 font-medium text-center md:text-left">
              Log in with your credential details to continue.
            </p>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="bg-red-500/15 border border-red-500/40 rounded-[12px] p-3 text-red-400 text-[13px] font-medium mb-4 text-center">
                {errorMessage}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="flex flex-col w-full gap-5">
              {/* Email/Phone Field */}
              <div>
                <label className="text-white text-[13.5px] font-semibold mb-2 block tracking-wide">
                  Email/Phone
                </label>
                <div className="relative flex items-center bg-[#10192A]/70 border border-gray-800/80 rounded-[14px] px-4 h-[54px] focus-within:border-[#ff7448] focus-within:ring-1 focus-within:ring-[#ff7448]/20 transition-all">
                  <Mail className="w-[18px] h-[18px] text-gray-400 mr-3.5 flex-shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="Enter Email or Phone Number"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-transparent text-white placeholder-gray-500 text-[14.5px] font-medium focus:outline-none flex-1 h-full"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="text-white text-[13.5px] font-semibold mb-2 block tracking-wide">
                  Password
                </label>
                <div className="relative flex items-center bg-[#10192A]/70 border border-gray-800/80 rounded-[14px] px-4 h-[54px] focus-within:border-[#ff7448] focus-within:ring-1 focus-within:ring-[#ff7448]/20 transition-all">
                  <Lock className="w-[18px] h-[18px] text-gray-400 mr-3.5 flex-shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-transparent text-white placeholder-gray-500 text-[14.5px] font-medium focus:outline-none flex-1 h-full tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer ml-2 flex-shrink-0"
                  >
                    {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex justify-between items-center mt-1 text-[13.5px]">
                <label className="flex items-center gap-2.5 text-gray-300 font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-[#ff7448] w-4 h-4 rounded border-gray-800 bg-[#10192A]"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={onNavigateToForgot}
                  className="text-[#ff7448] font-bold hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="bg-[#ff7448] hover:bg-[#ff7448]/95 disabled:opacity-70 text-white font-bold text-[16px] h-[54px] rounded-[14px] shadow-lg shadow-[#ff7448]/20 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <span>Log In</span>
                )}
              </button>
            </form>

            {/* Don't have an account? Signup Prompt */}
            <p className="text-gray-400/80 text-[14px] text-center mt-6 font-medium">
              Don't have an account?
              <button
                type="button"
                onClick={onNavigateToSignup}
                className="text-[#ff7448] font-bold hover:underline ml-2 cursor-pointer"
              >
                Sign up
              </button>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
