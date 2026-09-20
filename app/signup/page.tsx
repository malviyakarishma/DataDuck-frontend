"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Loader2, Check, Mail, RefreshCw, ArrowLeft } from "lucide-react";
import { authApi, getApiErrorMessage, isAuthenticated } from "@/lib/api";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"register" | "otp">("register");

  // Registration state
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // OTP 2MFA state
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

  // Password strength calculator
  const passwordStrength = (() => {
    const p = form.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^a-zA-Z0-9]/.test(p)) score++;
    return score;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][passwordStrength];
  const strengthColor = ["", "#EF4444", "#F59E0B", "#10B981", "#087F5B"][passwordStrength];

  // Resend countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register(form);
      if (res.requires_otp) {
        setStep("otp");
        setResendTimer(30);
        setCanResend(false);
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
      verifyOtpCode(fullCode);
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
      verifyOtpCode(pastedData);
    }
  };

  const verifyOtpCode = async (code: string) => {
    setOtpLoading(true);
    setOtpError("");
    setOtpSuccessMsg("");
    try {
      await authApi.verifyOtp({
        email: form.email,
        otp_code: code,
      });
      setOtpSuccessMsg("Verification successful! Redirecting to dashboard...");
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
    try {
      await authApi.resendOtp({ email: form.email });
      setOtpSuccessMsg("A new 6-digit code has been sent to your email.");
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
              {step === "register" ? "Create your account" : "Two-Factor Verification"}
            </h1>
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {step === "register"
                ? "Start analyzing your database with AI"
                : `We sent a 6-digit verification code to ${form.email}`}
            </p>
          </div>

          {step === "register" ? (
            /* STEP 1: Registration Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Full Name</label>
                <input
                  id="full_name"
                  type="text"
                  required
                  autoComplete="name"
                  className="input-dark"
                  placeholder="Jane Smith"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Email</label>
                <input
                  id="signup_email"
                  type="email"
                  required
                  autoComplete="email"
                  className="input-dark"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Password</label>
                <div className="relative">
                  <input
                    id="signup_password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    className="input-dark pr-12"
                    placeholder="Min. 8 characters"
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
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-1.5 flex-1 rounded-full transition-all duration-300"
                          style={{ background: i <= passwordStrength ? strengthColor : "var(--border-subtle)" }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold" style={{ color: strengthColor }}>{strengthLabel}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Confirm Password</label>
                <div className="relative">
                  <input
                    id="confirm_password"
                    type="password"
                    required
                    autoComplete="new-password"
                    className="input-dark pr-12"
                    placeholder="Re-enter password"
                    value={form.confirm_password}
                    onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                  />
                  {form.confirm_password && form.password === form.confirm_password && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Check size={18} style={{ color: "var(--accent-emerald)" }} />
                    </div>
                  )}
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
                  <><Loader2 size={18} className="animate-spin" /> Creating account...</>
                ) : (
                  <>Create Account <ArrowRight size={18} /></>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: 2MFA OTP Verification Screen */
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col items-center justify-center text-center">
                <div
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border mb-1"
                  style={{ background: "var(--bg-card-raised)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
                >
                  <Mail size={13} style={{ color: "var(--accent-emerald)" }} />
                  <span>{form.email}</span>
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
                onClick={() => verifyOtpCode(otpDigits.join(""))}
                disabled={otpLoading || otpDigits.some((d) => d === "")}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 font-semibold shadow-sm"
              >
                {otpLoading ? (
                  <><Loader2 size={18} className="animate-spin" /> Verifying Code...</>
                ) : (
                  <>Verify & Continue <ArrowRight size={18} /></>
                )}
              </button>

              {/* Resend OTP Section */}
              <div className="pt-2 text-center flex flex-col items-center gap-2">
                <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  Didn't receive the code? Check spam folder or
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
                  onClick={() => setStep("register")}
                  className="inline-flex items-center gap-1 text-xs mt-3 font-medium hover:opacity-80"
                  style={{ color: "var(--text-muted)" }}
                >
                  <ArrowLeft size={13} /> Back to Sign Up
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 text-center border-t" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Already have an account?{" "}
              <Link href="/login" className="font-bold hover:underline" style={{ color: "var(--accent-emerald)" }}>
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
