import React from "react";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden font-sans">
      {/* The Sidebar is now its own standalone component */}
      <Sidebar />

      {/* RIGHT SIDE CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-gray-800 bg-gray-800/30 backdrop-blur-md flex items-center justify-end px-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-yellow-900/20 border border-yellow-700/30 px-3 py-1 rounded-full">
                  <span className="text-[10px] font-bold text-yellow-500 tracking-wider uppercase">IQ Level 1</span>
              </div>
            </div>
        </header>
        
        <main className="flex-1 overflow-y-auto bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}