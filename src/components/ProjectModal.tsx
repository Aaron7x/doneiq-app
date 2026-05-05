"use client";

import React, { useState } from "react";
import { X, BrainCircuit } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRESET_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
  "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f97316", "#06b6d4", "#84cc16", "#64748b"
];

export default function ProjectModal({ isOpen, onClose, onSuccess }: ProjectModalProps) {
  const router = useRouter();
  
  // Core State
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [description, setDescription] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [teamMember, setTeamMember] = useState("");
  
  // Intelligence State
  const [archetype, setArchetype] = useState("general");
  const [aiMode, setAiMode] = useState("passive");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Create the Project
      const projectRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, color, description, 
          end_date: endDate || null,
          budget: budget || null,
          archetype, ai_mode: aiMode
        }),
      });

      if (!projectRes.ok) throw new Error("Failed to create project");
      const newProject = await projectRes.json();

      // 2. Log Project Creation Activity
      await fetch("/api/activity/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: `New project created: ${name}`,
          type: "project_created"
        }),
      });

      // 3. AI Task Injection & Logging
      if (aiMode === "autonomous") {
        const aiRes = await fetch("/api/ai/analyze-project", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, objective: description, archetype }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const taskCount = aiData.suggested_tasks?.length || 0;

          // Inject tasks
          await fetch("/api/tasks/bulk-create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId: newProject.id,
              tasks: aiData.suggested_tasks
            }),
          });

          // NEW: Log the AI activity specifically
          await fetch("/api/activity/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              description: `AI Intelligence: ${taskCount} tasks initialized for ${name}`,
              type: "task_created" // This uses the blue dot
            }),
          });
        }
      }

      // 4. Cleanup
      setName("");
      setDescription("");
      setEndDate("");
      setBudget("");
      setTeamMember("");
      
      window.dispatchEvent(new Event("projectCreated"));
      if (onSuccess) onSuccess();
      router.refresh();
      onClose();
      
    } catch (err) {
      console.error("Project Creation Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-gray-100">
      <div className="w-full max-w-xl border border-gray-800 bg-gray-900 p-8 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Create New Project</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest">Project Name</label>
            <input
              required
              className="w-full bg-gray-800 border border-gray-700 p-4 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-600"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest">Project Color</label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-10 rounded-lg border-2 transition-all ${color === c ? 'border-white scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest">End Date (Optional)</label>
              <input
                type="date"
                className="w-full bg-gray-800 border border-gray-700 p-3 rounded-xl text-white focus:outline-none focus:border-blue-500"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest">Budget (Optional)</label>
              <input
                type="number"
                className="w-full bg-gray-800 border border-gray-700 p-3 rounded-xl text-white focus:outline-none focus:border-blue-500"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="$ 0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest">Invite Members</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-blue-500 font-bold">@</span>
              <input
                className="w-full bg-gray-800 border border-gray-700 p-3 pl-10 rounded-xl text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-600"
                value={teamMember}
                onChange={(e) => setTeamMember(e.target.value)}
                placeholder="username or email"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest">Objective</label>
            <textarea
              className="w-full bg-gray-800 border border-gray-700 p-4 rounded-xl text-white focus:outline-none focus:border-blue-500 h-28 resize-none placeholder:text-gray-600"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are the goals of this project?"
            />
          </div>

          <div className="border-t border-gray-800 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <BrainCircuit className="h-4 w-4 text-blue-500" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Intelligence Settings</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Project Archetype</label>
                <select 
                  className="w-full bg-gray-800 border border-gray-700 p-3 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm appearance-none cursor-pointer"
                  value={archetype}
                  onChange={(e) => setArchetype(e.target.value)}
                >
                  <option value="general">General Purpose</option>
                  <option value="dev">Software Development</option>
                  <option value="marketing">Marketing & Creative</option>
                  <option value="research">Research & Analysis</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">AI Assistance</label>
                <div className="flex bg-gray-800 p-1 rounded-xl border border-gray-700">
                  <button 
                    type="button"
                    onClick={() => setAiMode('passive')}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${aiMode === 'passive' ? 'bg-gray-700 text-white shadow-inner' : 'text-gray-500'}`}
                  >
                    Passive
                  </button>
                  <button 
                    type="button"
                    onClick={() => setAiMode('autonomous')}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${aiMode === 'autonomous' ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'text-gray-500'}`}
                  >
                    Autonomous
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-xl disabled:opacity-50"
          >
            {isSubmitting ? "Creating Project..." : "Create Project"}
          </button>
        </form>
      </div>
    </div>
  );
}