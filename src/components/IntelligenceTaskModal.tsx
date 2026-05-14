"use client";

import React, { useState } from "react";
import { X, BrainCircuit, Sparkles, CheckSquare, AlignLeft, Flag, Zap, AlertTriangle, Bug, Component } from "lucide-react";
import { supabase } from "@/lib/supabase"; 

interface IntelligenceTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectArchetype: string;
  projectName: string;
  onSuccess?: () => void;
}

export default function IntelligenceTaskModal({ 
  isOpen, 
  onClose, 
  projectId, 
  projectArchetype,
  projectName,
  onSuccess 
}: IntelligenceTaskModalProps) {
  
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("BACKLOG");
  const [priority, setPriority] = useState("Medium");
  const [taskType, setTaskType] = useState<"feature" | "bug">("feature");
  const [description, setDescription] = useState("");
  
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [actualBehavior, setActualBehavior] = useState("");
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMagicGenerating, setIsMagicGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleMagicGenerate = async () => {
    setIsMagicGenerating(true);
    setGenerateError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to generate tasks.");

      const { data: project } = await supabase.from("projects").select("description").eq("id", projectId).single();

      const res = await fetch("/api/ai/generate-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          projectName, 
          projectArchetype, 
          projectDescription: project?.description || "" 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Server returned an error. Check your API key.");
      }
      
      const { tasks } = await res.json();
      if (!tasks || !Array.isArray(tasks)) throw new Error("Invalid AI data formatting.");

      const tasksToInsert = tasks.map((t: any) => ({
        title: t.title,
        description: t.description,
        status: "BACKLOG",
        priority: "Medium",
        task_type: "feature", 
        project_id: projectId,
        user_id: user?.id 
      }));

      const { error } = await supabase.from("tasks").insert(tasksToInsert);
      if (error) throw new Error(error.message);

      await fetch("/api/activity/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: `AI generated a 5-task backlog for ${projectName}`,
          type: "task_created"
        }),
      });

      window.dispatchEvent(new Event("taskCreated"));
      if (onSuccess) onSuccess();
      onClose();

    } catch (error: any) {
      console.error("Magic Generate Error:", error);
      setGenerateError(error.message || "An unexpected error occurred.");
    } finally {
      setIsMagicGenerating(false);
    }
  };

  const handleIntelligenceAssist = async () => {
    if (!title.trim()) return;
    setIsAnalyzing(true);
    try {
      setTimeout(() => {
        setAiSuggestions([
          "What is the definition of 'Done' for this task?",
          `Are there specific ${projectArchetype} dependencies we need to clear first?`,
          "Who needs to review this before it is marked complete?"
        ]);
        setIsAnalyzing(false);
      }, 1500);
    } catch (err) {
      console.error("AI Assistance Error:", err);
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const finalDescription = taskType === "bug" 
        ? `**Steps to Reproduce:**\n${stepsToReproduce}\n\n**Expected Behavior:**\n${expectedBehavior}\n\n**Actual Behavior:**\n${actualBehavior}`
        : description;

      const { error } = await supabase.from("tasks").insert({
        title,
        description: finalDescription,
        status,
        priority,
        task_type: taskType,
        project_id: projectId,
        user_id: user?.id
      });

      if (error) throw error;

      await fetch("/api/activity/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: `New ${taskType === 'feature' ? 'Task' : 'Bug'} added to ${projectName}: ${title}`,
          type: "task_created"
        }),
      });

      setTitle("");
      setDescription("");
      setStepsToReproduce("");
      setExpectedBehavior("");
      setActualBehavior("");
      setStatus("BACKLOG");
      setPriority("Medium");
      setAiSuggestions([]);
      
      window.dispatchEvent(new Event("taskCreated"));
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Task Creation Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-gray-100">
      <div className="w-full max-w-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <CheckSquare className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Intelligence Task Builder</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6 p-6 rounded-xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-inner">
          <div>
            <h4 className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Auto-Generate Backlog
            </h4>
            <p className="text-sm text-gray-300 leading-relaxed">
              Instantly generate 5 highly structured, actionable tasks tailored for a <span className="text-white font-bold">{projectArchetype}</span> project.
            </p>
          </div>
          <button
            onClick={handleMagicGenerate}
            disabled={isMagicGenerating}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
          >
            {isMagicGenerating ? (
              <span className="animate-pulse flex items-center gap-2"><BrainCircuit className="h-5 w-5" /> Generating...</span>
            ) : (
              <><Zap className="h-5 w-5 text-yellow-400 fill-current" /> Magic Generate</>
            )}
          </button>
        </div>

        {generateError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3 animate-in fade-in">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-red-500 font-bold text-sm">Generation Failed</h4>
              <p className="text-red-400 text-xs mt-1">{generateError}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-gray-800 flex-1" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Or Build Manually</span>
          <div className="h-px bg-gray-800 flex-1" />
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800 w-full md:w-64 mx-auto mb-6">
            <button 
              type="button"
              onClick={() => setTaskType("feature")}
              className={`flex-1 py-2 flex items-center justify-center gap-2 text-xs font-bold uppercase rounded-lg transition-all ${taskType === "feature" ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:text-gray-300"}`}
            >
              <Component className="h-4 w-4" /> Task
            </button>
            <button 
              type="button"
              onClick={() => setTaskType("bug")}
              className={`flex-1 py-2 flex items-center justify-center gap-2 text-xs font-bold uppercase rounded-lg transition-all ${taskType === "bug" ? "bg-red-600 text-white shadow-md" : "text-gray-500 hover:text-gray-300"}`}
            >
              <Bug className="h-4 w-4" /> Bug
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest">
                {taskType === 'bug' ? 'Bug Title / Summary' : 'Task Goal / Title'}
              </label>
              <input
                required
                className="w-full bg-gray-800 border border-gray-700 focus:border-blue-500 p-4 rounded-xl text-white focus:outline-none transition-all placeholder:text-gray-600 font-medium"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={taskType === 'bug' ? "e.g., Login button crashes on mobile..." : "What needs to be done?"}
              />
            </div>
            
            {taskType === "feature" && (
              <button
                type="button"
                onClick={handleIntelligenceAssist}
                disabled={!title.trim() || isAnalyzing}
                className="h-[58px] px-6 bg-gray-800 border border-gray-700 text-blue-400 font-bold rounded-xl hover:bg-gray-700 hover:border-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 whitespace-nowrap"
              >
                {isAnalyzing ? (
                  <span className="animate-pulse flex items-center gap-2"><BrainCircuit className="h-5 w-5" /> Analyzing...</span>
                ) : (
                  <><BrainCircuit className="h-5 w-5" /> Prompts</>
                )}
              </button>
            )}
          </div>

          {taskType === "feature" && aiSuggestions.length > 0 && (
            <div className="bg-blue-900/10 border border-blue-800/30 p-5 rounded-xl animate-in fade-in slide-in-from-top-4">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">
                <BrainCircuit className="h-4 w-4" /> Intelligence Prompts
              </h4>
              <ul className="space-y-2">
                {aiSuggestions.map((sug, idx) => (
                  <li key={idx} className="text-sm text-gray-300 flex gap-2">
                    <span className="text-blue-500">•</span> {sug}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {taskType === "feature" ? (
            <div className="animate-in fade-in">
              <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest">
                <AlignLeft className="h-4 w-4" /> Full Description & Requirements
              </label>
              <textarea
                className="w-full bg-gray-800 border border-gray-700 p-4 rounded-xl text-white focus:outline-none focus:border-blue-500 h-32 resize-none placeholder:text-gray-600"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Flesh out the details, acceptance criteria, or answer the intelligence prompts here..."
              />
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest">1. Steps to Reproduce</label>
                <textarea
                  required
                  className="w-full bg-gray-800 border border-gray-700 focus:border-blue-500 p-3 rounded-xl text-white focus:outline-none h-24 resize-none placeholder:text-gray-600"
                  value={stepsToReproduce}
                  onChange={(e) => setStepsToReproduce(e.target.value)}
                  placeholder="1. Go to page X...&#10;2. Click button Y...&#10;3. See error..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest">2. Expected Behavior</label>
                  <textarea
                    required
                    className="w-full bg-gray-800 border border-gray-700 focus:border-blue-500 p-3 rounded-xl text-white focus:outline-none h-24 resize-none placeholder:text-gray-600"
                    value={expectedBehavior}
                    onChange={(e) => setExpectedBehavior(e.target.value)}
                    placeholder="What should have happened?"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest">3. Actual Behavior</label>
                  <textarea
                    required
                    className="w-full bg-gray-800 border border-gray-700 focus:border-blue-500 p-3 rounded-xl text-white focus:outline-none h-24 resize-none placeholder:text-gray-600"
                    value={actualBehavior}
                    onChange={(e) => setActualBehavior(e.target.value)}
                    placeholder="What actually happened instead?"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-800 pt-6">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest">Initial Status</label>
              <select 
                className="w-full bg-gray-800 border border-gray-700 p-4 rounded-xl text-white focus:outline-none focus:border-blue-500 font-medium appearance-none cursor-pointer"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="PRE_PLANNING">Pre-Planning</option>
                <option value="BACKLOG">Backlog</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest">
                <Flag className="h-4 w-4" /> Priority Level
              </label>
              <div className="flex bg-gray-800 p-1 rounded-xl border border-gray-700">
                {["Low", "Medium", "High"].map((lvl) => (
                  <button 
                    key={lvl}
                    type="button"
                    onClick={() => setPriority(lvl)}
                    className={`flex-1 py-2.5 text-xs font-bold uppercase rounded-lg transition-all ${
                      priority === lvl 
                        ? lvl === "High" ? 'bg-red-600/20 text-red-500 shadow-inner border border-red-500/30' :
                          lvl === "Medium" ? 'bg-yellow-600/20 text-yellow-500 shadow-inner border border-yellow-500/30' :
                          'bg-blue-600/20 text-blue-500 shadow-inner border border-blue-500/30'
                        : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 mt-4 text-white rounded-xl font-bold transition shadow-lg disabled:opacity-50 ${taskType === 'bug' ? 'bg-red-600 hover:bg-red-700 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'bg-gray-800 border border-gray-700 hover:bg-gray-700'}`}
          >
            {isSubmitting ? "Saving..." : `Create ${taskType === 'bug' ? 'Bug Report' : 'Task'}`}
          </button>
        </form>
      </div>
    </div>
  );
}