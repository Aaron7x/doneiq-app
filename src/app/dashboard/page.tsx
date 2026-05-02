"use client";

import React from "react";

export default function Dashboard() {
  // We'll hook these up to your Supabase data next
  const user = { name: "Champion", points: 150 }; 

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <h2 className="text-4xl font-extrabold tracking-tight text-white">
          Welcome back, <span className="text-blue-500">{user.name}</span>!
        </h2>
        <p className="text-gray-400 mt-2 italic">Ready to crush some goals today? 👍</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="rounded-xl border border-gray-800 bg-gray-800 p-6 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Game Points</h3>
          <p className="text-3xl font-bold text-white">{user.points} <span className="text-sm text-gray-500">pts</span></p>
        </div>
        
        <div className="rounded-xl border border-gray-800 bg-gray-800 p-6 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Active Projects</h3>
          <p className="text-3xl font-bold text-yellow-500">0</p>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-800 p-6 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Tasks Completed</h3>
          <p className="text-3xl font-bold text-green-500">0</p>
        </div>
      </div>

      {/* Activity Feed Placeholder */}
      <div className="rounded-xl border border-gray-800 bg-gray-800 p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">Recent Activity</h3>
        <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-gray-400 pb-4 border-b border-gray-700">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <p>Welcome to <span className="text-white font-medium">GetDone</span>! Start by creating a project.</p>
                <span className="ml-auto text-xs text-gray-600">Just now</span>
            </div>
        </div>
      </div>
    </div>
  );
}