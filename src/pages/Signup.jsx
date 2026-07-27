import { useState } from "react";
import { User, Phone, Lock, Eye, EyeOff, ArrowRight, Check, X, Loader2 } from "lucide-react";

export default function Signup({ onSignupSuccess, onNavigateToLogin }) {
  const [fullName, setFullName] = useState("");
  const [emailPhone, setEmailPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(true);
  const [showRulesHint, setShowRulesHint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Password validation rules
  const passwordRules = [
    { id: 1, label: "Minimum 8 characters", valid: password.length >= 8 },
    { id: 2, label: "At least 1 Capital Letter (A-Z)", valid: /[A-Z]/.test(password) },
    { id: 3, label: "At least 1 Small Letter (a-z)", valid: /[a-z]/.test(password) },
    { id: 4, label: "At least 1 Number (0-9)", valid: /[0-9]/.test(password) },
    { id: 5, label: "At least 1 Special Character (@#$%&!)", valid: /[@#$%&!]/.test(password) },
  ];

  const isPasswordValid = passwordRules.every(r => r.valid);

  // Generate twinkling stars dynamically for visual depth
  const stars = Array.from({ length: 45 }).map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 1.8 + 0.8, // 0.8px to 2.6px
    delay: `${Math.random() * 5}s`,
    duration: `${3 + Math.random() * 5}s`,
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!agreeToTerms) {
      setErrorMessage("Please agree to the Terms & Conditions and Privacy Policy.");
      return;
    }
    if (!isPasswordValid) {
      setErrorMessage("Password does not meet all security requirements.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match!");
      return;
    }
    if (!fullName.trim() || !emailPhone.trim() || !password.trim()) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (onSignupSuccess) onSignupSuccess();
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#060B16] flex items-center justify-center p-0 sm:p-4 overflow-x-hidden">
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
      <div className="w-full sm:max-w-[430px] h-screen sm:h-[92vh] sm:rounded-[32px] bg-[#070E1A] overflow-y-auto flex flex-col justify-center px-8 relative shadow-2xl">

        {/* Cosmos background stars */}
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute bg-white rounded-full animate-pulse pointer-events-none"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: star.delay,
              animationDuration: star.duration,
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}

        {/* Nebula glows */}
        <div className="absolute w-[280px] h-[280px] rounded-full bg-[#ff7448]/5 blur-[70px] -top-12 -left-12 pointer-events-none" />
        <div className="absolute w-[320px] h-[320px] rounded-full bg-blue-500/5 blur-[90px] bottom-10 right-0 pointer-events-none" />

        {/* Center Content Box */}
        <div className="relative z-10 w-full flex flex-col pt-2">

          {/* Logo container */}
          <div className="flex flex-col items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-[48px] h-[48px]">
                {/* Sun Emblem SVG */}
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
                {/* Inner stylized "A" */}
                <span className="text-[#ff7448] font-bold text-2xl z-10 leading-none pt-1">A</span>
              </div>

              {/* Text "ASTROLOGER" */}
              <span className="text-[#ff7448] text-[28px] font-bold tracking-wide">
                ASTROLOGER
              </span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-white text-[24px] font-medium text-center mb-1 tracking-wide leading-tight">
            Create Your Account
          </h1>
          <p className="text-gray-400/80 text-[12.5px] text-center mb-4 font-medium">
            Join Astrologer and unlock the secrets of the universe.
          </p>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="bg-red-500/15 border border-red-500/40 rounded-[12px] p-3 text-red-400 text-[13px] font-medium mb-3 text-center">
              {errorMessage}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="flex flex-col w-full gap-3.5">

            {/* Full Name Field */}
            <div className="relative flex items-center bg-[#10192A]/70 border border-gray-800/80 rounded-[14px] px-4 h-[48px] focus-within:border-[#ff7448] focus-within:ring-1 focus-within:ring-[#ff7448]/20 transition-all">
              <User className="w-[18px] h-[18px] text-gray-400 mr-3.5 flex-shrink-0" />
              <input
                type="text"
                required
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-transparent text-white placeholder-gray-500 text-[14px] font-medium focus:outline-none flex-1 h-full"
              />
            </div>

            {/* Email/Phone Field */}
            <div className="relative flex items-center bg-[#10192A]/70 border border-gray-800/80 rounded-[14px] px-4 h-[48px] focus-within:border-[#ff7448] focus-within:ring-1 focus-within:ring-[#ff7448]/20 transition-all">
              <Phone className="w-[18px] h-[18px] text-gray-400 mr-3.5 flex-shrink-0" />
              <input
                type="text"
                required
                placeholder="Email or Phone Number"
                value={emailPhone}
                onChange={(e) => setEmailPhone(e.target.value)}
                className="bg-transparent text-white placeholder-gray-500 text-[14px] font-medium focus:outline-none flex-1 h-full"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <div className="relative flex items-center bg-[#10192A]/70 border border-gray-800/80 rounded-[14px] px-4 h-[48px] focus-within:border-[#ff7448] focus-within:ring-1 focus-within:ring-[#ff7448]/20 transition-all">
                <Lock className="w-[18px] h-[18px] text-gray-400 mr-3.5 flex-shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Password"
                  value={password}
                  onFocus={() => setShowRulesHint(true)}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent text-white placeholder-gray-500 text-[14px] font-medium focus:outline-none flex-1 h-full tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer ml-2 flex-shrink-0"
                >
                  {showPassword ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
                </button>
              </div>

              {/* Password Rules Checklist */}
              {(showRulesHint || password.length > 0) && (
                <div className="bg-[#10192A]/90 border border-gray-800/90 rounded-[12px] p-3 flex flex-col gap-1.5 transition-all">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Password Requirements:</span>
                  {passwordRules.map((r) => (
                    <div key={r.id} className="flex items-center gap-2 text-[11.5px] font-semibold">
                      {r.valid ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                      )}
                      <span className={r.valid ? "text-emerald-400" : "text-gray-400"}>
                        {r.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="relative flex items-center bg-[#10192A]/70 border border-gray-800/80 rounded-[14px] px-4 h-[48px] focus-within:border-[#ff7448] focus-within:ring-1 focus-within:ring-[#ff7448]/20 transition-all">
              <Lock className="w-[18px] h-[18px] text-gray-400 mr-3.5 flex-shrink-0" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-transparent text-white placeholder-gray-500 text-[14px] font-medium focus:outline-none flex-1 h-full tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer ml-2 flex-shrink-0"
              >
                {showConfirmPassword ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
              </button>
            </div>

            {/* Terms and Conditions Checkbox */}
            <div className="flex items-start gap-2.5 mt-1 text-[12px] leading-snug">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="accent-[#ff7448] w-4 h-4 rounded border-gray-800 bg-[#10192A] mt-0.5 flex-shrink-0 cursor-pointer"
              />
              <span className="text-gray-300 select-none">
                I agree to the <span className="text-[#ff7448] font-bold hover:underline cursor-pointer">Terms & Conditions</span> and <span className="text-[#ff7448] font-bold hover:underline cursor-pointer">Privacy Policy</span>
              </span>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading}
              className="bg-[#ff7448] hover:bg-[#ff7448]/95 disabled:opacity-70 text-white font-bold text-[15px] h-[48px] rounded-[14px] shadow-lg shadow-[#ff7448]/15 transition-all active:scale-[0.98] mt-1 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Sign Up</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </>
              )}
            </button>
          </form>

          {/* Already have an account? Login Prompt */}
          <p className="text-gray-400/80 text-[13px] text-center mt-4 font-medium pb-2">
            Already have an account?
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-[#ff7448] font-bold hover:underline ml-2 cursor-pointer"
            >
              Login
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}
