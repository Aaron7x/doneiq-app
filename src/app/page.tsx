"use client";

import React from "react";
import Link from "next/link";
import { BrainCircuit, CheckCircle2, Layout, Zap, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-blue-500/30">
      {/* NAVIGATION */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-xl font-bold tracking-tighter text-blue-500">
          <BrainCircuit className="h-8 w-8" />
          DoneIQ
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all active:scale-95">
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="relative pt-20 pb-32 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full mb-8">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Now in Early Access 👍</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
            Personal Intelligence <br />for your Projects.
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop just managing tasks. Start mastering them with DoneIQ—the intelligent Kanban and productivity board built for speed, collaboration, and results.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl text-lg font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95">
              Launch DoneIQ.app
            </Link>
            <button className="w-full sm:w-auto border border-gray-700 hover:bg-gray-800 text-white px-10 py-4 rounded-xl text-lg font-medium transition-all">
              View Roadmap
            </button>
          </div>
        </div>
        
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      </header>

      {/* FEATURE PREVIEW */}
      <section className="px-6 py-24 bg-gray-800/30 border-y border-gray-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="h-12 w-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500">
              <Layout className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Smart Kanban</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Organize personal projects with an intuitive board that tracks time, status, and dependencies automatically.</p>
          </div>
          <div className="space-y-4">
            <div className="h-12 w-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Intelligence Built-In</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Reports and gamification give you deep insights into your productivity patterns and project health.</p>
          </div>
          <div className="space-y-4">
            <div className="h-12 w-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Team Ready</h3>
            <p className="text-gray-400 text-sm leading-relaxed">From simple comments to custom approval workflows, DoneIQ scales with your project complexity.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 border-t border-gray-800 text-center">
        <p className="text-gray-600 text-xs uppercase tracking-widest">© 2026 DoneIQ.app — Build Your Legacy 👍</p>
      </footer>
    </div>
  );
}