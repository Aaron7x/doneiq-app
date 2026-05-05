"use client";

import React, { useState, useEffect, useCallback } from "react";
import ProjectModal from "@/components/ProjectModal";

export default function Dashboard() {
  const [task, setTask] = useState("");
  const [taskList, setTaskList] = useState([]);
  const [projects, setProjects] = useState([]); 
  const [activities, setActivities] = useState([]); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Profile data
  const user = { name: "Aaron", points: 150 }; 

  // Memoized fetch function to ensure the Modal and local functions stay in sync
  const fetchData = useCallback(async () => {
    console.log("Dashboard: Syncing data nodes...");
    const timestamp = new Date().getTime();
    
    try {
      const [tasksRes, projectsRes, activityRes] = await Promise.all([
        fetch(`/api/tasks/get?t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/projects/get?t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/activity/get?t=${timestamp}`, { cache: 'no-store' }) 
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTaskList(tasksData);
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData);
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setActivities(activityData);
      }
    } catch (err) {
      console.error("Dashboard: Data sync error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // Global listener for project creation signals (from Navbar or Modal)
    window.addEventListener('projectCreated', fetchData);
    
    // Backup listener for browser tab refocusing
    window.addEventListener('focus', fetchData);

    return () => {
      window.removeEventListener('projectCreated', fetchData);
      window.removeEventListener('focus', fetchData);
    };
  }, [fetchData]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) return;

    setIsSubmitting(true);
    try {
      // 1. Create the Task
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: task }),
      });

      if (res.ok) {
        // 2. Log the activity for this task
        await fetch("/api/activity/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: `New task added: ${task}`,
            type: "task_created"
          }),
        });

        setTask("");
        fetchData(); 
      }
    } catch (err) {
      console.error("Task add error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto text-gray-100">
      <header className="mb-8">
        <h2 className="text-4xl font-extrabold tracking-tight text-white">
          Welcome back, <span className="text-blue-500">{user.name}</span>!
        </h2>
        <p className="text-gray-400 mt-2 italic">Ready to crush some goals today? 👍</p>
      </header>

      {/* Quick Add Task Bar */}
      <section className="mb-10">
        <form onSubmit={handleAddTask} className="flex gap-2 p-2 rounded-xl bg-gray-900 border border-gray-800 shadow-2xl">
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Type a new task and press enter..."
            disabled={isSubmitting}
            className="flex-1 bg-transparent p-3 text-white placeholder-gray-500 focus:outline-none"
          />
          <button 
            type="submit"
            disabled={isSubmitting || !task.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSubmitting ? "Adding..." : "Add Task"}
          </button>
        </form>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="rounded-xl border border-gray-800 bg-gray-800 p-6 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Game Points</h3>
          <p className="text-3xl font-bold text-white">{user.points} <span className="text-sm text-gray-400">pts</span></p>
        </div>
        
        {/* Active Projects - Click and Cursor Pointer Removed */}
        <div className="rounded-xl border border-gray-800 bg-gray-800 p-6 shadow-xl relative transition-all">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Active Projects</h3>
          <p className="text-3xl font-bold text-yellow-500">{projects.length}</p>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-800 p-6 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Tasks Completed</h3>
          <p className="text-3xl font-bold text-green-500">0</p>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="rounded-xl border border-gray-800 bg-gray-800 p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Recent Activity</h3>
          <span className="text-xs text-gray-600">Showing last 7 updates</span>
        </div>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-700/50 rounded w-full"></div>
              <div className="h-4 bg-gray-700/50 rounded w-5/6"></div>
              <div className="h-4 bg-gray-700/50 rounded w-4/6"></div>
            </div>
          ) : activities.length > 0 ? (
            activities.slice(0, 7).map((act: any) => (
              <div key={act.id} className="flex items-center gap-4 text-sm text-gray-400 pb-4 border-b border-gray-700 last:border-0 hover:bg-white/5 transition-all p-2 rounded-lg">
                <div className={`h-2 w-2 rounded-full ${act.type === 'project_created' ? 'bg-yellow-500 shadow-[0_0_8px_#eab308]' : 'bg-blue-500 shadow-[0_0_8px_#3b82f6]'}`}></div>
                <p className="text-gray-200">
                  {act.description}
                </p>
                <span className="ml-auto text-xs text-gray-600">
                  {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          ) : taskList.length > 0 ? (
            /* Detailed Fallback Logic Restored */
            taskList.slice(0, 7).map((t: any) => (
              <div key={t.id} className="flex items-center gap-4 text-sm text-gray-400 pb-4 border-b border-gray-700 last:border-0 hover:bg-white/5 transition-all p-2 rounded-lg">
                <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></div>
                <p className="text-gray-200">
                  New task added: <span className="text-white font-medium">"{t.title}"</span>
                </p>
                <span className="ml-auto text-xs text-gray-600">
                  {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          ) : (
            <div className="py-4 text-center">
              <p className="text-gray-600 italic text-xs tracking-widest uppercase">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Dashboard Modal Instance */}
      <ProjectModal 
        isOpen={isProjectModalOpen} 
        onClose={() => setIsProjectModalOpen(false)} 
        onSuccess={fetchData} 
      />
    </div>
  );
}