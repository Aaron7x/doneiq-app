"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrainCircuit } from "lucide-react";

export default function RegisterPage() {
  // Added firstName and lastName to the state
  const [formData, setFormData] = useState({ firstName: "", lastName: "", username: "", email: "", password: "", captchaAnswer: "", faxNumber: "" });
  const [captcha, setCaptcha] = useState({ a: 0, b: 0 });
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setCaptcha({ a: Math.floor(Math.random() * 9) + 1, b: Math.floor(Math.random() * 9) + 1 });
  }, []);

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
          {/* Back to the Blue Brain Circuit */}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot */}
          <div className="hidden" aria-hidden="true">
            <input type="text" name="faxNumber" tabIndex={-1} autoComplete="off" onChange={(e) => setFormData({ ...formData, faxNumber: e.target.value })} />
          </div>

          {/* New First and Last Name Grid */}
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

          {/* Integrated Security Check */}
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