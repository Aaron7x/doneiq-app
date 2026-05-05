"use client";

import React, { useState } from "react";
import { X, BrainCircuit, Sparkles, CheckSquare, AlignLeft, Flag } from "lucide-react";
import { supabase } from "@/lib/supabase"; // NEW: Direct Supabase Import

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
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("BACKLOG");
  const [priority, setPriority] = useState("Medium");
  
  // Intelligence State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleIntelligenceAssist = async () => {
    if (!title.trim()) return;
    setIsAnalyzing(true);
    
    try {
      const aiRes = await fetch("/api/ai/enhance-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          taskTitle: title, 
          archetype: projectArchetype 
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        setAiSuggestions(aiData.suggestions || ["Define acceptance criteria", "Identify dependencies", "Estimate effort"]);
      } else {
        setTimeout(() => {
          setAiSuggestions([
            "What is the definition of 'Done' for this task?",
            `Are there specific ${projectArchetype} dependencies we need to clear first?`,
            "Who needs to review this before it is marked complete?"
          ]);
        }, 1500);
      }
    } catch (err) {
      console.error("AI Assistance Error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // NEW: Direct Supabase Insertion (Matches Quick Add)
      const { data, error } = await supabase.from("tasks").insert({
        title,
        description,
        status,
        priority,
        project_id: projectId
      }).select().single();

      if (error) throw error;

      // Log Activity
      await fetch("/api/activity/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: `Comprehensive task added to ${projectName}: ${title}`,
          type: "task_created"
        }),
      });

      // Cleanup & Broadcast
      setTitle("");
      setDescription("");
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
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest">Task Goal / Title</label>
              <input
                required
                className="w-full bg-gray-800 border border-gray-700 p-4 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-600 font-medium"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
              />
            </div>
            <button
              type="button"
              onClick={handleIntelligenceAssist}
              disabled={!title.trim() || isAnalyzing}
              className="h-[58px] px-6 bg-gray-800 border border-gray-700 text-blue-400 font-bold rounded-xl hover:bg-gray-700 hover:border-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 whitespace-nowrap"
            >
              {isAnalyzing ? (
                <span className="animate-pulse flex items-center gap-2"><BrainCircuit className="h-5 w-5" /> Analyzing...</span>
              ) : (
                <><Sparkles className="h-5 w-5" /> Enhance Details</>
              )}
            </button>
          </div>

          {aiSuggestions.length > 0 && (
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

          <div>
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
            className="w-full py-4 mt-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50"
          >
            {isSubmitting ? "Generating Task..." : "Create Comprehensive Task"}
          </button>
        </form>
      </div>
    </div>
  );
}