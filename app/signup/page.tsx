"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const { signUp, isLoaded, setActive } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setError("");
    setLoading(true);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      } else {
        setError("Signup failed. Please try again.");
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!isLoaded) return;
    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch {
      setError("Google sign-up failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{ backgroundColor: "var(--dark-mint-green)" }} />
        <img
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          src="/images/forest_bg.jpg"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-[10px] py-[10px]">
        {/* Welcome Text */}
        <div className="fade-up flex gap-[10px] items-center justify-center px-[10px]">
          <span className="font-display text-[36px] leading-normal" style={{ color: "var(--aqua)" }}>
            Hello, Author,
          </span>
          <span className="font-display text-[36px] leading-normal" style={{ color: "var(--light-gray)" }}>
            Welcome to
          </span>
        </div>

        {/* Signup Card */}
        <div
          className="fade-up fade-up-delay-1 flex flex-col items-center gap-[10px] rounded-[10px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] px-[30px] py-[40px] overflow-clip"
          style={{ backgroundColor: "var(--dark-green)" }}
        >
          {/* Logo */}
          <div className="flex items-center justify-center font-display text-[96px] leading-normal px-[10px] py-[10px]">
            <span style={{ color: "var(--aqua)" }}>Re</span>
            <span style={{ color: "black" }}>:</span>
            <span style={{ color: "var(--light-gray)" }}>Write</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-[20px] w-full px-[5px]">
            <input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="font-display"
              style={{ backgroundColor: "var(--mint-green)", border: "3px solid black", borderRadius: 20, fontSize: 20, color: "black", padding: "8px 16px", outline: "none", width: "100%", height: 44, boxSizing: "border-box" }}
            />
            <input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="font-display"
              style={{ backgroundColor: "var(--mint-green)", border: "3px solid black", borderRadius: 20, fontSize: 20, color: "black", padding: "8px 16px", outline: "none", width: "100%", height: 44, boxSizing: "border-box" }}
            />
            <input
              id="repeatPassword"
              type="password"
              placeholder="Repeat Password"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              required
              minLength={6}
              className="font-display"
              style={{ backgroundColor: "var(--mint-green)", border: "3px solid black", borderRadius: 20, fontSize: 20, color: "black", padding: "8px 16px", outline: "none", width: "100%", height: 44, boxSizing: "border-box" }}
            />

            {error && (
              <div className="font-display" style={{ color: "#f87171", fontSize: 14, backgroundColor: "rgba(127,29,29,0.2)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "8px 12px" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="font-display hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: "var(--green-highlight)", border: "3px solid black", borderRadius: 30, fontSize: 36, color: "black", height: 60, padding: "0 32px", cursor: loading ? "not-allowed" : "pointer", alignSelf: "center" }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <div style={{ position: "relative", margin: "8px 0" }}>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center" }}>
                <div style={{ width: "100%", borderTop: "1px solid var(--light-gray)", opacity: 0.3 }} />
              </div>
              <div style={{ position: "relative", display: "flex", justifyContent: "center", fontSize: 14 }}>
                <span className="font-display" style={{ padding: "0 8px", backgroundColor: "var(--dark-green)", color: "var(--light-gray)" }}>OR</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="font-display hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "white", border: "3px solid black", borderRadius: 30, fontSize: 24, color: "black", height: 60, padding: "0 24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, alignSelf: "center" }}
            >
              <svg viewBox="0 0 24 24" style={{ width: "28px", height: "28px", flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex gap-[10px] items-start justify-center font-display text-[24px] px-[16px] py-[16px]">
              <span style={{ color: "var(--light-gray)" }}>Got an Account?</span>
              <Link
                href="/login"
                className="hover:opacity-80"
                style={{ color: "var(--green-lowlight)" }}
              >
                Log In
              </Link>
            </div>
            <div id="clerk-captcha" />
          </form>
        </div>
      </div>
    </div>
  );
}
