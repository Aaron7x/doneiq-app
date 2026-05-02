"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  CheckSquare, 
  MessageSquare, 
  BarChart3, 
  User, 
  Search, 
  Plus,
  LogOut,
  BrainCircuit
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = "getdone-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    router.push("/register");
  };

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Tasks", href: "/dashboard/tasks", icon: CheckSquare },
    { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    { name: "Intelligence", href: "/dashboard/reports", icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden font-sans">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 border-r border-gray-800 bg-gray-800 flex flex-col shadow-2xl">
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-500 uppercase tracking-tighter flex items-center gap-2">
            <BrainCircuit className="h-6 w-6" />
            DoneIQ 👍
          </h1>
        </div>

        {/* Search Bar */}
        <div className="px-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search DoneIQ..." 
              className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 pl-10 pr-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Workspace</p>
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                pathname === item.href 
                  ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" 
                  : "text-gray-400 hover:bg-gray-700/50 hover:text-white"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}

          {/* Projects Section */}
          <div className="mt-10">
            <div className="flex justify-between items-center px-3 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">My Projects</span>
              <button className="text-gray-500 hover:text-blue-500 transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs text-gray-600 italic">
                No active projects
              </div>
            </div>
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-700 space-y-1">
          <Link 
            href="/dashboard/profile" 
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:bg-gray-700/50 hover:text-white rounded-md transition-colors"
          >
            <User className="h-4 w-4" />
            Profile
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

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