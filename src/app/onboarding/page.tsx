"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { navigationEvents } from "@/lib/navigation-events";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, GraduationCap, Languages, ArrowRight, Check } from "lucide-react";

const EXAM_TYPES = [
  { value: 'UPSC', label: 'UPSC Civil Services', icon: '🏛️' },
  { value: 'JEE', label: 'JEE (Engineering)', icon: '⚙️' },
  { value: 'NEET', label: 'NEET (Medical)', icon: '🏥' },
  { value: 'Banking', label: 'Banking Exams', icon: '🏦' },
  { value: 'SSC', label: 'SSC Exams', icon: '📚' },
  { value: 'CAT', label: 'CAT (Management)', icon: '💼' },
  { value: 'GATE', label: 'GATE', icon: '🔬' },
  { value: 'Other', label: 'Other', icon: '📖' },
];

const LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Bengali', label: 'Bengali' },
  { value: 'Tamil', label: 'Tamil' },
  { value: 'Telugu', label: 'Telugu' },
  { value: 'Other', label: 'Other' },
];

const STEPS = [
  { id: 1, title: 'Welcome', description: 'Get started with MockifyAI' },
  { id: 2, title: 'Select Exam', description: 'Choose your target exam' },
  { id: 3, title: 'Preferences', description: 'Set your preferences' },
  { id: 4, title: 'Set Goals', description: 'Define your targets' },
  { id: 5, title: 'Ready!', description: 'You\'re all set' },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [targetScore, setTargetScore] = useState<string>("75");
  const [targetDate, setTargetDate] = useState<string>("");
  const [weakAreas, setWeakAreas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Check if user has already completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      // If column doesn't exist yet, ignore the error and let user complete onboarding
      if (error && error.code !== 'PGRST116') {
        console.warn('Error checking onboarding status:', error);
      }

      if (userData?.onboarding_completed === true) {
        // User has already completed onboarding, redirect to dashboard
        router.push('/dashboard');
      }
    };

    checkOnboardingStatus();
  }, [router, supabase]);

  const handleComplete = async () => {
    if (!selectedExam) {
      toast.error("Please select an exam");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Not authenticated");
        navigationEvents.start("/login");
        router.push("/login");
        return;
      }

      // Update user profile with onboarding data
      const { error } = await supabase
        .from('users')
        .update({
          exam_type: selectedExam,
          selected_exam: selectedExam,
          preferred_language: selectedLanguage,
          onboarding_completed: true,
          onboarding_goals: {
            target_score: parseInt(targetScore),
            target_date: targetDate || null,
            weak_areas: weakAreas
          }
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user profile:', error);
        toast.error("Failed to save preferences");
        return;
      }

      toast.success("Onboarding completed successfully!");
      navigationEvents.start("/dashboard");
      router.push("/dashboard");
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error("An error occurred during onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8"
          >
            <div className="flex justify-center">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="p-6 bg-black dark:bg-white rounded-2xl border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
              >
                <GraduationCap className="w-20 h-20 text-white dark:text-black" />
              </motion.div>
            </div>
            <div>
              <h2 className="text-4xl font-bold mb-4 text-black dark:text-white">
                Welcome to MockifyAI! 🎉
              </h2>
              <p className="text-[#555555] dark:text-gray-400 text-lg max-w-xl mx-auto leading-relaxed font-medium">
                Your AI-powered exam preparation companion. Let's get you set up in just a few steps.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="group cursor-pointer"
              >
                <Card className="rounded-2xl bg-white dark:bg-[#2a2a2a] border-[3px] border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,1)] transition-all duration-200 h-full">
                  <CardContent className="pt-8 pb-6 text-center h-full flex flex-col">
                    <div className="bg-white dark:bg-[#3a3a3a] border-[3px] border-black dark:border-white w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)]">
                      <BookOpen className="w-8 h-8 text-black dark:text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-black dark:text-white">Upload Materials</h3>
                    <p className="text-sm text-[#555555] dark:text-gray-400 leading-relaxed font-medium">
                      Upload your study materials and notes
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="group cursor-pointer"
              >
                <Card className="rounded-2xl bg-white dark:bg-[#2a2a2a] border-[3px] border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,1)] transition-all duration-200 h-full">
                  <CardContent className="pt-8 pb-6 text-center h-full flex flex-col">
                    <div className="bg-white dark:bg-[#3a3a3a] border-[3px] border-black dark:border-white w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)]">
                      <GraduationCap className="w-8 h-8 text-black dark:text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-black dark:text-white">AI Mock Tests</h3>
                    <p className="text-sm text-[#555555] dark:text-gray-400 leading-relaxed font-medium">
                      Generate personalized mock tests
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="group cursor-pointer"
              >
                <Card className="rounded-2xl bg-white dark:bg-[#2a2a2a] border-[3px] border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,1)] transition-all duration-200 h-full">
                  <CardContent className="pt-8 pb-6 text-center h-full flex flex-col">
                    <div className="bg-white dark:bg-[#3a3a3a] border-[3px] border-black dark:border-white w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)]">
                      <Check className="w-8 h-8 text-black dark:text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-black dark:text-white">Track Progress</h3>
                    <p className="text-sm text-[#555555] dark:text-gray-400 leading-relaxed font-medium">
                      Monitor your performance and improve
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold mb-4 text-black dark:text-white">Select Your Target Exam</h2>
              <p className="text-[#555555] dark:text-gray-400 text-lg font-medium">
                Choose the exam you're preparing for. You can change this later.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {EXAM_TYPES.map((exam, index) => (
                <motion.div
                  key={exam.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-200 rounded-2xl border-[3px] ${
                      selectedExam === exam.value
                        ? 'bg-black dark:bg-white border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]'
                        : 'bg-white dark:bg-[#2a2a2a] border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,1)]'
                    }`}
                    onClick={() => setSelectedExam(exam.value)}
                  >
                    <CardContent className="pt-8 pb-6 text-center relative">
                      <div className="text-5xl mb-4">{exam.icon}</div>
                      <h3 className={`font-bold text-base ${
                        selectedExam === exam.value
                          ? 'text-white dark:text-black'
                          : 'text-black dark:text-white'
                      }`}>{exam.label}</h3>
                      {selectedExam === exam.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className="absolute top-3 right-3 bg-white dark:bg-black border-2 border-black dark:border-white rounded-lg p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                        >
                          <Check className="w-4 h-4 text-black dark:text-white" />
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold mb-4 text-black dark:text-white">Set Your Preferences</h2>
              <p className="text-[#555555] dark:text-gray-400 text-lg font-medium">
                Customize your learning experience
              </p>
            </div>
            
            <Card className="rounded-2xl bg-white dark:bg-[#2a2a2a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl text-black dark:text-white font-bold">
                  <div className="bg-white dark:bg-[#3a3a3a] border-[3px] border-black dark:border-white p-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)]">
                    <Languages className="w-6 h-6 text-black dark:text-white" />
                  </div>
                  Preferred Language
                </CardTitle>
                <CardDescription className="text-base text-[#555555] dark:text-gray-400 font-medium">
                  Select the language for your tests and study materials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="h-12 text-base font-medium rounded-xl bg-white dark:bg-[#2a2a2a] border-[3px] border-black dark:border-white text-black dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white dark:bg-[#2a2a2a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value} className="text-base font-medium text-black dark:text-white">
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="rounded-2xl bg-black dark:bg-white border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl text-white dark:text-black font-bold">
                  <div className="bg-white dark:bg-black border-[3px] border-white dark:border-black p-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] dark:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <BookOpen className="w-6 h-6 text-black dark:text-white" />
                  </div>
                  Your Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-white dark:bg-black border-2 border-white dark:border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] dark:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                  <span className="text-black dark:text-white font-bold">Target Exam:</span>
                  <span className="font-bold text-black dark:text-white">
                    {EXAM_TYPES.find(e => e.value === selectedExam)?.label || 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white dark:bg-black border-2 border-white dark:border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] dark:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                  <span className="text-black dark:text-white font-bold">Language:</span>
                  <span className="font-bold text-black dark:text-white">{selectedLanguage}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 4:
        const WEAK_AREA_OPTIONS = selectedExam === 'UPSC' 
          ? ['History', 'Geography', 'Polity', 'Economy', 'Science', 'Current Affairs']
          : selectedExam === 'JEE' 
          ? ['Physics', 'Chemistry', 'Mathematics']
          : selectedExam === 'NEET'
          ? ['Physics', 'Chemistry', 'Biology']
          : ['Quantitative Aptitude', 'Reasoning', 'English', 'General Knowledge'];

        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold mb-4 text-black dark:text-white">Set Your Goals 🎯</h2>
              <p className="text-[#555555] dark:text-gray-400 text-lg font-medium">
                Define your targets to personalize your preparation
              </p>
            </div>

            <Card className="rounded-2xl bg-white dark:bg-[#2a2a2a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-black dark:text-white font-bold">Target Score (%)</CardTitle>
                <CardDescription className="text-base text-[#555555] dark:text-gray-400 font-medium">
                  What percentage score are you aiming for?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={targetScore}
                  onChange={(e) => setTargetScore(e.target.value)}
                  placeholder="e.g., 75"
                  className="h-12 text-base font-medium rounded-xl bg-white dark:bg-[#2a2a2a] border-[3px] border-black dark:border-white text-black dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)]"
                />
              </CardContent>
            </Card>

            <Card className="rounded-2xl bg-white dark:bg-[#2a2a2a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-black dark:text-white font-bold">Exam Date (Optional)</CardTitle>
                <CardDescription className="text-base text-[#555555] dark:text-gray-400 font-medium">
                  When is your target exam?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="h-12 text-base font-medium rounded-xl bg-white dark:bg-[#2a2a2a] border-[3px] border-black dark:border-white text-black dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)]"
                />
              </CardContent>
            </Card>

            <Card className="rounded-2xl bg-white dark:bg-[#2a2a2a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-black dark:text-white font-bold">Weak Areas (Optional)</CardTitle>
                <CardDescription className="text-base text-[#555555] dark:text-gray-400 font-medium">
                  Select topics you want to focus on
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {WEAK_AREA_OPTIONS.map((area) => (
                    <motion.div
                      key={area}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-[3px] ${
                        weakAreas.includes(area)
                          ? 'bg-black dark:bg-white border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]'
                          : 'bg-white dark:bg-[#3a3a3a] border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]'
                      }`}
                      onClick={() => {
                        setWeakAreas(prev =>
                          prev.includes(area)
                            ? prev.filter(a => a !== area)
                            : [...prev, area]
                        );
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold ${
                          weakAreas.includes(area)
                            ? 'text-white dark:text-black'
                            : 'text-black dark:text-white'
                        }`}>{area}</span>
                        {weakAreas.includes(area) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="bg-white dark:bg-black rounded-lg p-0.5"
                          >
                            <Check className="w-3 h-3 text-black dark:text-white" />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center"
            >
              <div className="p-8 bg-black dark:bg-white rounded-2xl border-[3px] border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                <Check className="w-24 h-24 text-white dark:text-black" />
              </div>
            </motion.div>
            <div>
              <h2 className="text-4xl font-bold mb-4 text-black dark:text-white">You're All Set! 🚀</h2>
              <p className="text-[#555555] dark:text-gray-400 text-lg max-w-xl mx-auto leading-relaxed font-medium">
                Your profile has been configured. Let's start your exam preparation journey!
              </p>
            </div>
            <Card className="rounded-2xl bg-white dark:bg-[#2a2a2a] border-[3px] border-black dark:border-white shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[5px_5px_0px_0px_rgba(255,255,255,1)] max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h3 className="font-bold text-xl mb-6 text-black dark:text-white">What's Next?</h3>
                <ul className="text-left space-y-5">
                  <motion.li 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-start gap-4 p-4 bg-white dark:bg-[#3a3a3a] border-[3px] border-black dark:border-white rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)]"
                  >
                    <div className="bg-black dark:bg-white border-2 border-black dark:border-white rounded-lg p-1 mt-0.5 shrink-0">
                      <Check className="w-4 h-4 text-white dark:text-black" />
                    </div>
                    <span className="text-black dark:text-white text-base font-medium">Upload your study materials to get started</span>
                  </motion.li>
                  <motion.li 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-start gap-4 p-4 bg-white dark:bg-[#3a3a3a] border-[3px] border-black dark:border-white rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)]"
                  >
                    <div className="bg-black dark:bg-white border-2 border-black dark:border-white rounded-lg p-1 mt-0.5 shrink-0">
                      <Check className="w-4 h-4 text-white dark:text-black" />
                    </div>
                    <span className="text-black dark:text-white text-base font-medium">Generate AI-powered mock tests based on your materials</span>
                  </motion.li>
                  <motion.li 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-start gap-4 p-4 bg-white dark:bg-[#3a3a3a] border-[3px] border-black dark:border-white rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)]"
                  >
                    <div className="bg-black dark:bg-white border-2 border-black dark:border-white rounded-lg p-1 mt-0.5 shrink-0">
                      <Check className="w-4 h-4 text-white dark:text-black" />
                    </div>
                    <span className="text-black dark:text-white text-base font-medium">Track your progress and identify areas for improvement</span>
                  </motion.li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6F2] dark:bg-[#0a0a0a]">
      <div className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex justify-center items-center gap-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center gap-2">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: currentStep === step.id ? 1.1 : 1,
                    }}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold transition-all duration-300 border-[3px] ${
                      currentStep >= step.id
                        ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]'
                        : 'bg-white dark:bg-[#2a2a2a] text-[#555555] dark:text-gray-400 border-black dark:border-white'
                    }`}
                  >
                    {currentStep > step.id ? <Check className="w-6 h-6" /> : step.id}
                  </motion.div>
                  <span className={`text-xs mt-1 hidden md:block transition-colors font-bold ${
                    currentStep === step.id 
                      ? 'text-black dark:text-white' 
                      : 'text-[#555555] dark:text-gray-400'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="relative w-16 h-2 mx-2 bg-white dark:bg-[#2a2a2a] border-2 border-black dark:border-white rounded-sm overflow-hidden">
                    <motion.div
                      initial={false}
                      animate={{
                        width: currentStep > step.id ? '100%' : '0%',
                      }}
                      transition={{ duration: 0.3 }}
                      className="absolute h-full bg-black dark:bg-white"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto">
          <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
            <CardContent className="p-8 md:p-12 min-h-[550px] flex flex-col">
              <div className="flex-1">
                {renderStepContent()}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-12 pt-8 border-t-[3px] border-black dark:border-white">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  disabled={currentStep === 1 || isLoading}
                  className="h-12 px-6 text-base font-bold rounded-xl bg-white dark:bg-[#2a2a2a] border-[3px] border-black dark:border-white text-black dark:text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.8)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </Button>

                {currentStep < 5 ? (
                  <Button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={currentStep === 2 && !selectedExam}
                    className="h-12 px-8 text-base font-bold rounded-xl bg-black dark:bg-white text-white dark:text-black border-[3px] border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50"
                  >
                    Next
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleComplete}
                    disabled={isLoading}
                    className="h-12 px-8 text-base font-bold rounded-xl bg-black dark:bg-white text-white dark:text-black border-[3px] border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all min-w-[200px]"
                  >
                    {isLoading ? "Setting up..." : "Go to Dashboard"}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
