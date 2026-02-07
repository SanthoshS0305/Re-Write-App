"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between relative overflow-hidden gap-0">
      {/* Background Image */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute bg-dark-mint-green inset-0" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-fit max-w-md px-8 flex flex-col items-center py-10 flex-1 justify-center" style={{ height: 'fit-content', width: 'fit-content' }}>
        {/* Welcome Text */}
        <div className="mb-6 text-center flex login-welcome-container" style={{ height: 'fit-content', width: 'fit-content' }}>
          <p className="font-display text-4xl leading-tight flex gap-[10px] login-welcome-text">
            <span className="text-aqua login-welcome-span">Hello, Author,</span>
            <span className="text-light-gray login-welcome-span-light">Welcome back to</span>
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-dark-green rounded-[10px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] pt-[60px] pb-[60px] px-[40px] w-full h-full flex flex-col justify-center items-center" style={{ backgroundColor: 'var(--dark-green)' }}>
          {/* Logo */}
          <div className="text-center mb-8 py-0">
            <h1 className="font-display text-7xl leading-none">
              <span className="text-aqua" style={{ fontSize: '96px' }}>Re</span>
              <span className="text-mint-green" style={{ fontSize: '96px' }}>:</span>
              <span className="text-light-gray" style={{ fontSize: '96px' }}>Write</span>
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">
            <div className="text-light-gray" style={{ padding: '2px' }}>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="!bg-mint-green !border-[3px] !border-dark-green-highlight !rounded-[20px] !text-black placeholder:!text-black/60 text-2xl !h-14 !px-4 font-display focus:!ring-0 focus:!outline-none focus:!border-dark-green-highlight"
                style={{ fontSize: '24px', overflow: 'visible' }}
              />
            </div>
            <div className="text-light-gray">
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="!bg-mint-green !border-[2px] !border-dark-green-highlight !rounded-[20px] !text-accent placeholder:!text-black/60 text-2xl !h-14 !px-4 font-display focus:!ring-0 focus:!outline-none focus:!border-dark-green-highlight"
                style={{ fontSize: '24px' }}
              />
            </div>
            {error && (
              <div className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded p-3">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full !bg-aqua !border-[3px] !border-dark-green-highlight !rounded-[30px] !text-black font-display text-2xl !h-14 hover:!bg-aqua/90 disabled:opacity-50 !flex !flex-col" 
              disabled={loading}
              style={{ fontSize: '24px', backgroundColor: 'var(--aqua)', color: 'var(--dark-green)' }}
            >
              {loading ? "Signing in..." : "Login"}
            </Button>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-light-gray/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-dark-green text-light-gray font-display">OR</span>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="w-full !bg-white !border-[3px] !border-dark-green-highlight !rounded-[30px] !text-black font-display text-2xl !h-14 hover:!bg-gray-100 disabled:opacity-50 !flex !items-center !justify-center !gap-2"
              style={{ fontSize: '24px', color: 'var(--mint-green)', padding: '3px 10px' }}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" style={{ width: '45px' }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
            <div className="text-center font-display text-xl">
              <span className="text-light-gray">No Account? </span>
              <Link href="/signup" className="text-green-lowlight hover:text-green-lowlight/80" style={{ color: 'var(--green-lowlight)', fontSize: '20px' }}>
                Create One
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Attribution */}
      <div className="relative z-10 w-full px-8 pb-8 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="attribution font-display">
            "<a rel="noopener noreferrer" href="https://www.rawpixel.com/image/11515769/woman-nature-stormy-sky">Woman in nature, stormy sky</a>" is marked with <a rel="noopener noreferrer" href="https://creativecommons.org/publicdomain/zero/1.0/?ref=openverse">CC0 1.0 <img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" style={{ height: '1em', marginRight: '0.125em', display: 'inline' }} /><img src="https://mirrors.creativecommons.org/presskit/icons/zero.svg" style={{ height: '1em', marginRight: '0.125em', display: 'inline' }} /></a>.
          </p>
        </div>
      </div>
    </div>
  );
}

