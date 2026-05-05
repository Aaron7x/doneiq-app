"use client";

import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  User, MapPin, Bell, Mail, Shield, Camera, Trophy, Medal, Save, Loader2, AlertTriangle 
} from "lucide-react";

export default function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile State
  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState("Software Developer");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Notifications State
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);

  // UI State
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: "success" | "error" | "warning" } | null>(null);

  // Gamification Mock Data
  const currentPoints = 12450;
  const rankMessage = "You are currently ranked 1st amongst your peers.";

  const showNotification = (msg: string, type: "success" | "error" | "warning") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000); 
  };

  // Fetch profile data with Guaranteed Dev Mode fallback
  useEffect(() => {
    async function loadProfile() {
      try {
        let currentId = null;
        
        // 1. Try standard Supabase Auth first
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          currentId = user.id;
          setEmail(user.email || "");
        } else {
          // 2. GUARANTEED FALLBACK: Assign a hardcoded ID for UI prototyping
          currentId = "dev-prototype-user";
          showNotification("Dev Mode Active: Bypassing strict authentication for prototyping.", "warning");
        }
        
        setUserId(currentId);

        // Fetch the profile data for this ID
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentId)
          .maybeSingle();

        if (profileError) {
          console.error("Profile Fetch Error:", profileError);
        }

        if (data) {
          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
          setLocation(data.location || "");
          setRole(data.role || "Software Developer");
          setAvatarUrl(data.avatar_url || null);
          setPushEnabled(data.push_enabled ?? true);
          setEmailEnabled(data.email_enabled ?? false);
          
          // Only overwrite the email if we have one saved in the profile table
          if (data.email) setEmail(data.email);
        }
      } catch (err) {
        console.error("Unexpected error loading profile:", err);
      } finally {
        setIsPageLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!userId) return;
      
      setIsUploading(true);
      setNotification(null);
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}-avatar.${fileExt}`; 

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Fetch public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);

      // Save to database
      await supabase.from("profiles").upsert({ 
        id: userId, 
        avatar_url: publicUrl 
      });

      showNotification("Profile picture updated! 👍", "success");

    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      showNotification(error.message || "Error uploading image.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) return;
    
    setIsSaving(true);
    setNotification(null);
    
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        email: email, // Now saving the email directly to the profile
        location,
        role,
        push_enabled: pushEnabled,
        email_enabled: emailEnabled,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      
      showNotification("Profile successfully saved! 👍", "success");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      showNotification(error.message || "Failed to save profile updates.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="flex-1 bg-gray-900 min-h-screen flex flex-col items-center justify-center text-gray-500">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest">Loading Intelligence Profile...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-900 min-h-screen text-gray-100">
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
        
        <div className="flex items-center gap-4 border-b border-gray-800 pb-6">
          <User className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Account Profile</h1>
        </div>

        {/* Error / Success Notification Banner */}
        {notification && (
          <div className={`rounded-xl p-4 text-sm font-bold tracking-wide animate-in fade-in slide-in-from-top-2 border flex items-center gap-3 ${
            notification.type === "success" 
              ? "bg-green-500/10 border-green-500/50 text-green-400" 
              : notification.type === "warning"
              ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-500"
              : "bg-red-500/10 border-red-500/50 text-red-400"
          }`}>
            {notification.type === "error" && <AlertTriangle className="h-5 w-5 shrink-0" />}
            {notification.msg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="space-y-6">
            <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xl">
              <div 
                onClick={handleAvatarClick}
                className="relative h-32 w-32 rounded-full bg-gray-800 border-4 border-gray-900 shadow-[0_0_15px_rgba(37,99,235,0.2)] flex items-center justify-center group cursor-pointer overflow-hidden mb-4 transition-all hover:border-blue-500"
              >
                {isUploading ? (
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                ) : avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-gray-600 group-hover:opacity-0 transition-opacity">
                    {firstName ? firstName.charAt(0) : "U"}{lastName ? lastName.charAt(0) : ""}
                  </span>
                )}
                
                {!isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-6 w-6 text-white mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">Update</span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarChange} 
                  accept="image/*" 
                  className="hidden" 
                  disabled={isUploading}
                />
              </div>
              <h2 className="text-xl font-bold text-white">{firstName || "User"} {lastName}</h2>
              <p className="text-sm text-blue-400 font-medium">@{firstName.toLowerCase() || "user"}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">{role}</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-5">
                <Trophy className="h-32 w-32" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                <Medal className="h-4 w-4 text-yellow-500" /> Leaderboard Status
              </h3>
              <div className="mb-4">
                <p className="text-4xl font-extrabold text-white tracking-tighter">
                  {currentPoints.toLocaleString()} <span className="text-sm text-gray-500 font-medium tracking-normal">pts</span>
                </p>
              </div>
              <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-xl">
                <p className="text-xs font-bold text-blue-400 leading-relaxed">
                  {rankMessage}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2 border-b border-gray-800 pb-4">
                <User className="h-4 w-4 text-blue-500" /> Personal Details
              </h3>
              
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2 tracking-widest">First Name</label>
                    <input 
                      type="text" 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)} 
                      disabled={!userId}
                      className="w-full bg-gray-950 border border-gray-800 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2 tracking-widest">Last Name</label>
                    <input 
                      type="text" 
                      value={lastName} 
                      onChange={(e) => setLastName(e.target.value)} 
                      disabled={!userId}
                      className="w-full bg-gray-950 border border-gray-800 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2 tracking-widest">Email Address</label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full bg-gray-950 border border-gray-800 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2 tracking-widest">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
                      <input 
                        type="text" 
                        value={location} 
                        onChange={(e) => setLocation(e.target.value)} 
                        disabled={!userId}
                        placeholder="City, State"
                        className="w-full bg-gray-950 border border-gray-800 p-3 pl-10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-6 mt-6">
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2 tracking-widest">Update Password</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      disabled={!userId}
                      className="w-full md:w-1/2 bg-gray-950 border border-gray-800 p-3 pl-10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    type="submit" 
                    disabled={isSaving || !userId}
                    className="px-6 py-3 bg-blue-600 text-white text-xs font-bold uppercase tracking-wide rounded-xl hover:bg-blue-700 transition shadow-[0_0_15px_rgba(37,99,235,0.3)] flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isSaving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2 border-b border-gray-800 pb-4">
                <Bell className="h-4 w-4 text-blue-500" /> Notification Settings
              </h3>
              
              <div className="space-y-6">
                <div className={`flex items-center justify-between p-4 bg-gray-950 border border-gray-800 rounded-xl transition-colors ${!userId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-700'}`} onClick={() => userId && setPushEnabled(!pushEnabled)}>
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${pushEnabled ? 'bg-blue-600/20 text-blue-500' : 'bg-gray-800 text-gray-500'}`}>
                      <Bell className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Push Notifications</p>
                      <p className="text-xs text-gray-500">Receive alerts directly on your device when tagged.</p>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-colors relative ${pushEnabled ? 'bg-blue-600' : 'bg-gray-700'}`}>
                    <div className={`absolute top-1 bottom-1 w-4 bg-white rounded-full transition-transform ${pushEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                  </div>
                </div>

                <div className={`flex items-center justify-between p-4 bg-gray-950 border border-gray-800 rounded-xl transition-colors ${!userId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-700'}`} onClick={() => userId && setEmailEnabled(!emailEnabled)}>
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${emailEnabled ? 'bg-blue-600/20 text-blue-500' : 'bg-gray-800 text-gray-500'}`}>
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Email Digest</p>
                      <p className="text-xs text-gray-500">Receive a daily summary of task updates and mentions.</p>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-colors relative ${emailEnabled ? 'bg-blue-600' : 'bg-gray-700'}`}>
                    <div className={`absolute top-1 bottom-1 w-4 bg-white rounded-full transition-transform ${emailEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}