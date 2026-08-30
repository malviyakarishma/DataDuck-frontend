"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Database, Eye, EyeOff, ArrowRight, Loader2, Check, ShieldCheck, Mail, RefreshCw, ArrowLeft } from "lucide-react";
import { authApi, getApiErrorMessage, isAuthenticated } from "@/lib/api";

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
  const strengthColor = ["", "#EF4444", "#F59E0B", "#10B981", "#22C55E"][passwordStrength];

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
        // Auto focus first OTP input box
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
    // Only accept numeric digit
    if (value && !/^\d+$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1); // Take single character
    setOtpDigits(newDigits);
    setOtpError("");

    // Auto advance focus to next box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If 6 digits completed, auto-submit
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
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg-void)" }}>
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(150,150,150,0.04) 0%, transparent 70%)", filter: "blur(60px)" }} />

      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <img src="/duck.png" alt="DataDuck Logo" className="w-14 h-14 object-contain transition-transform group-hover:scale-105" />
            <div className="text-left flex flex-col justify-center">
              <span className="font-bold text-3xl text-gradient-silver block leading-tight tracking-tight">DataDuck</span>
              <span className="text-xs font-semibold tracking-wider text-gray-400 mt-0.5 block">Ask. Dig. Discover.</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#E5E7EB" }}>
            {step === "register" ? "Create your account" : "Two-Factor Verification"}
          </h1>
          <p className="text-sm" style={{ color: "#6B6B6B" }}>
            {step === "register"
              ? "Start analyzing your database with AI"
              : `We sent a 6-digit verification code to ${form.email}`}
          </p>
        </div>

        <div className="card-luxury p-8">
          {step === "register" ? (
            /* STEP 1: Registration Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#AFAFAF" }}>Full Name</label>
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
                <label className="block text-sm font-medium mb-2" style={{ color: "#AFAFAF" }}>Email</label>
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
                <label className="block text-sm font-medium mb-2" style={{ color: "#AFAFAF" }}>Password</label>
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
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#6B6B6B" }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{ background: i <= passwordStrength ? strengthColor : "rgba(255,255,255,0.08)" }} />
                      ))}
                    </div>
                    <span className="text-xs" style={{ color: strengthColor }}>{strengthLabel}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#AFAFAF" }}>Confirm Password</label>
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
                      <Check size={18} style={{ color: "#22C55E" }} />
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="warning-box animate-fade-in">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3">
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
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.25)" }}>
                  <ShieldCheck size={28} className="text-blue-400" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">2MFA Verification</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#AFAFAF" }}>
                  <Mail size={13} />
                  <span>{form.email}</span>
                </div>
              </div>

              {/* 6 Digit Input Boxes */}
              <div>
                <label className="block text-xs font-medium text-center mb-3" style={{ color: "#8E8E93" }}>
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
                        background: "rgba(255,255,255,0.03)",
                        border: digit ? "1px solid rgba(96,165,250,0.6)" : "1px solid rgba(255,255,255,0.1)",
                        color: "#F3F4F6",
                        boxShadow: digit ? "0 0 12px rgba(96,165,250,0.15)" : "none",
                      }}
                    />
                  ))}
                </div>
              </div>

              {otpError && (
                <div className="warning-box animate-fade-in">
                  <p className="text-sm">{otpError}</p>
                </div>
              )}

              {otpSuccessMsg && (
                <div className="p-3 rounded-lg text-sm animate-fade-in flex items-center gap-2"
                  style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ADE80" }}>
                  <Check size={16} />
                  <span>{otpSuccessMsg}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => verifyOtpCode(otpDigits.join(""))}
                disabled={otpLoading || otpDigits.some((d) => d === "")}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {otpLoading ? (
                  <><Loader2 size={18} className="animate-spin" /> Verifying Code...</>
                ) : (
                  <>Verify & Continue <ArrowRight size={18} /></>
                )}
              </button>

              {/* Resend OTP Section */}
              <div className="pt-2 text-center flex flex-col items-center gap-2">
                <p className="text-xs" style={{ color: "#6B6B6B" }}>
                  Didn't receive the code? Check your spam folder or
                </p>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={!canResend || otpLoading}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold transition-all duration-200"
                  style={{
                    color: canResend ? "#60A5FA" : "#4B5563",
                    cursor: canResend ? "pointer" : "not-allowed",
                  }}>
                  <RefreshCw size={12} className={otpLoading ? "animate-spin" : ""} />
                  {canResend ? "Resend Verification Code" : `Resend code in ${resendTimer}s`}
                </button>

                <button
                  type="button"
                  onClick={() => setStep("register")}
                  className="inline-flex items-center gap-1 text-xs mt-3 transition-colors"
                  style={{ color: "#8E8E93" }}>
                  <ArrowLeft size={13} /> Back to Sign Up
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-sm" style={{ color: "#6B6B6B" }}>
              Already have an account?{" "}
              <Link href="/login" className="font-medium transition-smooth" style={{ color: "#C7C7C7" }}>
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

