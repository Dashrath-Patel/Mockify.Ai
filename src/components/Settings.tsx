"use client";

import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Bell, Globe, Trash2, Settings as SettingsIcon } from 'lucide-react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';

export function Settings() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    testReminders: true,
    weeklyReport: false
  });
  const [language, setLanguage] = useState('english');

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-violet-500" />
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-base">Customize your app preferences and account settings</p>
      </motion.div>

      {/* Notifications */}
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
        <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-black dark:text-white flex items-center gap-2 font-bold">
              <Bell className="h-5 w-5 text-black dark:text-white" />
              Notifications
            </CardTitle>
          </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notif" className="text-black dark:text-white font-bold">Email Notifications</Label>
                  <p className="text-sm text-[#555555] dark:text-gray-400 font-medium">Receive updates via email</p>
                </div>
                <Switch
                  id="email-notif"
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                />
              </div>

              <Separator className="bg-gray-200 dark:bg-slate-800" />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notif" className="text-gray-900 dark:text-white font-semibold">Push Notifications</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Get instant updates on your device</p>
                </div>
                <Switch
                  id="push-notif"
                  checked={notifications.push}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                />
              </div>

              <Separator className="bg-gray-200 dark:bg-slate-800" />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="test-reminders" className="text-gray-900 dark:text-white font-semibold">Test Reminders</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Daily reminders to take tests</p>
                </div>
                <Switch
                  id="test-reminders"
                  checked={notifications.testReminders}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, testReminders: checked })}
                />
              </div>

              <Separator className="bg-gray-200 dark:bg-slate-800" />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weekly-report" className="text-gray-900 dark:text-white font-semibold">Weekly Performance Report</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Get weekly progress summary</p>
                </div>
                <Switch
                  id="weekly-report"
                  checked={notifications.weeklyReport}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReport: checked })}
                />
              </div>
            </CardContent>
          </Card>
      </motion.div>

      {/* Language & Region */}
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
        <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-black dark:text-white flex items-center gap-2 font-bold">
              <Globe className="h-5 w-5 text-black dark:text-white" />
              Language & Region
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language" className="text-black dark:text-white font-bold">Preferred Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="rounded-xl bg-white dark:bg-[#2a2a2a] border-2 border-black dark:border-white text-black dark:text-white font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
                  <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#2a2a2a] border-2 border-black dark:border-white rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                    <SelectItem value="english" className="font-medium">English</SelectItem>
                    <SelectItem value="hindi" className="font-medium">हिंदी (Hindi)</SelectItem>
                    <SelectItem value="bengali" className="font-medium">বাংলা (Bengali)</SelectItem>
                    <SelectItem value="tamil" className="font-medium">தமிழ் (Tamil)</SelectItem>
                    <SelectItem value="telugu" className="font-medium">తెలుగు (Telugu)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-[#555555] dark:text-gray-400 font-medium">Choose your preferred language for the interface</p>
              </div>
            </CardContent>
          </Card>
      </motion.div>

      {/* Data & Privacy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="group cursor-pointer"
        whileHover={{ 
          y: -4,
          transition: { duration: 0.2 }
        }}
      >
        <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-black dark:text-white flex items-center gap-2 font-bold">
              <SettingsIcon className="h-5 w-5 text-black dark:text-white" />
              Data & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-400/20 via-orange-400/20 to-red-400/20 dark:from-amber-500/20 dark:via-orange-500/20 dark:to-red-500/20 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
              <p className="text-sm text-black dark:text-white font-medium">
                Your data is securely stored and never shared with third parties. 
                You can export or delete your data at any time.
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button className="px-4 py-2 rounded-xl bg-white dark:bg-[#2a2a2a] text-black dark:text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] font-bold">
                Export My Data
              </button>
              <button className="px-4 py-2 rounded-xl bg-white dark:bg-[#2a2a2a] text-black dark:text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] font-bold">
                Download Test History
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="group cursor-pointer"
        whileHover={{ 
          y: -4,
          transition: { duration: 0.2 }
        }}
      >
        <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-red-600 dark:border-red-400 shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] dark:shadow-[4px_4px_0px_0px_rgba(248,113,113,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(220,38,38,1)] dark:group-hover:shadow-[6px_6px_0px_0px_rgba(248,113,113,1)] transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2 font-bold">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-100 dark:bg-red-600/10 p-4 rounded-xl border-2 border-red-600 dark:border-red-400 shadow-[2px_2px_0px_0px_rgba(220,38,38,1)] dark:shadow-[2px_2px_0px_0px_rgba(248,113,113,0.3)]">
              <p className="text-sm text-red-900 dark:text-white mb-1 font-bold">Delete Account</p>
              <p className="text-sm text-red-800 dark:text-gray-300 mb-4 font-medium">
                Once you delete your account, there is no going back. All your data, including test history and progress, will be permanently deleted.
              </p>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="bg-red-600 text-white border-2 border-black dark:border-white rounded-xl font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
                    Delete My Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-black dark:text-white font-bold">Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-black dark:text-gray-300 font-medium">
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our servers including:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>All test history and scores</li>
                        <li>Uploaded study materials</li>
                        <li>Progress tracking data</li>
                        <li>Community posts and interactions</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl bg-white dark:bg-[#2a2a2a] border-2 border-black dark:border-white text-black dark:text-white font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction className="bg-red-600 text-white border-2 border-black dark:border-white rounded-xl font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
                      Yes, Delete My Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
