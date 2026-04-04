"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const displayName = [firstName, lastName].filter(Boolean).join(" ") || username;

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: displayName,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "An error occurred");
        return;
      }

      router.push("/login");
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
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
        <div className="flex gap-[10px] items-center justify-center h-[100px] px-[10px]">
          <span className="font-display text-[64px] leading-normal" style={{ color: "var(--aqua)" }}>
            Hello, Author,
          </span>
          <span className="font-display text-[64px] leading-normal" style={{ color: "var(--light-gray)" }}>
            Welcome to
          </span>
        </div>

        {/* Signup Card */}
        <div
          className="flex flex-col items-center gap-[10px] rounded-[10px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] px-[30px] py-[40px] overflow-clip"
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
            <Input
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="font-display !bg-mint-green !border-[3px] !border-black !rounded-[20px] !text-black placeholder:!text-black/60 !h-14 !px-4 focus:!ring-0 focus:!outline-none"
              style={{ fontSize: "32px" }}
            />
            <Input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="font-display !bg-mint-green !border-[3px] !border-black !rounded-[20px] !text-black placeholder:!text-black/60 !h-14 !px-4 focus:!ring-0 focus:!outline-none"
              style={{ fontSize: "32px" }}
            />
            <div className="flex gap-[10px]">
              <Input
                id="firstName"
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="font-display !bg-mint-green !border-[3px] !border-black !rounded-[20px] !text-black placeholder:!text-black/60 !h-14 !px-4 focus:!ring-0 focus:!outline-none flex-1"
                style={{ fontSize: "32px" }}
              />
              <Input
                id="lastName"
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="font-display !bg-mint-green !border-[3px] !border-black !rounded-[20px] !text-black placeholder:!text-black/60 !h-14 !px-4 focus:!ring-0 focus:!outline-none flex-1"
                style={{ fontSize: "32px" }}
              />
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="font-display !bg-mint-green !border-[3px] !border-black !rounded-[20px] !text-black placeholder:!text-black/60 !h-14 !px-4 focus:!ring-0 focus:!outline-none"
              style={{ fontSize: "32px" }}
            />
            <Input
              id="repeatPassword"
              type="password"
              placeholder="Repeat Password"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              required
              minLength={6}
              className="font-display !bg-mint-green !border-[3px] !border-black !rounded-[20px] !text-black placeholder:!text-black/60 !h-14 !px-4 focus:!ring-0 focus:!outline-none"
              style={{ fontSize: "32px" }}
            />

            {error && (
              <div className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded p-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="font-display !border-[3px] !border-black !rounded-[30px] !text-black !h-[60px] hover:opacity-90 disabled:opacity-50 self-center px-[16px]"
              style={{ fontSize: "36px", backgroundColor: "var(--green-highlight)" }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: "var(--light-gray)", opacity: 0.3 }} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 font-display" style={{ backgroundColor: "var(--dark-green)", color: "var(--light-gray)" }}>OR</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="font-display !bg-white !border-[3px] !border-black !rounded-[30px] !text-black !h-[60px] hover:!bg-gray-100 disabled:opacity-50 flex items-center justify-center gap-2 self-center px-[16px]"
              style={{ fontSize: "24px" }}
            >
              <svg viewBox="0 0 24 24" style={{ width: "28px", height: "28px", flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

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
          </form>
        </div>
      </div>
    </div>
  );
}
