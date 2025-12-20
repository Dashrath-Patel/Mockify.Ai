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
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-black mb-2">Profile</h1>
        <p className="text-[#555555]">Manage your account information and security</p>
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
        <Card className="rounded-2xl bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-black font-bold">Personal Information</CardTitle>
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="bg-white border-2 border-black text-black rounded-xl font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="bg-white border-2 border-black text-black rounded-xl font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 hover:from-amber-500 hover:via-orange-600 hover:to-red-600 text-white border-2 border-black rounded-xl font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 mb-8">
              <Avatar className="h-24 w-24 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-r from-violet-400 to-purple-500 text-white text-2xl font-bold">
                  {getInitials(profileData.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold text-black">{profileData.name}</h3>
                <p className="text-[#555555] font-medium">{profileData.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-black font-bold">
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
                      className="bg-white border-2 border-black text-black rounded-xl font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <User className="h-4 w-4 text-black" />
                      <span className="text-black font-medium">{profileData.name}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-black font-bold">
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
                      className="bg-white border-2 border-black text-black rounded-xl font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <Mail className="h-4 w-4 text-black" />
                      <span className="text-black font-medium">{profileData.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-black font-bold">Member Since</Label>
                <div className="flex items-center gap-2 p-3 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Calendar className="h-4 w-4 text-black" />
                  <span className="text-black font-medium">{formatDate(profileData.created_at)}</span>
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
        <Card className="rounded-2xl bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-black font-bold">Security</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-black" />
                  <div>
                    <p className="text-black font-bold">Password</p>
                    <p className="text-sm text-[#555555] font-medium">
                      Change your account password
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordDialog(true)}
                  className="bg-white border-2 border-black text-black rounded-xl font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
