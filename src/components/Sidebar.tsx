"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard as IconDashboard, 
  CheckSquare as IconTasks, 
  MessageSquare as IconMessages, 
  BarChart3 as IconReports, 
  User as IconUser, 
  Search as IconSearch, 
  Plus as IconPlus,
  LogOut as IconLogout,
  BrainCircuit as IconLogo,
  Menu,
  X
} from "lucide-react";
import ProjectModal from "./ProjectModal";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [projects, setProjects] = useState([]);

  // Fetch Projects Logic
  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects/get");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("Sidebar Project Fetch Error:", err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleLogout = () => {
    document.cookie = "getdone-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    router.push("/register");
  };

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: IconDashboard },
    { name: "My Tasks", href: "/dashboard/tasks", icon: IconTasks },
    { name: "Messages", href: "/dashboard/messages", icon: IconMessages },
    { name: "Intelligence", href: "/dashboard/reports", icon: IconReports },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex flex-row items-center justify-between bg-gray-800 px-4 h-16 border-b border-gray-700 sticky top-0 z-40 flex-nowrap shrink-0">
        <div className="flex items-center gap-2">
          {/* Primary Logo always visible, text and thumbs-up hidden on ultra-small mobile screens */}
          <IconLogo className="h-6 w-6 text-blue-500 shrink-0" />
          <span className="hidden sm:block text-xl font-bold text-blue-500 uppercase tracking-tighter truncate">
            DoneIQ
          </span>
          <span className="hidden sm:block text-xl shrink-0">👍</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="text-gray-400 hover:text-white transition-colors p-2 shrink-0"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Responsive Sidebar / Drawer */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-800 bg-gray-800 flex flex-col shadow-2xl h-screen transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 hidden md:block shrink-0">
          <h1 className="text-xl font-bold text-blue-500 uppercase tracking-tighter flex items-center gap-2">
            <IconLogo className="h-6 w-6 shrink-0" />
            DoneIQ 👍
          </h1>
        </div>

        {/* Search Bar */}
        <div className="px-4 mb-6 mt-4 md:mt-0 shrink-0">
          <div className="relative">
            <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search DoneIQ..." 
              className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 pl-10 pr-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Workspace</p>
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                pathname === item.href 
                  ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" 
                  : "text-gray-400 hover:bg-gray-700/50 hover:text-white"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.name}
            </Link>
          ))}

          {/* Projects Section */}
          <div className="mt-10">
            <div className="flex justify-between items-center px-3 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">My Projects</span>
              <button 
                onClick={() => {
                  setIsProjectModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="text-gray-500 hover:text-blue-500 transition-colors"
              >
                <IconPlus className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-1">
              {projects.length > 0 ? (
                projects.map((p: any) => (
                  <Link 
                    key={p.id} 
                    href={`/projects/${p.id}`} 
                    className="block"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors rounded-md cursor-pointer ${
                      pathname === `/projects/${p.id}` 
                        ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" 
                        : "text-gray-400 hover:bg-gray-700/50 hover:text-white"
                    }`}>
                      <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.color || '#3b82f6' }} />
                      <span className="truncate">{p.name}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-gray-600 italic">
                  No active projects
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-700 space-y-1 bg-gray-800 shrink-0">
          <Link 
            href="/dashboard/profile" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:bg-gray-700/50 hover:text-white rounded-md transition-colors"
          >
            <IconUser className="h-4 w-4 shrink-0" />
            Profile
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-md transition-colors"
          >
            <IconLogout className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Project Modal Integration */}
      <ProjectModal 
        isOpen={isProjectModalOpen} 
        onClose={() => setIsProjectModalOpen(false)} 
        onSuccess={fetchProjects} 
      />
    </>
  );
}