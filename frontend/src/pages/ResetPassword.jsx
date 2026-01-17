import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { resetPassword } from "../storage/auth";
import { useTheme } from "../context/ThemeContext";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: phone, 2: OTP, 3: new password
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Start countdown timer for resend OTP
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Send OTP to phone number
  const sendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");
    if (!phone) return setError("Please enter your phone number");

    // TODO: Implement actual OTP sending logic
    console.log("Sending OTP to:", phone);
    setOtpSent(true);
    setStep(2);
    startCountdown();
    setOk("OTP sent to your phone number");
  };

  // Verify OTP
  const verifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");
    if (!otp) return setError("Please enter the OTP");
    if (otp.length !== 6) return setError("OTP must be 6 digits");

    // TODO: Implement actual OTP verification logic
    console.log("Verifying OTP:", otp);
    setStep(3);
    setOk("OTP verified successfully");
  };

  // Resend OTP
  const resendOTP = async () => {
    if (countdown > 0) return;
    setError("");
    setOk("");

    // TODO: Implement actual OTP resending logic
    console.log("Resending OTP to:", phone);
    startCountdown();
    setOk("Code sent to your phone");
  };

  // Final password reset submission
  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");
    if (!password || !confirm) return setError("Please fill all fields");
    if (password !== confirm) return setError("Passwords do not match");
    try {
      await resetPassword({ phone, newPassword: password });
      setOk("Password reset successfully");
      setTimeout(() => navigate("/signin"), 1200);
    } catch (e) {
      setError(e.message || "Could not reset password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-6 relative">
      {/* Back to Home */}
      <div className="fixed top-0 left-0 right-0 p-6 z-50">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-700 dark:text-slate-300 font-medium text-base px-4 py-2 hover:text-gray-900 dark:hover:text-white transition-all duration-300"
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

      <form
        onSubmit={step === 1 ? sendOTP : step === 2 ? verifyOTP : onSubmit}
        className="bg-white dark:bg-slate-900 p-10 w-full max-w-md shadow-sm relative z-10 border border-gray-200 dark:border-slate-800"
      >
        {/* Logo Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
            SokoTally
          </h1>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
          Reset Password
        </h2>
        <p className="text-center text-gray-600 dark:text-slate-400 mb-8 text-sm">
          {step === 1
            ? "Enter your phone number to receive a reset code"
            : step === 2
              ? "Enter the code sent to your phone"
              : "Enter your new password"}
        </p>

        {error && (
          <div
            className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6 text-sm border border-red-300 dark:border-red-800"
            role="alert"
          >
            {error}
          </div>
        )}
        {ok && (
          <div
            className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-6 text-sm border border-green-300 dark:border-green-800"
            role="status"
          >
            {ok}
          </div>
        )}

        {/* Step 1: Phone */}
        {step === 1 && (
          <label className="block mb-6">
            <span className="block mb-2 font-light text-gray-600 dark:text-slate-300 text-sm">
              Phone Number
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0712345678 or +254712345678"
              disabled={otpSent}
              className="w-full px-4 py-3 border text-base transition-all duration-200 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 border-gray-300 dark:border-slate-700 focus:border-gray-900 dark:focus:border-white focus:ring-1 focus:ring-gray-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <>
            <label className="block mb-6">
              <span className="block mb-2 font-light text-gray-600 dark:text-slate-300 text-sm">
                Verification Code
              </span>
              <input
                type="text"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                maxLength="6"
                className="w-full px-4 py-3 border text-base transition-all duration-200 bg-gray-100 dark:bg-slate-800/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 font-light focus:outline-none focus:bg-gray-50 dark:focus:bg-slate-800 border-gray-300 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 text-center text-xl tracking-[0.5rem]"
              />
            </label>
            <div className="text-center mb-4">
              {countdown > 0 ? (
                <p className="text-sm text-gray-500 dark:text-slate-400 font-light">
                  Resend Code in{" "}
                  <span className="font-medium text-blue-600 dark:text-blue-500">
                    {countdown}s
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={resendOTP}
                  className="text-blue-600 dark:text-blue-500 font-medium text-sm hover:text-blue-500 dark:hover:text-blue-400 transition-colors underline"
                >
                  Resend Code
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-sm text-gray-500 dark:text-slate-400 font-light hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
            >
              Change Phone Number
            </button>
          </>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <>
            <label className="block mb-5">
              <span className="block mb-2 font-light text-gray-600 dark:text-slate-300 text-sm">
                New Password
              </span>
              <div className="relative flex items-center gap-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 px-4 py-3 border text-base transition-all duration-200 bg-gray-100 dark:bg-slate-800/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 font-light focus:outline-none focus:bg-gray-50 dark:focus:bg-slate-800 border-gray-300 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="px-4 py-3 text-gray-500 dark:text-slate-400 text-sm font-light hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-800 transition-all duration-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>
            <label className="block mb-6">
              <span className="block mb-2 font-light text-gray-600 dark:text-slate-300 text-sm">
                Confirm Password
              </span>
              <div className="relative flex items-center gap-2">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 px-4 py-3 border text-base transition-all duration-200 bg-gray-100 dark:bg-slate-800/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 font-light focus:outline-none focus:bg-gray-50 dark:focus:bg-slate-800 border-gray-300 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="px-4 py-3 text-gray-500 dark:text-slate-400 text-sm font-light hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-800 transition-all duration-200"
                  aria-label={
                    showConfirm
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>
            </label>
          </>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="w-full px-6 py-3 bg-blue-600 dark:bg-white text-white dark:text-slate-900 text-base font-medium shadow-lg hover:shadow-xl hover:bg-blue-700 dark:hover:bg-slate-50 transition-all duration-200"
        >
          <span>
            {step === 1
              ? "Send Code"
              : step === 2
                ? "Verify OTP"
                : "Reset Password"}
          </span>
        </button>

        {/* Footer links */}
        <div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-slate-700/50">
          <Link
            to="/signin"
            className="text-blue-600 dark:text-blue-500 font-medium text-sm hover:text-blue-500 dark:hover:text-blue-400 hover:underline transition-all"
          >
            Back to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
