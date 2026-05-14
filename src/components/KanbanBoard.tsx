"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { CheckSquare, Bug, GripVertical } from "lucide-react";

interface Task {
  id: string;
  title: string;
  status: string;
  parent_id?: string | null;
  total_subs?: number;
  completed_subs?: number;
  task_type?: string;
}

interface KanbanProps {
  initialTasks: Task[];
  onTaskClick: (taskId: string) => void;
}

const KANBAN_COLUMNS = [
  "PRE_PLANNING", 
  "BACKLOG", 
  "IN_PROGRESS", 
  "REVIEW", 
  "COMPLETED", 
  "CANCELLED"
];

export default function KanbanBoard({ initialTasks, onTaskClick }: KanbanProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  useEffect(() => {
    setIsMounted(true);
    setTasks(initialTasks);
  }, [initialTasks]);

  if (!isMounted) return null;

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    setTasks((prev) => 
      prev.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t))
    );

    if (source.droppableId !== destination.droppableId) {
      try {
        await fetch("/api/tasks/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: draggableId, status: newStatus }),
        });
      } catch (error) {
        setTasks(initialTasks); 
      }
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 xl:gap-4 overflow-x-auto pb-8 snap-x">
        {KANBAN_COLUMNS.map(column => {
          const columnTasks = tasks.filter(t => t.status === column);
          
          return (
            <div 
              key={column} 
              className="w-[280px] shrink-0 xl:flex-1 xl:w-auto xl:min-w-[150px] bg-gray-900/50 border border-gray-800 rounded-xl p-4 snap-start flex flex-col max-h-[800px]"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 truncate pr-2">
                  {column.replace("_", " ")}
                </h3>
                <span className="text-xs bg-gray-800 text-gray-500 px-2 py-1 rounded-md font-bold shrink-0">
                  {columnTasks.length}
                </span>
              </div>
              
              <Droppable droppableId={column}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`space-y-3 overflow-y-auto flex-1 pr-1 transition-colors rounded-lg min-h-[100px] ${
                      snapshot.isDraggingOver ? "bg-gray-800/50 ring-1 ring-blue-500/30" : ""
                    }`}
                  >
                    {columnTasks.length > 0 ? (
                      columnTasks.map((task, index) => {
                        const hasSubs = (task.total_subs ?? 0) > 0;
                        const isComplete = task.completed_subs === task.total_subs;

                        return (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                /* REMOVED dragHandleProps from here so the card scrolls normally! */
                                className={`p-4 bg-gray-800 border rounded-xl transition-all flex flex-col group ${
                                  snapshot.isDragging 
                                    ? "border-blue-500 shadow-2xl shadow-blue-500/20 scale-105 z-50" 
                                    : "border-gray-700 shadow-lg hover:border-blue-500/50"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  
                                  {/* --- NEW SPECIFIC DRAG HANDLE --- */}
                                  <div 
                                    {...provided.dragHandleProps} 
                                    className="text-gray-600 hover:text-gray-300 mt-0.5 cursor-grab active:cursor-grabbing touch-none p-1 -ml-2 -mt-1 rounded"
                                  >
                                    <GripVertical className="h-4 w-4" />
                                  </div>

                                  <div 
                                    className="flex-1 cursor-pointer"
                                    onClick={() => onTaskClick(task.id)}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-sm text-gray-200 font-medium group-hover:text-white transition-colors break-words">
                                        {task.title}
                                      </p>
                                      {task.task_type === "bug" && (
                                        <Bug className="h-4 w-4 text-red-500 shrink-0 mt-0.5 opacity-80" />
                                      )}
                                    </div>

                                    {hasSubs && (
                                      <div className="mt-4 pt-3 border-t border-gray-700/50 flex items-center gap-3">
                                        <div className="flex-1 h-1.5 bg-gray-900 rounded-full overflow-hidden border border-gray-950">
                                          <div 
                                            className={`h-full transition-all duration-500 ${isComplete ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`} 
                                            style={{ width: `${((task.completed_subs || 0) / (task.total_subs || 1)) * 100}%` }}
                                          />
                                        </div>
                                        <span className={`text-[10px] font-bold tracking-widest flex items-center gap-1 ${isComplete ? 'text-green-500' : 'text-gray-500'}`}>
                                          {isComplete && <CheckSquare className="h-3 w-3" />}
                                          {task.completed_subs}/{task.total_subs}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })
                    ) : (
                      <div className="p-4 border border-dashed border-gray-800 rounded-xl flex items-center justify-center">
                        <p className="text-gray-600 text-[10px] italic tracking-wide uppercase">Drop tasks here</p>
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}