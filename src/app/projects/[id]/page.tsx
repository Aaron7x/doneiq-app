"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar"; 
import IntelligenceTaskModal from "@/components/IntelligenceTaskModal";
import TaskDetailPane from "@/components/TaskDetailPane";
import { 
  Archive, 
  Trash2, 
  LayoutList, 
  KanbanSquare, 
  PlusCircle,
  BrainCircuit,
  AlertTriangle
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  archetype: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  parent_id?: string | null;
}

const KANBAN_COLUMNS = [
  "PRE_PLANNING", 
  "BACKLOG", 
  "IN_PROGRESS", 
  "REVIEW", 
  "COMPLETED", 
  "CANCELLED"
];

export default function ProjectPage() {
  const { id } = useParams();
  const router = useRouter();
  
  // Existing State
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Feature State
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [quickTask, setQuickTask] = useState("");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [isIntelligenceModalOpen, setIsIntelligenceModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  // Inline Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const fetchProjectData = async () => {
    if (!id) return;

    // 1. Fetch Project Details
    const { data: projectData } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    // 2. Fetch Tasks for this project (Only Top Level)
    const { data: taskData } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", id)
      .is("parent_id", null)
      .order("created_at", { ascending: true });

    if (projectData) setProject(projectData);
    if (taskData) setTasks(taskData);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjectData();
    
    // Listen for comprehensive tasks created by the modal
    window.addEventListener('taskCreated', fetchProjectData);
    return () => window.removeEventListener('taskCreated', fetchProjectData);
  }, [id]);

  // --- Action Handlers --- //

  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTask.trim()) return;

    setIsSubmittingTask(true);
    try {
      const { data, error } = await supabase.from("tasks").insert({
        title: quickTask,
        project_id: id,
        status: "BACKLOG"
      }).select().single();

      if (error) throw error;

      await fetch("/api/activity/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: `New task added to ${project?.name}: ${quickTask}`,
          type: "task_created"
        }),
      });

      setQuickTask("");
      fetchProjectData(); 
    } catch (err) {
      console.error("Task add error:", err);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleArchiveProject = async () => {
    try {
      await supabase.from("projects").update({ status: "ARCHIVED" }).eq("id", id);
      
      await fetch("/api/activity/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: `Project Archived: ${project?.name}`,
          type: "project_updated"
        }),
      });
      
      router.push("/dashboard");
    } catch (error) {
      console.error("Archive Error", error);
    }
  };

  const handleDeleteProject = async () => {
    try {
      await supabase.from("projects").delete().eq("id", id);
      
      await fetch("/api/activity/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: `Project Deleted: ${project?.name}`,
          type: "project_updated"
        }),
      });
      
      router.push("/dashboard");
    } catch (error) {
      console.error("Delete Error", error);
    }
  };

  // --- Render Layout Wrappers --- //
  
  if (loading) return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-900 text-gray-100">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center">
        <div className="p-8 text-zinc-400 animate-pulse tracking-widest uppercase text-xs">Loading Intelligence Nodes...</div>
      </main>
    </div>
  );

  if (!project) return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-900 text-gray-100">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center">
        <div className="p-8 text-red-500 font-bold uppercase tracking-widest">Project Not Found</div>
      </main>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-900 text-gray-100">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div 
                className="w-4 h-16 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)]" 
                style={{ backgroundColor: project.color || "#3b82f6" }} 
              />
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">{project.name}</h1>
                <p className="text-gray-400 uppercase tracking-widest text-xs mt-2 font-bold flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-blue-500" />
                  Archetype: {project.archetype}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => { setShowArchiveConfirm(true); setShowDeleteConfirm(false); }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 hover:border-yellow-500/50 hover:text-yellow-500 rounded-lg transition-colors text-sm font-bold text-gray-400"
              >
                <Archive className="h-4 w-4" /> Archive
              </button>
              <button 
                onClick={() => { setShowDeleteConfirm(true); setShowArchiveConfirm(false); }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors text-sm font-bold text-gray-400"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>

          {showArchiveConfirm && (
            <div className="mb-8 p-6 bg-yellow-500/10 border border-yellow-500/50 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-3 text-yellow-500">
                <AlertTriangle className="h-6 w-6" />
                <p className="font-bold">Archive this project? It will be hidden from active views.</p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button onClick={() => setShowArchiveConfirm(false)} className="flex-1 md:flex-none px-6 py-2 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-700 transition">Cancel</button>
                <button onClick={handleArchiveProject} className="flex-1 md:flex-none px-6 py-2 bg-yellow-600 text-white rounded-lg font-bold hover:bg-yellow-700 transition shadow-[0_0_15px_rgba(202,138,4,0.4)]">Confirm Archive</button>
              </div>
            </div>
          )}

          {showDeleteConfirm && (
            <div className="mb-8 p-6 bg-red-500/10 border border-red-500/50 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-3 text-red-500">
                <AlertTriangle className="h-6 w-6" />
                <p className="font-bold">Permanently delete this project and all associated tasks?</p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 md:flex-none px-6 py-2 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-700 transition">Cancel</button>
                <button onClick={handleDeleteProject} className="flex-1 md:flex-none px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition shadow-[0_0_15px_rgba(220,38,38,0.4)]">Yes, Delete Everything</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="md:col-span-3 space-y-6">
              <section className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-xl">
                <h2 className="text-gray-500 text-xs uppercase font-bold mb-4 tracking-widest">Project Objective</h2>
                <p className="text-gray-200 leading-relaxed text-lg">
                  {project.description || "No objective defined for this project."}
                </p>
              </section>

              <section>
                <form onSubmit={handleQuickAddTask} className="flex gap-2 p-2 rounded-xl bg-gray-900 border border-gray-800 shadow-2xl">
                  <input
                    type="text"
                    value={quickTask}
                    onChange={(e) => setQuickTask(e.target.value)}
                    placeholder="Quick add task to backlog..."
                    disabled={isSubmittingTask}
                    className="flex-1 bg-transparent p-3 text-white placeholder-gray-500 focus:outline-none"
                  />
                  <button 
                    type="submit"
                    disabled={isSubmittingTask || !quickTask.trim()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    {isSubmittingTask ? "Adding..." : "Add"}
                  </button>
                </form>
              </section>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-center shadow-xl">
                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">Total Tasks</p>
                <p className="text-5xl font-extrabold text-blue-500">{tasks.length}</p>
              </div>
              <button 
                onClick={() => setIsIntelligenceModalOpen(true)}
                className="w-full py-4 bg-gray-800 border border-gray-700 text-white font-bold rounded-xl hover:bg-gray-700 hover:border-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <BrainCircuit className="h-5 w-5 text-blue-400" />
                Intelligence Task
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
            <h2 className="text-gray-400 text-xs uppercase font-bold tracking-widest">Project Roadmap</h2>
            <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800">
              <button 
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase rounded-md transition-all ${viewMode === "kanban" ? "bg-gray-800 text-white shadow-sm" : "text-gray-500 hover:text-white"}`}
              >
                <KanbanSquare className="h-4 w-4" /> Kanban
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase rounded-md transition-all ${viewMode === "list" ? "bg-gray-800 text-white shadow-sm" : "text-gray-500 hover:text-white"}`}
              >
                <LayoutList className="h-4 w-4" /> List
              </button>
            </div>
          </div>

          {viewMode === "list" ? (
            <section className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-xl">
              <div className="space-y-3">
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <div key={task.id} onClick={() => setSelectedTaskId(task.id)} className="flex items-center gap-4 p-4 bg-gray-800/50 hover:bg-gray-800 transition-colors rounded-xl border border-gray-700/50 cursor-pointer">
                      <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                      <span className="text-gray-200 font-medium">{task.title}</span>
                      <span className="ml-auto text-[10px] font-bold tracking-widest bg-gray-950 border border-gray-700 text-gray-400 px-3 py-1.5 rounded-lg">
                        {task.status.replace("_", " ")}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm italic text-center py-8 uppercase tracking-widest text-xs">No tasks found for this project.</p>
                )}
              </div>
            </section>
          ) : (
            <div className="flex gap-4 xl:gap-4 overflow-x-auto pb-8 snap-x">
              {KANBAN_COLUMNS.map(column => {
                const columnTasks = tasks.filter(t => t.status === column);
                return (
                  <div 
                    key={column} 
                    className="w-[280px] shrink-0 xl:flex-1 xl:w-auto xl:min-w-[150px] bg-gray-900/50 border border-gray-800 rounded-xl p-4 snap-start flex flex-col max-h-[800px]"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 truncate pr-2">{column.replace("_", " ")}</h3>
                      <span className="text-xs bg-gray-800 text-gray-500 px-2 py-1 rounded-md font-bold shrink-0">{columnTasks.length}</span>
                    </div>
                    
                    <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                      {columnTasks.length > 0 ? (
                        columnTasks.map(task => (
                          <div key={task.id} onClick={() => setSelectedTaskId(task.id)} className="p-4 bg-gray-800 border border-gray-700 rounded-xl shadow-lg hover:border-blue-500/50 transition-colors cursor-pointer group">
                            <p className="text-sm text-gray-200 font-medium group-hover:text-white transition-colors break-words">{task.title}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 border border-dashed border-gray-800 rounded-xl flex items-center justify-center">
                          <p className="text-gray-600 text-[10px] italic tracking-wide uppercase">Drop tasks here</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <IntelligenceTaskModal 
        isOpen={isIntelligenceModalOpen}
        onClose={() => setIsIntelligenceModalOpen(false)}
        projectId={id as string}
        projectArchetype={project.archetype}
        projectName={project.name}
        onSuccess={fetchProjectData}
      />

      <TaskDetailPane 
        taskId={selectedTaskId} 
        projectId={id as string} 
        onClose={() => setSelectedTaskId(null)} 
        onUpdate={fetchProjectData} 
      />
    </div>
  );
}