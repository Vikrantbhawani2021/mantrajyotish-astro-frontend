import { useState, useMemo } from "react";
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

  // Generate twinkling stars dynamically for visual depth once per mount
  const stars = useMemo(() => Array.from({ length: 45 }).map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 1.8 + 0.8, // 0.8px to 2.6px
    delay: `${Math.random() * 5}s`,
    duration: `${3 + Math.random() * 5}s`,
  })), []);

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

    const inputVal = emailPhone.trim();
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
    setTimeout(() => {
      setLoading(false);
      if (onSignupSuccess) onSignupSuccess();
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#060B16] flex items-center justify-center overflow-hidden">
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

        {/* Cosmos background stars */}
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
              Join the Cosmos of Experts
            </h2>
            <p className="text-gray-400 text-[15px] leading-relaxed font-light">
              Connect with seekers worldwide, conduct consultations seamlessly, and manage your earnings with state-of-the-art tools.
            </p>
          </div>
        </div>

        {/* Right Side: Form Container */}
        <div className="col-span-12 md:col-span-6 lg:col-span-6 h-full flex flex-col justify-center px-8 sm:px-16 md:px-12 lg:px-16 overflow-y-auto relative z-10 bg-transparent">
          <div className="w-full max-w-[400px] mx-auto flex flex-col pt-4 pb-4">
            
            {/* Logo container (Mobile Only) */}
            <div className="flex flex-col items-center mb-4 md:hidden">
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
            <h1 className="text-white text-[24px] md:text-[28px] font-semibold mb-1 tracking-wide leading-tight text-center md:text-left">
              Create Your Account
            </h1>
            <p className="text-gray-400/80 text-[12.5px] mb-4 font-medium text-center md:text-left">
              Join Astrologer and unlock the secrets of the universe.
            </p>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="bg-red-500/15 border border-red-500/40 rounded-[12px] p-3 text-red-400 text-[13px] font-medium mb-3 text-center">
                {errorMessage}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col w-full gap-3.5 relative">
              {/* Full Name */}
              <div>
                <label className="text-white text-[12.5px] font-semibold mb-1.5 block tracking-wide">
                  Full Name
                </label>
                <div className="relative flex items-center bg-[#10192A]/70 border border-gray-800/80 rounded-[12px] px-3.5 h-[48px] focus-within:border-[#ff7448] focus-within:ring-1 focus-within:ring-[#ff7448]/20 transition-all">
                  <User className="w-[16px] h-[16px] text-gray-400 mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="Enter Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-transparent text-white placeholder-gray-500 text-[13.5px] font-medium focus:outline-none flex-1 h-full"
                  />
                </div>
              </div>

              {/* Email or Phone */}
              <div>
                <label className="text-white text-[12.5px] font-semibold mb-1.5 block tracking-wide">
                  Email / Phone
                </label>
                <div className="relative flex items-center bg-[#10192A]/70 border border-gray-800/80 rounded-[12px] px-3.5 h-[48px] focus-within:border-[#ff7448] focus-within:ring-1 focus-within:ring-[#ff7448]/20 transition-all">
                  <Phone className="w-[16px] h-[16px] text-gray-400 mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="Enter Email or Phone Number"
                    value={emailPhone}
                    onChange={(e) => setEmailPhone(e.target.value)}
                    className="bg-transparent text-white placeholder-gray-500 text-[13.5px] font-medium focus:outline-none flex-1 h-full"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="relative">
                <label className="text-white text-[12.5px] font-semibold mb-1.5 block tracking-wide">
                  Password
                </label>
                <div className="relative flex items-center bg-[#10192A]/70 border border-gray-800/80 rounded-[12px] px-3.5 h-[48px] focus-within:border-[#ff7448] focus-within:ring-1 focus-within:ring-[#ff7448]/20 transition-all">
                  <Lock className="w-[16px] h-[16px] text-gray-400 mr-3 flex-shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Create Password"
                    value={password}
                    onFocus={() => setShowRulesHint(true)}
                    onBlur={() => setShowRulesHint(false)}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-transparent text-white placeholder-gray-500 text-[13.5px] font-medium focus:outline-none flex-1 h-full tracking-wide"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer ml-1 flex-shrink-0"
                  >
                    {showPassword ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
                  </button>
                </div>

                {/* Floating Password Rules Checklist Box */}
                {(showRulesHint || password.length > 0) && (
                  <div className="absolute left-0 right-0 top-[82px] bg-[#0c1322] border border-gray-800 rounded-[14px] p-3.5 z-30 shadow-2xl flex flex-col gap-2 animate-fadeIn">
                    <p className="text-[11.5px] font-bold text-gray-300 mb-1 border-b border-gray-800/60 pb-1.5">Password Security Status:</p>
                    {passwordRules.map((rule) => (
                      <div key={rule.id} className="flex items-center gap-2">
                        {rule.valid ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                            <X className="w-2 h-2 text-red-400 stroke-[3]" />
                          </div>
                        )}
                        <span className={`text-[11px] font-semibold ${rule.valid ? 'text-emerald-400/90' : 'text-gray-400'}`}>
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-white text-[12.5px] font-semibold mb-1.5 block tracking-wide">
                  Confirm Password
                </label>
                <div className="relative flex items-center bg-[#10192A]/70 border border-gray-800/80 rounded-[12px] px-3.5 h-[48px] focus-within:border-[#ff7448] focus-within:ring-1 focus-within:ring-[#ff7448]/20 transition-all">
                  <Lock className="w-[16px] h-[16px] text-gray-400 mr-3 flex-shrink-0" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Re-enter Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-transparent text-white placeholder-gray-500 text-[13.5px] font-medium focus:outline-none flex-1 h-full tracking-wide"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer ml-1 flex-shrink-0"
                  >
                    {showConfirmPassword ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2.5 text-[12px] leading-normal pt-1 px-0.5">
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
    </div>
  );
}
