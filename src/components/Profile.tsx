"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Label } from "./ui/label";
import { User, Mail, Calendar, Edit2, Save, Lock, Eye, EyeOff, X } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import Loader from "@/components/ui/aceternity/loader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  created_at: string;
  exam_type?: string | null;
  language?: string | null;
}

export function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [editedData, setEditedData] = useState<UserProfile | null>(null);
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error("Failed to fetch user data");
        return;
      }

      // Get user profile from users table
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        
        // If user doesn't exist in database (PGRST116 = no rows returned)
        if (profileError.code === 'PGRST116') {
          toast.error("Profile not found. Creating profile...");
          
          // Create profile for this user
          const userName = user.user_metadata?.full_name || 
                          user.user_metadata?.name || 
                          user.email?.split('@')[0] || 'User';

          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email || '',
              name: userName,
              onboarding_completed: false,
              created_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error('Error creating profile:', insertError);
            toast.error('Failed to create profile. Please contact support.');
            return;
          }

          // Redirect to onboarding
          toast.success('Profile created! Please complete your setup.');
          window.location.href = '/onboarding';
          return;
        }
        
        toast.error("Failed to load profile");
        return;
      }

      setProfileData(profile);
      setEditedData(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedData || !profileData) return;

    // Check if anything changed
    if (
      editedData.name === profileData.name &&
      editedData.email === profileData.email
    ) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);

    try {
      // Update user profile in users table
      const { error: updateError } = await supabase
        .from("users")
        .update({
          name: editedData.name,
          email: editedData.email,
        })
        .eq("id", editedData.id);

      if (updateError) {
        toast.error("Failed to update profile");
        console.error(updateError);
        return;
      }

      // If email changed, update in auth as well
      if (editedData.email !== profileData.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: editedData.email,
        });

        if (emailError) {
          toast.error("Profile updated but email change requires verification");
          console.error(emailError);
        } else {
          toast.success("Profile updated! Please verify your new email.");
        }
      } else {
        toast.success("Profile updated successfully!");
      }

      setProfileData(editedData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedData(profileData);
    setIsEditing(false);
  };

  const handlePasswordChange = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);

    try {
      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profileData?.email || "",
        password: currentPassword,
      });

      if (signInError) {
        toast.error("Current password is incorrect");
        setIsChangingPassword(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast.error("Failed to update password");
        console.error(updateError);
        return;
      }

      toast.success("Password updated successfully!");
      setShowPasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-32 h-32">
          <Loader />
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-black font-medium">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-black dark:text-white mb-1 sm:mb-2">Profile</h1>
        <p className="text-sm sm:text-base text-[#555555] dark:text-gray-400">Manage your account information and security</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="group cursor-pointer"
        whileHover={{ 
          y: -4,
          transition: { duration: 0.2 }
        }}
      >
        <Card className="rounded-xl sm:rounded-2xl bg-white dark:bg-[#1a1a1a] border-2 sm:border-[3px] border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] sm:dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
          <CardHeader className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
              <CardTitle className="text-black dark:text-white font-bold text-sm sm:text-base">Personal Information</CardTitle>
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="bg-white dark:bg-[#2a2a2a] border-2 border-black dark:border-white text-black dark:text-white rounded-lg sm:rounded-xl font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                  >
                    <Edit2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="bg-white dark:bg-[#2a2a2a] border-2 border-black dark:border-white text-black dark:text-white rounded-lg sm:rounded-xl font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 hover:from-amber-500 hover:via-orange-600 hover:to-red-600 text-white border-2 border-black rounded-lg sm:rounded-xl font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                    >
                      <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Avatar className="h-16 w-16 sm:h-24 sm:w-24 border-2 sm:border-[3px] border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-r from-violet-400 to-purple-500 text-white text-lg sm:text-2xl font-bold">
                  {getInitials(profileData.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white">{profileData.name}</h3>
                <p className="text-sm sm:text-base text-[#555555] dark:text-gray-400 font-medium">{profileData.email}</p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="name" className="text-black dark:text-white font-bold text-xs sm:text-sm">
                    Full Name
                  </Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={editedData?.name || ""}
                      onChange={(e) =>
                        setEditedData(
                          editedData ? { ...editedData, name: e.target.value } : null
                        )
                      }
                      className="bg-white dark:bg-[#2a2a2a] border-2 border-black dark:border-white text-black dark:text-white rounded-lg sm:rounded-xl font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-white dark:bg-[#2a2a2a] rounded-lg sm:rounded-xl border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-black dark:text-white" />
                      <span className="text-black dark:text-white font-medium text-sm">{profileData.name}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="email" className="text-black dark:text-white font-bold text-xs sm:text-sm">
                    Email Address
                  </Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={editedData?.email || ""}
                      onChange={(e) =>
                        setEditedData(
                          editedData ? { ...editedData, email: e.target.value } : null
                        )
                      }
                      className="bg-white dark:bg-[#2a2a2a] border-2 border-black dark:border-white text-black dark:text-white rounded-lg sm:rounded-xl font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-white dark:bg-[#2a2a2a] rounded-lg sm:rounded-xl border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-black dark:text-white" />
                      <span className="text-black dark:text-white font-medium text-sm">{profileData.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-black dark:text-white font-bold text-xs sm:text-sm">Member Since</Label>
                <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-white dark:bg-[#2a2a2a] rounded-lg sm:rounded-xl border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-black dark:text-white" />
                  <span className="text-black dark:text-white font-medium text-sm">{formatDate(profileData.created_at)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="group cursor-pointer"
        whileHover={{ 
          y: -4,
          transition: { duration: 0.2 }
        }}
      >
        <Card className="rounded-xl sm:rounded-2xl bg-white dark:bg-[#1a1a1a] border-2 sm:border-[3px] border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] sm:dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-black dark:text-white font-bold text-sm sm:text-base">Security</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-white dark:bg-[#2a2a2a] rounded-lg sm:rounded-xl border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-black dark:text-white" />
                  <div>
                    <p className="text-black dark:text-white font-bold text-sm">Password</p>
                    <p className="text-xs sm:text-sm text-[#555555] dark:text-gray-400 font-medium">
                      Change your account password
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordDialog(true)}
                  className="bg-white dark:bg-[#2a2a2a] border-2 border-black dark:border-white text-black dark:text-white rounded-lg sm:rounded-xl font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs sm:text-sm h-8 sm:h-9 w-full sm:w-auto"
                >
                  Change Password
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Password Change Dialog */}
      <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <AlertDialogContent className="bg-white border-[3px] border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black font-bold">Change Password</AlertDialogTitle>
            <AlertDialogDescription className="text-[#555555] font-medium">
              Enter your current password and choose a new one.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-black font-bold">
                Current Password
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-white border-2 border-black text-black rounded-xl font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] pr-10"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-black font-bold">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-white border-2 border-black text-black rounded-xl font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] pr-10"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-black font-bold">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white border-2 border-black text-black rounded-xl font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] pr-10"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white border-2 border-black text-black rounded-xl font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePasswordChange}
              disabled={isChangingPassword}
              className="bg-[#6EE7B7] text-black border-2 border-black rounded-xl font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              {isChangingPassword ? "Changing..." : "Change Password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
