"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Brain, Clock, Target, FileText, CheckCircle, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { navigationEvents } from "@/lib/navigation-events";
import Loader from "@/components/ui/aceternity/loader";

interface Material {
  id: string;
  filename: string;
  processing_status: string;
  created_at: string;
}

interface TestConfig {
  title: string;
  description: string;
  examType: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  timeLimit: number; // in minutes
  selectedMaterials: string[];
}

export default function GenerateTestPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [config, setConfig] = useState<TestConfig>({
    title: '',
    description: '',
    examType: '',
    difficulty: 'medium',
    questionCount: 10,
    timeLimit: 60,
    selectedMaterials: []
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedTest, setGeneratedTest] = useState<any>(null);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found, redirecting to login');
        // Redirect to login if not authenticated
        window.location.href = '/login';
        return;
      }

      // Store user ID for API calls
      setUserId(user.id);

      const { data, error } = await supabase
        .from('study_materials')
        .select('id, file_url, processing_status, created_at')
        .eq('user_id', user.id)
        .eq('processing_status', 'completed')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Error fetching materials');
        return;
      }

      // Extract filename from file_url for each material
      const materialsWithFilename = (data || []).map(m => ({
        ...m,
        filename: m.file_url?.split('/').pop() || 'Unknown'
      }));
      setMaterials(materialsWithFilename);
    } catch (error) {
      toast.error('Error loading materials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaterialToggle = (materialId: string) => {
    setConfig(prev => ({
      ...prev,
      selectedMaterials: prev.selectedMaterials.includes(materialId)
        ? prev.selectedMaterials.filter(id => id !== materialId)
        : [...prev.selectedMaterials, materialId]
    }));
  };

  const handleGenerateTest = async () => {
    if (!config.title.trim()) {
      toast.error('Please enter a test title');
      return;
    }

    if (config.selectedMaterials.length === 0) {
      toast.error('Please select at least one study material');
      return;
    }

    if (!userId) {
      toast.error('User authentication required');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 20;
      });
    }, 500);

    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          materialIds: config.selectedMaterials,
          testConfig: {
            title: config.title,
            description: config.description,
            examType: config.examType,
            difficulty: config.difficulty,
            questionCount: config.questionCount,
            timeLimit: config.timeLimit * 60 // convert to seconds
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate test');
      }

      const result = await response.json();
      
      clearInterval(progressInterval);
      setGenerationProgress(100);

      // Handle the successful response - redirect to test taking
      if (result.success && result.test_id) {
        setIsGenerating(false);
        
        // Show success message with material usage info
        if (result.metadata?.materials_used > 0) {
          toast.success(`Test generated from ${result.metadata.materials_used} materials! Redirecting to test...`);
        } else {
          toast.success(`Sample test generated! Redirecting to test...`);
        }

        // Redirect to test taking page
        setTimeout(() => {
          navigationEvents.start(`/test/${result.test_id}`);
          router.push(`/test/${result.test_id}`);
        }, 1500);
      } else {
        throw new Error('Invalid response from server');
      }

    } catch (error) {
      clearInterval(progressInterval);
      toast.error('Failed to generate test. Please try again.');
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F6F2] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-32 h-32">
            <Loader />
          </div>
          <span className="text-black font-medium">Loading materials...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F6F2]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Generate Mock Test</h1>
              <p className="text-gray-600">Create AI-powered tests from your study materials</p>
            </div>
          </div>
        </div>

        {isGenerating ? (
          // Generation Progress
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-6 w-6 mr-2 text-blue-600" />
                Generating Your Test...
              </CardTitle>
              <CardDescription>
                Our AI is analyzing your materials and creating personalized questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={generationProgress} className="w-full" />
              <div className="text-center text-sm text-gray-600">
                {generationProgress < 30 && "Analyzing study materials..."}
                {generationProgress >= 30 && generationProgress < 60 && "Generating questions..."}
                {generationProgress >= 60 && generationProgress < 90 && "Optimizing difficulty levels..."}
                {generationProgress >= 90 && generationProgress < 100 && "Finalizing test..."}
                {generationProgress === 100 && (
                  <div className="flex items-center justify-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Test generated successfully!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Test Configuration */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Test Configuration</CardTitle>
                  <CardDescription>Set up your mock test parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Test Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Banking Exam Mock Test 1"
                        value={config.title}
                        onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="examType">Exam Type</Label>
                      <Select value={config.examType} onValueChange={(value) => setConfig(prev => ({ ...prev, examType: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select exam type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Banking">Banking</SelectItem>
                          <SelectItem value="SSC">SSC</SelectItem>
                          <SelectItem value="UPSC">UPSC</SelectItem>
                          <SelectItem value="NEET">NEET</SelectItem>
                          <SelectItem value="JEE">JEE</SelectItem>
                          <SelectItem value="CAT">CAT</SelectItem>
                          <SelectItem value="GATE">GATE</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of the test focus areas..."
                      value={config.description}
                      onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="difficulty">Difficulty Level</Label>
                      <Select value={config.difficulty} onValueChange={(value: any) => setConfig(prev => ({ ...prev, difficulty: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="questionCount">Questions</Label>
                      <Select value={config.questionCount.toString()} onValueChange={(value) => setConfig(prev => ({ ...prev, questionCount: parseInt(value) }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 Questions</SelectItem>
                          <SelectItem value="10">10 Questions</SelectItem>
                          <SelectItem value="15">15 Questions</SelectItem>
                          <SelectItem value="20">20 Questions</SelectItem>
                          <SelectItem value="25">25 Questions</SelectItem>
                          <SelectItem value="30">30 Questions</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="timeLimit">Duration (mins)</Label>
                      <Select value={config.timeLimit.toString()} onValueChange={(value) => setConfig(prev => ({ ...prev, timeLimit: parseInt(value) }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                          <SelectItem value="180">3 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Study Materials Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Study Materials</CardTitle>
                  <CardDescription>Choose materials to generate questions from</CardDescription>
                </CardHeader>
                <CardContent>
                  {materials.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Study Materials Found</h3>
                      <p className="text-gray-500 mb-2">Upload PDF files to generate personalized questions</p>
                      <p className="text-sm text-gray-400 mb-4">
                        Our AI will analyze your uploaded content and create relevant questions
                      </p>
                      <div className="space-y-2">
                        <Link href="/upload">
                          <Button size="lg" className="w-full">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF Materials
                          </Button>
                        </Link>
                        <p className="text-xs text-gray-400">
                          Or generate sample questions without materials ↓
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {materials.map((material) => (
                        <div
                          key={material.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            config.selectedMaterials.includes(material.id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleMaterialToggle(material.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-4 h-4 rounded border-2 ${
                                config.selectedMaterials.includes(material.id)
                                  ? 'bg-blue-500 border-blue-500'
                                  : 'border-gray-300'
                              }`}>
                                {config.selectedMaterials.includes(material.id) && (
                                  <CheckCircle className="w-4 h-4 text-white" />
                                )}
                              </div>
                              <span className="font-medium">{material.filename}</span>
                            </div>
                            <Badge variant="secondary">Processed</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Summary & Generate */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Test Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Target className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{config.questionCount} Questions</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{config.timeLimit} minutes</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Brain className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="capitalize">{config.difficulty} Level</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <FileText className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{config.selectedMaterials.length} Materials Selected</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button 
                onClick={handleGenerateTest}
                className="w-full" 
                size="lg"
                disabled={!config.title || config.selectedMaterials.length === 0}
              >
                <Brain className="h-5 w-5 mr-2" />
                Generate Test
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}