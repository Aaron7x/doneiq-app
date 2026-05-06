"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrainCircuit } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  // Includes First and Last Name
  const [formData, setFormData] = useState({ firstName: "", lastName: "", username: "", email: "", password: "", captchaAnswer: "", faxNumber: "" });
  const [captcha, setCaptcha] = useState({ a: 0, b: 0 });
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setCaptcha({ a: Math.floor(Math.random() * 9) + 1, b: Math.floor(Math.random() * 9) + 1 });
  }, []);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // We now send them to the callback route, and ask it to forward them to the dashboard
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` 
      }
    });

    if (error) {
      setNotification({ msg: error.message, type: "error" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (parseInt(formData.captchaAnswer) !== captcha.a + captcha.b) {
      setNotification({ msg: "Security answer is incorrect.", type: "error" });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setNotification({ msg: "Welcome to DoneIQ! Redirecting... 👍", type: "success" });
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setNotification({ msg: data.error || "Registration failed", type: "error" });
      }
    } catch (err) {
      setNotification({ msg: "Connection failed. Please try again.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4 font-sans text-white">
      <div className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8 text-center">
          <BrainCircuit className="h-12 w-12 text-blue-500 mb-2" />
          <h1 className="text-2xl font-bold uppercase tracking-widest text-white">DoneIQ</h1>
          <p className="text-gray-500 text-[10px] mt-1 uppercase tracking-widest">Create Intelligence Account</p>
        </div>

        {notification && (
          <div className={`mb-6 rounded-md p-3 border text-sm transition-all duration-300 ${
            notification.type === "success" ? "bg-green-900/20 border-green-500/50 text-green-400" : "bg-red-900/20 border-red-500/50 text-red-400"
          }`}>
            {notification.msg}
          </div>
        )}

        {/* --- Google OAuth Button --- */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 rounded-md bg-white text-gray-900 py-3 text-sm font-bold uppercase tracking-widest transition-all hover:bg-gray-100 shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center mb-6">
          <div className="flex-1 border-t border-gray-700"></div>
          <span className="px-3 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Or Register Manually</span>
          <div className="flex-1 border-t border-gray-700"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="hidden" aria-hidden="true">
            <input type="text" name="faxNumber" tabIndex={-1} autoComplete="off" onChange={(e) => setFormData({ ...formData, faxNumber: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">First Name</label>
              <input
                type="text" required placeholder="First"
                className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">Last Name</label>
              <input
                type="text" required placeholder="Last"
                className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">Username</label>
            <input
              type="text" required placeholder="username"
              className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">Email Address</label>
            <input
              type="email" required placeholder="email@example.com"
              className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} required placeholder="password"
                className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button type="button" className="absolute inset-y-0 right-3 text-[10px] font-bold uppercase text-gray-500 hover:text-blue-400" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">Security Verification</label>
            <div className="flex items-center rounded-md border border-gray-700 bg-gray-900/50 overflow-hidden">
              <div className="px-4 py-2 bg-gray-800 border-r border-gray-700 text-xs font-bold text-blue-400 whitespace-nowrap">
                {captcha.a} + {captcha.b} =
              </div>
              <input
                type="number" required placeholder="?"
                className="w-full bg-transparent p-2.5 text-sm text-white placeholder-gray-600 focus:outline-none"
                onChange={(e) => setFormData({ ...formData, captchaAnswer: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit" disabled={isLoading}
            className={`w-full rounded-md bg-blue-600 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all mt-2
              ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700 active:scale-[0.98]"} 
              shadow-lg shadow-blue-600/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900`}
          >
            {isLoading ? "Verifying..." : "Register 👍"}
          </button>

          <p className="text-center text-[11px] text-gray-500 pt-2">
            Already have an account? <Link href="/login" className="text-blue-500 font-bold hover:underline">Login here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}