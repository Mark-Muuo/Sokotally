import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SignIn = () => {
  const { signIn, loading, error, sendOTP, signInWithOTP } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ phone: "", password: "" });
  const [otpMode, setOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (validationErrors[e.target.name]) {
      setValidationErrors({ ...validationErrors, [e.target.name]: "" });
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!form.phone.trim()) errors.phone = "Phone number is required";
    if (!form.password) errors.password = "Password is required";
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const userData = await signIn({
        phone: form.phone.trim(),
        password: form.password,
      });
      console.log("Login userData:", userData);
      console.log("User role:", userData?.role);
      // Redirect admin users to admin panel, regular users to dashboard
      if (userData?.role === "admin") {
        console.log("Redirecting to /admin");
        navigate("/admin");
      } else {
        console.log("Redirecting to /dashboard");
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Sign in error:", err);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!form.phone.trim()) errors.phone = "Phone number is required";
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    try {
      const ok = await sendOTP({ phone: form.phone.trim() });
      if (ok) {
        setOtpSent(true);
      }
    } catch (err) {
      console.error("Send OTP error:", err);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!form.phone.trim()) errors.phone = "Phone number is required";
    if (!otpCode.trim()) errors.otp = "OTP code is required";
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    try {
      const userData = await signInWithOTP({
        phone: form.phone.trim(),
        otp: otpCode.trim(),
      });
      console.log("OTP login userData:", userData);
      console.log("User role:", userData?.role);
      // Redirect admin users to admin panel, regular users to dashboard
      if (userData?.role === "admin") {
        console.log("Redirecting to /admin");
        navigate("/admin");
      } else {
        console.log("Redirecting to /dashboard");
        navigate("/dashboard");
      }
    } catch {
      console.error("Verify OTP error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-6 relative">
      {/* Back to Home */}
      <div className="fixed top-0 left-0 right-0 p-6 z-50">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-700 dark:text-slate-200 font-semibold text-base px-4 py-2 hover:text-gray-900 dark:hover:text-white transition-all duration-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to Home
        </Link>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handlePasswordLogin}
        className="bg-white dark:bg-slate-900 p-10 w-full max-w-md shadow-sm relative z-10 border border-gray-200 dark:border-slate-800"
      >
        {/* Logo Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
            SokoTally
          </h1>
          <p className="text-gray-600 dark:text-slate-300 text-sm">
            Sign in to your SokoTally account
          </p>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
          Welcome back
        </h2>{" "}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 mb-6 text-sm border border-red-200">
            <span>{error}</span>
          </div>
        )}
        {/* Phone Number */}
        <label className="block mb-5">
          <span className="block mb-2 font-semibold text-gray-700 dark:text-slate-200 text-sm">
            Phone Number
          </span>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={onChange}
            placeholder="0712345678 or +254712345678"
            className={`w-full px-4 py-3 border text-base transition-all duration-200 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 ${
              validationErrors.phone
                ? "border-red-500/50 focus:border-red-500"
                : "border-gray-300 dark:border-slate-700 focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10"
            }`}
          />
          {validationErrors.phone && (
            <span className="text-red-400 text-sm font-light mt-2">
              {validationErrors.phone}
            </span>
          )}
        </label>
        {/* Password or OTP */}
        {!otpMode && (
          <label className="block mb-5">
            <span className="block mb-2 font-semibold text-gray-700 dark:text-slate-200 text-sm">
              Password
            </span>
            <div className="relative flex items-center gap-2">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={onChange}
                placeholder="Enter your password"
                className={`flex-1 px-4 py-3 border text-base transition-all duration-200 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 ${
                  validationErrors.password
                    ? "border-red-500/50 focus:border-red-500"
                    : "border-gray-300 dark:border-slate-700 focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-500 dark:text-slate-400 text-sm hover:text-gray-700 dark:hover:text-slate-200 transition-all duration-200"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {showPassword ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  )}
                </svg>
              </button>
            </div>
            {validationErrors.password && (
              <span className="text-red-400 text-sm font-light mt-2">
                {validationErrors.password}
              </span>
            )}
          </label>
        )}
        {otpMode && (
          <div className="mb-5">
            <span className="block mb-2 text-gray-600 dark:text-slate-300 text-sm">
              Enter the 6-digit code
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={otpCode}
              onChange={(e) =>
                setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="123456"
              className={`w-full px-4 py-3 border text-base transition-all duration-200 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 ${
                validationErrors.otp
                  ? "border-red-500/50 focus:border-red-500"
                  : "border-gray-300 dark:border-slate-700 focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10"
              }`}
            />
            <p className="text-gray-500 dark:text-slate-400 text-xs mt-2">
              We will send a 6-digit code to your phone.
            </p>
            {validationErrors.otp && (
              <span className="text-red-400 text-sm font-light mt-2">
                {validationErrors.otp}
              </span>
            )}
          </div>
        )}
        {/* Simple helpers (hide on OTP mode) */}
        {!otpMode && (
          <div className="flex justify-between items-center mb-6 text-sm">
            <label className="flex items-center gap-2 text-gray-600 dark:text-slate-300 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-blue-500 bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-600"
              />
              <span>Remember me</span>
            </label>
            <Link
              to="/reset"
              className="text-blue-600 dark:text-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition-all"
            >
              Forgot password?
            </Link>
          </div>
        )}
        {/* Actions */}
        {!otpMode ? (
          <>
            <button
              className="w-full px-6 py-3.5 bg-blue-600 dark:bg-white text-white dark:text-slate-900 text-base font-medium hover:bg-blue-700 dark:hover:bg-slate-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
              type="submit"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <div className="flex items-center justify-center gap-3 my-4 text-gray-500 dark:text-slate-400 text-sm">
              <span className="h-px w-10 bg-gray-300 dark:bg-slate-700" />
              <span>or</span>
              <span className="h-px w-10 bg-gray-300 dark:bg-slate-700" />
            </div>
            <button
              type="button"
              onClick={() => setOtpMode(true)}
              className="w-full px-6 py-3.5 bg-gray-200 dark:bg-slate-800/60 text-gray-900 dark:text-white text-base font-medium hover:bg-gray-300 dark:hover:bg-slate-800 transition-all duration-200"
            >
              Sign in with OTP
            </button>
          </>
        ) : (
          <>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSendOTP}
                className="flex-1 px-6 py-3.5 bg-gray-200 dark:bg-white text-gray-900 dark:text-slate-900 text-base font-medium hover:bg-gray-300 dark:hover:bg-slate-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || otpSent}
              >
                {otpSent ? "Code Sent" : "Send Code"}
              </button>
              <button
                type="button"
                onClick={handleVerifyOTP}
                className="flex-1 px-6 py-3.5 bg-blue-600 text-white text-base font-medium hover:bg-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Verify & Sign In
              </button>
            </div>
            {otpSent && (
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  handleSendOTP(new Event("submit"));
                }}
                className="mt-3 w-full px-6 py-3.5 bg-gray-200 dark:bg-slate-800/60 text-gray-900 dark:text-white text-base font-medium hover:bg-gray-300 dark:hover:bg-slate-800 transition-all duration-200"
              >
                Resend Code
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setOtpMode(false);
                setOtpSent(false);
                setOtpCode("");
              }}
              className="mt-4 w-full px-6 py-3.5 bg-gray-200 dark:bg-slate-800/60 text-gray-900 dark:text-white text-base font-medium hover:bg-gray-300 dark:hover:bg-slate-800 transition-all duration-200"
            >
              Use password instead
            </button>
          </>
        )}
        {/* Footer */}
        <div className="text-center mt-6 text-gray-600 dark:text-slate-400 text-sm font-light">
          <p>
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-blue-600 dark:text-blue-500 font-normal hover:text-blue-500 dark:hover:text-blue-400 transition-all"
            >
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default SignIn;
