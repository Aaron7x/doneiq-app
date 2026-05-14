"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, CheckSquare, MessageSquare, BrainCircuit, CornerDownRight, Send, Edit2, AlertTriangle, Flag, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface TaskDetailPaneProps {
  taskId: string | null;
  projectId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function TaskDetailPane({ taskId, projectId, onClose, onUpdate }: TaskDetailPaneProps) {
  const [task, setTask] = useState<any>(null);
  const [subTasks, setSubTasks] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  
  const [newComment, setNewComment] = useState("");
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // --- Inline Editing State --- //
  const [isEditingMain, setIsEditingMain] = useState(false);
  const [mainTitleEdit, setMainTitleEdit] = useState("");
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [subTitleEdit, setSubTitleEdit] = useState("");
  
  // Description Editing State
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descEdit, setDescEdit] = useState("");

  const [commentError, setCommentError] = useState<string | null>(null);
  
  // Deletion Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Hardcoded current user for the prototype
  const currentUser = "@aaron";

  const fetchTaskDetails = useCallback(async () => {
    if (!taskId) return;
    setIsLoading(true);

    try {
      const { data: taskData } = await supabase.from("tasks").select("*").eq("id", taskId).single();
      const { data: subData } = await supabase.from("tasks").select("*").eq("parent_id", taskId).order("created_at", { ascending: true });
      const { data: commentData } = await supabase.from("comments").select("*").eq("task_id", taskId).order("created_at", { ascending: true });

      if (taskData) {
        setTask(taskData);
        setMainTitleEdit(taskData.title);
        setDescEdit(taskData.description || "");
      }
      if (subData) setSubTasks(subData);
      if (commentData) setComments(commentData);
    } catch (err) {
      console.error("Error fetching task details:", err);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTaskDetails();
    setCommentError(null);
    setIsEditingDesc(false);
    setShowDeleteConfirm(false);
  }, [fetchTaskDetails]);

  // --- Deletion Actions --- //

  const handleDeleteMainTask = async () => {
    if (!taskId) return;
    try {
      await fetch("/api/tasks/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId }),
      });
      onUpdate();
      onClose(); // Close the pane once vaporized
    } catch (error) { console.error("Error deleting main task", error); }
  };

  const handleDeleteSubTask = async (subId: string) => {
    // 1. Optimistic UI Removal
    setSubTasks(prev => prev.filter(sub => sub.id !== subId));
    
    // 2. Background Deletion
    try {
      await fetch("/api/tasks/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: subId }),
      });
      onUpdate(); // Updates parent's progress bar
    } catch (error) { console.error("Error deleting subtask", error); }
  };

  // --- Actions --- //

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !taskId) return;
    
    setCommentError(null); 

    try {
      const { error } = await supabase.from("comments").insert({
        task_id: taskId,
        user_handle: currentUser,
        content: newComment
      });

      if (error) {
        setCommentError(`Database Error: ${error.message}`);
        return;
      }

      setNewComment("");
      fetchTaskDetails();
    } catch (error: any) {
      setCommentError(error.message || "An unexpected error occurred");
    }
  };

  const handleAddSubTask = async (e?: React.FormEvent, titleOverride?: string) => {
    if (e) e.preventDefault();
    const titleToUse = titleOverride || newSubTaskTitle;
    if (!titleToUse.trim() || !taskId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from("tasks").insert({
        title: titleToUse,
        project_id: projectId,
        parent_id: taskId,
        status: "BACKLOG",
        user_id: user?.id 
      });
      
      setNewSubTaskTitle("");
      fetchTaskDetails();
      onUpdate(); 
    } catch (error) {
      console.error("Subtask error:", error);
    }
  };

  // --- API Routed Edits (OPTIMISTIC UI) --- //

  const updateTaskStatus = async (newStatus: string) => {
    if (!taskId) return;
    setTask((prev: any) => ({ ...prev, status: newStatus }));
    try {
      await fetch("/api/tasks/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
      onUpdate();
    } catch (error) { console.error("Status update error", error); }
  };

  const updateTaskPriority = async (newPriority: string) => {
    if (!taskId) return;
    setTask((prev: any) => ({ ...prev, priority: newPriority }));
    try {
      await fetch("/api/tasks/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, priority: newPriority }),
      });
      onUpdate();
    } catch (error) { console.error("Priority update error", error); }
  };

  const updateSubTaskStatus = async (subId: string, newStatus: string) => {
    setSubTasks(prev => prev.map(sub => sub.id === subId ? { ...sub, status: newStatus } : sub));
    try {
      await fetch("/api/tasks/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: subId, status: newStatus }),
      });
      onUpdate(); 
    } catch (error) { console.error("Subtask status error", error); }
  };

  const saveMainTitle = async () => {
    if (!taskId || !mainTitleEdit.trim() || mainTitleEdit === task.title) {
      setIsEditingMain(false);
      return;
    }
    setTask((prev: any) => ({ ...prev, title: mainTitleEdit }));
    setIsEditingMain(false);
    try {
      await fetch("/api/tasks/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, title: mainTitleEdit }),
      });
      onUpdate();
    } catch (error) { console.error("Update title error", error); }
  };

  const saveSubTitle = async (subId: string) => {
    if (!subTitleEdit.trim()) {
      setEditingSubId(null);
      return;
    }
    setSubTasks(prev => prev.map(sub => sub.id === subId ? { ...sub, title: subTitleEdit } : sub));
    setEditingSubId(null);
    try {
      await fetch("/api/tasks/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: subId, title: subTitleEdit }),
      });
    } catch (error) { console.error("Update sub title error", error); }
  };

  const saveDescription = async () => {
    if (!taskId) return;
    setTask((prev: any) => ({ ...prev, description: descEdit }));
    setIsEditingDesc(false);
    try {
      await fetch("/api/tasks/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, description: descEdit }),
      });
    } catch (error) { console.error("Update desc error", error); }
  };

  const handleAIBreakdown = async () => {
    if (!task) return;
    setIsAiThinking(true);
    try {
      setTimeout(async () => {
        const mockGeneratedTasks = [
          "Define specific criteria for this task",
          "Identify and resolve technical dependencies",
          "Draft initial implementation",
          "Request code review"
        ];
        for (const title of mockGeneratedTasks) {
          await handleAddSubTask(undefined, title);
        }
        setIsAiThinking(false);
      }, 2000);
    } catch (error) {
      console.error("AI Error:", error);
      setIsAiThinking(false);
    }
  };

  if (!taskId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/80 transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        
        {isLoading && !task ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 uppercase tracking-widest text-xs animate-pulse p-20">Loading Nodes...</div>
        ) : task ? (
          <>
            <div className="p-6 md:p-8 border-b border-gray-800 flex justify-between items-start bg-gray-950 rounded-t-2xl">
              <div className="w-full mr-8">
                {isEditingMain ? (
                  <input 
                    autoFocus
                    className="w-full text-2xl font-extrabold bg-gray-800 border border-blue-500 text-white rounded-lg p-2 focus:outline-none"
                    value={mainTitleEdit}
                    onChange={(e) => setMainTitleEdit(e.target.value)}
                    onBlur={saveMainTitle}
                    onKeyDown={(e) => e.key === 'Enter' && saveMainTitle()}
                  />
                ) : (
                  <h2 
                    onClick={() => setIsEditingMain(true)}
                    className="text-2xl font-extrabold text-white tracking-tight leading-tight cursor-pointer hover:text-blue-400 transition-colors flex items-center gap-2 group"
                  >
                    {task.title}
                    <Edit2 className="h-4 w-4 text-gray-600 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h2>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={() => setShowDeleteConfirm(true)} 
                  className="text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-colors bg-gray-900 p-2 rounded-lg border border-gray-800 shrink-0"
                  title="Delete Task"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors bg-gray-900 p-2 rounded-lg border border-gray-800 shrink-0">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Deletion Confirmation Banner */}
            {showDeleteConfirm && (
              <div className="p-4 bg-red-500/10 border-b border-red-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                  <AlertTriangle className="h-5 w-5" /> 
                  Are you sure you want to permanently delete this task?
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-700 text-xs transition-colors">Cancel</button>
                  <button onClick={handleDeleteMainTask} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 text-xs transition-colors shadow-[0_0_10px_rgba(220,38,38,0.4)]">Delete Task</button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
              
              <section className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Status</span>
                  <select 
                    className="bg-transparent border-none text-xs font-bold uppercase tracking-widest text-blue-500 focus:outline-none cursor-pointer"
                    value={task.status}
                    onChange={(e) => updateTaskStatus(e.target.value)}
                  >
                    <option value="PRE_PLANNING" className="bg-gray-900">Pre-Planning</option>
                    <option value="BACKLOG" className="bg-gray-900">Backlog</option>
                    <option value="IN_PROGRESS" className="bg-gray-900">In Progress</option>
                    <option value="REVIEW" className="bg-gray-900">Review</option>
                    <option value="COMPLETED" className="bg-gray-900 text-green-500">Completed</option>
                    <option value="CANCELLED" className="bg-gray-900 text-red-500">Cancelled</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2">
                  <Flag className="h-3 w-3 text-gray-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Priority</span>
                  <select 
                    className={`bg-transparent border-none text-xs font-bold uppercase tracking-widest focus:outline-none cursor-pointer ${
                      task.priority === 'High' ? 'text-red-500' : 
                      task.priority === 'Low' ? 'text-gray-400' : 'text-yellow-500'
                    }`}
                    value={task.priority || "Medium"}
                    onChange={(e) => updateTaskPriority(e.target.value)}
                  >
                    <option value="High" className="bg-gray-900 text-red-500">High</option>
                    <option value="Medium" className="bg-gray-900 text-yellow-500">Medium</option>
                    <option value="Low" className="bg-gray-900 text-gray-400">Low</option>
                  </select>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Description</h3>
                  {!isEditingDesc && (
                    <button 
                      onClick={() => setIsEditingDesc(true)}
                      className="text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="h-3 w-3" /> Edit Details
                    </button>
                  )}
                </div>

                {isEditingDesc ? (
                  <div className="space-y-3 animate-in fade-in">
                    <textarea
                      autoFocus
                      className="w-full bg-gray-950 border border-blue-500 text-sm text-white p-4 rounded-xl focus:outline-none min-h-[120px] shadow-inner"
                      value={descEdit}
                      onChange={(e) => setDescEdit(e.target.value)}
                      placeholder="Add task details, acceptance criteria, or notes here..."
                    />
                    <div className="flex gap-3">
                      <button onClick={saveDescription} className="px-5 py-2 bg-blue-600 text-white text-xs font-bold uppercase tracking-wide rounded-lg hover:bg-blue-700 transition-colors">Save Details</button>
                      <button onClick={() => { setIsEditingDesc(false); setDescEdit(task.description || ""); }} className="px-5 py-2 bg-gray-800 text-gray-300 text-xs font-bold uppercase tracking-wide rounded-lg hover:bg-gray-700 transition-colors border border-gray-700">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => setIsEditingDesc(true)}
                    className="bg-gray-800/50 p-5 rounded-xl border border-gray-700/50 cursor-text hover:border-gray-600 transition-colors group"
                  >
                    {task.description ? (
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{task.description}</p>
                    ) : (
                      <p className="text-gray-500 text-sm italic group-hover:text-gray-400 transition-colors">No description provided. Click here to add details...</p>
                    )}
                  </div>
                )}
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" /> Sub-Tasks ({subTasks.length})
                  </h3>
                  <button 
                    onClick={handleAIBreakdown}
                    disabled={isAiThinking}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                  >
                    {isAiThinking ? <span className="animate-pulse">Thinking...</span> : <><BrainCircuit className="h-3 w-3" /> Breakdown Task</>}
                  </button>
                </div>
                
                <div className="space-y-2 mb-4">
                  {subTasks.map(sub => (
                    <div key={sub.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700 group hover:border-gray-600 transition-colors">
                      <CornerDownRight className="h-4 w-4 text-gray-500 shrink-0" />
                      
                      {editingSubId === sub.id ? (
                        <input
                          autoFocus
                          className="flex-1 bg-gray-900 border border-blue-500 text-sm text-white p-1.5 rounded focus:outline-none"
                          value={subTitleEdit}
                          onChange={(e) => setSubTitleEdit(e.target.value)}
                          onBlur={() => saveSubTitle(sub.id)}
                          onKeyDown={(e) => e.key === 'Enter' && saveSubTitle(sub.id)}
                        />
                      ) : (
                        <span 
                          onClick={() => {
                            setEditingSubId(sub.id);
                            setSubTitleEdit(sub.title);
                          }}
                          className={`flex-1 text-sm cursor-pointer ${sub.status === 'COMPLETED' ? 'text-gray-500 line-through' : 'text-gray-200 hover:text-blue-400'}`}
                        >
                          {sub.title}
                        </span>
                      )}

                      <select
                        className="bg-gray-900 border border-gray-700 text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2 py-1.5 rounded-md focus:outline-none focus:border-blue-500 cursor-pointer shrink-0"
                        value={sub.status}
                        onChange={(e) => updateSubTaskStatus(sub.id, e.target.value)}
                      >
                        <option value="BACKLOG">Backlog</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="REVIEW">Review</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                      
                      <button 
                        onClick={() => handleDeleteSubTask(sub.id)}
                        className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100 shrink-0"
                        title="Delete Subtask"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={(e) => handleAddSubTask(e)} className="flex gap-2">
                  <input
                    type="text"
                    value={newSubTaskTitle}
                    onChange={(e) => setNewSubTaskTitle(e.target.value)}
                    placeholder="Add a manual sub-task..."
                    className="flex-1 bg-gray-950 border border-gray-800 p-3 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600"
                  />
                  <button type="submit" disabled={!newSubTaskTitle.trim()} className="px-5 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-700 transition disabled:opacity-50 border border-gray-700">Add</button>
                </form>
              </section>

              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2 mb-4 pt-4 border-t border-gray-800">
                  <MessageSquare className="h-4 w-4" /> Team Collaboration
                </h3>
                
                <div className="space-y-4 mb-4">
                  {comments.length > 0 ? comments.map(comment => (
                    <div key={comment.id} className="bg-gray-800/80 p-4 rounded-xl border border-gray-700">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-blue-400">{comment.user_handle}</span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString()} {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{comment.content}</p>
                    </div>
                  )) : (
                    <p className="text-xs text-gray-600 italic text-center py-4 uppercase tracking-widest">No comments yet</p>
                  )}
                </div>

                {commentError && (
                  <div className="mb-3 p-3 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-500 text-xs font-bold animate-in fade-in">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {commentError}
                  </div>
                )}

                <form onSubmit={handleAddComment} className="relative">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type @ to tag a team member..."
                    className="w-full bg-gray-950 border border-gray-800 p-4 pr-14 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600 shadow-inner"
                  />
                  <button type="submit" disabled={!newComment.trim()} className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-[0_0_10px_rgba(37,99,235,0.3)] disabled:opacity-50 flex items-center justify-center">
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </section>

            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}