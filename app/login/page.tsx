"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Loader2, Mail, Check, RefreshCw, ArrowLeft } from "lucide-react";
import { authApi, getApiErrorMessage, isAuthenticated } from "@/lib/api";
import ThemeToggle from "@/components/ui/ThemeToggle";

type LoginStep = "login" | "otp" | "forgot_email" | "forgot_verify" | "forgot_reset";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot Password & Reset State
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccessMsg, setOtpSuccessMsg] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/dashboard");
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if ((step === "otp" || step === "forgot_verify") && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.login(form);
      if (res.requires_otp) {
        setStep("otp");
        setResendTimer(30);
        setCanResend(false);
        setOtpDigits(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const targetEmail = resetEmail.trim() || form.email.trim();
      if (!targetEmail) {
        setError("Please enter your email address.");
        return;
      }
      await authApi.forgotPassword(targetEmail);
      setResetEmail(targetEmail);
      setStep("forgot_verify");
      setResendTimer(30);
      setCanResend(false);
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpError("");
      setOtpSuccessMsg("A 6-digit verification code has been sent to your email.");
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOtp = async (codeToVerify?: string) => {
    const fullCode = (codeToVerify || otpDigits.join("")).trim();
    if (fullCode.length !== 6 || otpDigits.some((d) => d === "")) {
      setOtpError("Please enter all 6 digits of the verification code.");
      return;
    }

    const emailToUse = (resetEmail || form.email).trim();
    if (!emailToUse) {
      setOtpError("Email address is missing. Please go back and re-enter your email.");
      return;
    }

    setOtpLoading(true);
    setOtpError("");
    setOtpSuccessMsg("");
    try {
      await authApi.verifyResetOtp({
        email: emailToUse,
        otp_code: fullCode,
      });
      setOtpSuccessMsg("Code verified successfully!");
      setStep("forgot_reset");
      setOtpError("");
    } catch (err) {
      setOtpError(getApiErrorMessage(err));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const emailToUse = (resetEmail || form.email).trim();
    const codeToUse = otpDigits.join("").trim();

    if (!codeToUse || codeToUse.length !== 6) {
      setError("Verification code is missing or incomplete. Please go back to verify code.");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        email: emailToUse,
        otp_code: codeToUse,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setOtpSuccessMsg("Password reset successfully! Redirecting to dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d+$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setOtpError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = newDigits.join("");
    if (fullCode.length === 6 && newDigits.every((d) => d !== "")) {
      if (step === "otp") {
        verifyLoginOtpCode(fullCode);
      } else if (step === "forgot_verify") {
        handleVerifyResetOtp(fullCode);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtpDigits(digits);
      inputRefs.current[5]?.focus();
      if (step === "otp") {
        verifyLoginOtpCode(pastedData);
      } else if (step === "forgot_verify") {
        handleVerifyResetOtp(pastedData);
      }
    }
  };

  const verifyLoginOtpCode = async (code: string) => {
    setOtpLoading(true);
    setOtpError("");
    setOtpSuccessMsg("");
    try {
      await authApi.verifyOtp({
        email: form.email,
        otp_code: code,
      });
      setOtpSuccessMsg("Verification successful! Logging in...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err) {
      setOtpError(getApiErrorMessage(err));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || otpLoading) return;
    setOtpLoading(true);
    setOtpError("");
    setOtpSuccessMsg("");
    const targetEmail = step === "forgot_verify" ? resetEmail : form.email;
    try {
      if (step === "forgot_verify") {
        await authApi.forgotPassword(targetEmail);
        setOtpSuccessMsg("A new verification code has been sent to your email.");
      } else {
        await authApi.resendOtp({ email: targetEmail });
        setOtpSuccessMsg("A new verification code has been sent to your email.");
      }
      setResendTimer(30);
      setCanResend(false);
      setOtpDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setOtpError(getApiErrorMessage(err));
    } finally {
      setOtpLoading(false);
    }
  };

  const getHeadingText = () => {
    switch (step) {
      case "login":
        return "Welcome back";
      case "otp":
      case "forgot_verify":
        return "Verify Code";
      case "forgot_email":
        return "Forgot Password";
      case "forgot_reset":
        return "Set New Password";
    }
  };

  const getSubheadingText = () => {
    switch (step) {
      case "login":
        return "Sign in to your database analyst";
      case "otp":
        return `Verification code sent to ${form.email}`;
      case "forgot_email":
        return "Enter your email to receive a password reset code";
      case "forgot_verify":
        return `Verification code sent to ${resetEmail}`;
      case "forgot_reset":
        return "Create a new password for your account";
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative" style={{ background: "var(--bg-void)" }}>
      {/* Top right theme toggle */}
      <div className="absolute top-5 right-5 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[440px] animate-scale-in my-auto">
        <div className="card-luxury p-7 sm:p-9 border shadow-xl rounded-2xl" style={{ background: "var(--bg-card)" }}>
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-block mb-3.5 group cursor-pointer">
              <img src="/duck.png" alt="DataDuck Logo" className="w-13 h-13 object-contain transition-transform group-hover:scale-105 mx-auto" style={{ width: "52px", height: "52px" }} />
            </Link>
            <h1 className="text-2xl font-bold mb-1.5 tracking-tight" style={{ color: "var(--text-primary)" }}>
              {getHeadingText()}
            </h1>
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {getSubheadingText()}
            </p>
          </div>

          {/* STEP 1: Standard Login Form */}
          {step === "login" && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input-dark"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(form.email);
                      setError("");
                      setStep("forgot_email");
                    }}
                    className="text-xs font-semibold hover:underline"
                    style={{ color: "var(--accent-emerald)" }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="input-dark pr-12"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-smooth hover:opacity-80"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="warning-box animate-fade-in">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 font-semibold shadow-sm"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Signing in...</>
                ) : (
                  <>Sign In <ArrowRight size={18} /></>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: 2MFA Login OTP Screen OR STEP 2B: Forgot Password OTP Verify Screen */}
          {(step === "otp" || step === "forgot_verify") && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col items-center justify-center text-center">
                <div
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border mb-1"
                  style={{ background: "var(--bg-card-raised)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
                >
                  <Mail size={13} style={{ color: "var(--accent-emerald)" }} />
                  <span>{step === "forgot_verify" ? resetEmail : form.email}</span>
                </div>
              </div>

              {/* 6 Digit Input Boxes */}
              <div>
                <label className="block text-xs font-semibold text-center mb-3" style={{ color: "var(--text-muted)" }}>
                  Enter 6-Digit Code
                </label>
                <div className="flex justify-between gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { inputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl transition-all duration-200 focus:outline-none"
                      style={{
                        background: "var(--bg-card-raised)",
                        border: digit ? "2px solid var(--accent-emerald)" : "1px solid var(--border-dim)",
                        color: "var(--text-primary)",
                        boxShadow: digit ? "0 0 10px rgba(8, 127, 91, 0.15)" : "none",
                      }}
                    />
                  ))}
                </div>
              </div>

              {otpError && (
                <div className="warning-box animate-fade-in">
                  <p className="text-sm font-medium">{otpError}</p>
                </div>
              )}

              {otpSuccessMsg && (
                <div className="p-3 rounded-lg text-sm animate-fade-in flex items-center gap-2 badge-success">
                  <Check size={16} />
                  <span>{otpSuccessMsg}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (step === "otp") {
                    verifyLoginOtpCode(otpDigits.join(""));
                  } else {
                    handleVerifyResetOtp();
                  }
                }}
                disabled={otpLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 font-semibold shadow-sm"
              >
                {otpLoading ? (
                  <><Loader2 size={18} className="animate-spin" /> Verifying Code...</>
                ) : (
                  <>
                    {step === "otp" ? "Verify & Sign In" : "Verify Code"} <ArrowRight size={18} />
                  </>
                )}
              </button>

              {/* Resend OTP Section */}
              <div className="pt-2 text-center flex flex-col items-center gap-2">
                <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  Didn't receive the code? Check spam or
                </p>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={!canResend || otpLoading}
                  className="inline-flex items-center gap-1.5 text-xs font-bold transition-all duration-200"
                  style={{
                    color: canResend ? "var(--accent-emerald)" : "var(--text-muted)",
                    cursor: canResend ? "pointer" : "not-allowed",
                  }}
                >
                  <RefreshCw size={12} className={otpLoading ? "animate-spin" : ""} />
                  {canResend ? "Resend Verification Code" : `Resend code in ${resendTimer}s`}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setOtpError("");
                    setStep("login");
                  }}
                  className="inline-flex items-center gap-1 text-xs mt-3 font-medium hover:opacity-80"
                  style={{ color: "var(--text-muted)" }}
                >
                  <ArrowLeft size={13} /> Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Forgot Password - Request Email */}
          {step === "forgot_email" && (
            <form onSubmit={handleForgotEmailSubmit} className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                  Account Email
                </label>
                <input
                  id="reset_email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input-dark"
                  placeholder="you@company.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>

              {error && (
                <div className="warning-box animate-fade-in">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 font-semibold shadow-sm"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Sending Reset Code...</>
                ) : (
                  <>Send Reset Code <ArrowRight size={18} /></>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setStep("login");
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold hover:opacity-80"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <ArrowLeft size={13} /> Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Set New Password Screen */}
          {step === "forgot_reset" && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-5 animate-fade-in">
              <div className="flex flex-col items-center justify-center text-center">
                <div
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border mb-1"
                  style={{ background: "var(--bg-card-raised)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
                >
                  <Mail size={13} style={{ color: "var(--accent-emerald)" }} />
                  <span>{resetEmail}</span>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new_password"
                    type={showNewPassword ? "text" : "password"}
                    required
                    className="input-dark pr-12"
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-smooth hover:opacity-80"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirm_new_password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className="input-dark pr-12"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-smooth hover:opacity-80"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="warning-box animate-fade-in">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {otpSuccessMsg && (
                <div className="p-3 rounded-lg text-sm animate-fade-in flex items-center gap-2 badge-success">
                  <Check size={16} />
                  <span>{otpSuccessMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 font-semibold shadow-sm"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Resetting Password...</>
                ) : (
                  <>Reset Password & Sign In <ArrowRight size={18} /></>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setStep("login");
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium hover:opacity-80"
                  style={{ color: "var(--text-muted)" }}
                >
                  <ArrowLeft size={13} /> Back to Sign In
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-6 text-center border-t" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Don't have an account?{" "}
              <Link href="/signup" className="font-bold hover:underline" style={{ color: "var(--accent-emerald)" }}>
                Create one →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


