"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setNotification({ msg: "Login successful! Synchronizing hub... 👍", type: "success" });
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        setNotification({ msg: data.error || "Login failed", type: "error" });
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
          <BrainCircuit className="h-10 w-10 text-blue-500 mb-2" />
          <h1 className="text-2xl font-bold uppercase tracking-widest text-white">DoneIQ</h1>
          <p className="text-gray-500 text-[10px] mt-1 uppercase tracking-widest">Intelligence Hub Login</p>
        </div>

        {notification && (
          <div className={`mb-6 rounded-md p-3 border text-sm transition-all duration-300 ${
            notification.type === "success" ? "bg-green-900/20 border-green-500/50 text-green-400" : "bg-red-900/20 border-red-500/50 text-red-400"
          }`}>
            {notification.msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">Username or Email</label>
            <input
              type="text" required placeholder="identifier"
              className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">Password</label>
              <button type="button" className="text-[10px] uppercase font-bold text-blue-500 hover:text-blue-400">Forgot?</button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} required placeholder="password"
                className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2.5 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="absolute inset-y-0 right-3 text-[10px] font-bold uppercase text-gray-500 hover:text-blue-400" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={isLoading}
            className={`w-full rounded-md bg-blue-600 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all mt-2
              ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700 active:scale-[0.98]"} 
              shadow-lg shadow-blue-600/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900`}
          >
            {isLoading ? "Authenticating..." : "Login 👍"}
          </button>

          <p className="text-center text-[11px] text-gray-500 pt-2">
            New to DoneIQ? <Link href="/register" className="text-blue-500 font-bold hover:underline">Create Account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}