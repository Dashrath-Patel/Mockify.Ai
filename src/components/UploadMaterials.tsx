import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Upload, FileText, Trash2, Eye, Search, Sparkles, X, CloudUpload, Brain, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

interface Material {
  id: string;
  name: string;
  topic: string;
  type: string;
  date: string;
  file_url?: string;
}

interface UserPreferences {
  exam_type: string | null;
  selected_exam: string | null;
  preferred_language: string | null;
  onboarding_goals: {
    weak_areas?: string[];
    focus_topics?: string[];
  };
  onboarding_completed: boolean;
}

export function UploadMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [materialType, setMaterialType] = useState<string>('notes');
  const [examType, setExamType] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState('');
  const [viewingMaterial, setViewingMaterial] = useState<Material | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<string | null>(null);
  const [deletingMaterials, setDeletingMaterials] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createClient(), []);

  // Fetch user preferences and existing materials
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoadingPrefs(false);
          return;
        }

        // Fetch user preferences from database
        const { data: userData, error } = await supabase
          .from('users')
          .select('exam_type, selected_exam, preferred_language, onboarding_goals, onboarding_completed')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user preferences:', error);
          setLoadingPrefs(false);
          // Continue anyway with default preferences
          setUserPrefs(null);
        }

        if (userData) {
          setUserPrefs(userData);

          // Set default exam type from user's selected exam
          const userExam = userData.selected_exam || userData.exam_type;
          if (userExam) {
            setExamType(userExam);
          }

          // Extract weak areas and focus topics from onboarding goals
          const goals = userData.onboarding_goals || {};
          const weakAreas = goals.weak_areas || [];
          const focusTopics = goals.focus_topics || [];
          const allSuggestions = [...new Set([...weakAreas, ...focusTopics])];
          
          if (allSuggestions.length > 0) {
            setSuggestedTopics(allSuggestions);
          }

          // Also fetch weak topics from user_progress
          const { data: progressData, error: progressError } = await supabase
            .from('user_progress')
            .select('weak_topics')
            .eq('user_id', user.id)
            .limit(5);

          if (progressError) {
            console.warn('Could not fetch user progress:', progressError);
          }

          if (progressData && progressData.length > 0) {
            const progressWeakTopics = progressData
              .flatMap(p => p.weak_topics || [])
              .filter((topic, index, self) => self.indexOf(topic) === index)
              .slice(0, 5);
            
            if (progressWeakTopics.length > 0) {
              setSuggestedTopics(prev => [...new Set([...prev, ...progressWeakTopics])]);
            }
          }
        }

        // Fetch existing materials
        const { data: materialsData, error: materialsError } = await supabase
          .from('study_materials')
          .select('id, file_url, topic, file_type, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (materialsError) {
          console.error('Error fetching materials:', materialsError);
          // Don't throw error, just set empty materials
          setMaterials([]);
        } else if (materialsData) {
          const formattedMaterials = materialsData.map(m => {
            // Extract filename from file_url and clean it up
            const rawFilename = m.file_url?.split('/').pop() || 'Unknown';
            // Remove timestamp prefix and clean up the name
            const cleanFilename = rawFilename
              .replace(/^\d{13}-/, '') // Remove 13-digit timestamp prefix
              .replace(/\.(pdf|docx|doc)$/i, '') // Remove file extension
              .replace(/_/g, ' ') // Replace underscores with spaces
              .trim();
            
            return {
              id: m.id,
              name: cleanFilename || 'Unnamed',
              topic: m.topic || 'General',
              type: m.file_type?.includes('pdf') ? 'PDF' : 'DOCX',
              date: new Date(m.created_at).toISOString().split('T')[0],
              file_url: m.file_url
            };
          });
          setMaterials(formattedMaterials);
        }
      } catch (error: any) {
        console.error('Error loading data:', error);
        // Set safe defaults
        setMaterials([]);
        setUserPrefs(null);
      } finally {
        setLoadingPrefs(false);
      }
    };

    fetchUserData();
  }, [supabase]);

  const getTopicColors = (topic: string) => {
    const colors: Record<string, { light: string; dark: string }> = {
      'Polity': { 
        light: 'bg-violet-100 text-violet-700 border-violet-300', 
        dark: 'dark:bg-violet-600/20 dark:text-violet-300 dark:border-violet-500/30' 
      },
      'Economy': { 
        light: 'bg-blue-100 text-blue-700 border-blue-300', 
        dark: 'dark:bg-blue-600/20 dark:text-blue-300 dark:border-blue-500/30' 
      },
      'History': { 
        light: 'bg-amber-100 text-amber-700 border-amber-300', 
        dark: 'dark:bg-amber-600/20 dark:text-amber-300 dark:border-amber-500/30' 
      },
      'Geography': { 
        light: 'bg-emerald-100 text-emerald-700 border-emerald-300', 
        dark: 'dark:bg-emerald-600/20 dark:text-emerald-300 dark:border-emerald-500/30' 
      },
      'Science': { 
        light: 'bg-cyan-100 text-cyan-700 border-cyan-300', 
        dark: 'dark:bg-cyan-600/20 dark:text-cyan-300 dark:border-cyan-500/30' 
      },
    };
    return colors[topic] || { 
      light: 'bg-gray-100 text-gray-700 border-gray-300', 
      dark: 'dark:bg-gray-600/20 dark:text-gray-300 dark:border-gray-500/30' 
    };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  }, []);

  const validateAndSetFile = (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload only PDF or DOCX files');
      return;
    }
    
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    setSelectedFile(file);
    
    // Auto-detect material type from filename
    const fileName = file.name.toLowerCase();
    if (fileName.includes('syllabus') || fileName.includes('syllabi') || fileName.includes('curriculum')) {
      setMaterialType('syllabus');
      toast.success(`File "${file.name}" selected - detected as Syllabus`);
    } else if (fileName.includes('pyq') || fileName.includes('previous year') || fileName.includes('past paper') || fileName.includes('question paper')) {
      setMaterialType('previous_year_paper');
      toast.success(`File "${file.name}" selected - detected as Previous Year Paper`);
    } else if (fileName.includes('notes') || fileName.includes('chapter') || fileName.includes('lecture')) {
      setMaterialType('notes');
      toast.success(`File "${file.name}" selected - detected as Notes`);
    } else {
      toast.success(`File "${file.name}" selected`);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    // Redirect to onboarding if not completed
    if (userPrefs && !userPrefs.onboarding_completed) {
      toast.error('Please complete onboarding first to set your exam preferences');
      window.location.href = '/onboarding';
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please login to upload materials');
        setUploading(false);
        return;
      }

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Session expired. Please login again');
        setUploading(false);
        return;
      }

      // Create form data - Only send topic if user explicitly selected one
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Add material type (notes, syllabus, previous_year_paper, etc.)
      formData.append('material_type', materialType);
      
      // Add exam type (NEET, JEE, UPSC, etc.)
      if (examType) {
        formData.append('exam_type', examType);
      }
      
      // Only include topic if user explicitly selected/typed one (optional override)
      if (selectedTopic) {
        formData.append('topic', selectedTopic);
      }
      // Backend will infer from user prefs or file metadata if topic is blank

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 300);

      // Upload to API
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      
      // Add to materials list
      const newMaterial: Material = {
        id: result.material.id,
        name: selectedFile.name,
        topic: result.material.topic || selectedTopic,
        type: selectedFile.type.includes('pdf') ? 'PDF' : 'DOCX',
        date: new Date().toISOString().split('T')[0]
      };
      
      setMaterials([newMaterial, ...materials]);
      
      // Show different success messages based on material type
      if (result.isSyllabus && result.syllabusTopics) {
        toast.success('Syllabus uploaded');
      } else {
        toast.success('Material uploaded successfully! 📚');
      }
      
      // Reset form (only file and topic, keep exam pre-filled)
      setSelectedFile(null);
      setSelectedTopic('');
      setCustomTopic('');
      setMaterialType('notes'); // Reset to default
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload material');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleView = async (material: Material) => {
    if (material.id) {
      setViewingMaterial(material);
      setLoadingFile(true);
      
      try {
        // Fetch the signed URL
        const response = await fetch(`/api/download/${material.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to load file');
        }
        
        // Get the redirect URL
        const url = response.url;
        setFileUrl(url);
      } catch (error) {
        console.error('Error loading file:', error);
        toast.error('Failed to load file');
        setViewingMaterial(null);
      } finally {
        setLoadingFile(false);
      }
    } else {
      toast.error('File ID not available');
    }
  };

  const closeViewer = () => {
    setViewingMaterial(null);
    setFileUrl(null);
  };

  const confirmDelete = (id: string) => {
    setMaterialToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!materialToDelete) return;

    // Add to deleting set immediately
    setDeletingMaterials(prev => new Set(prev).add(materialToDelete));
    setDeleteDialogOpen(false);

    try {
      // Get the material details first to delete the file from storage
      const { data: material, error: fetchError } = await supabase
        .from('study_materials')
        .select('file_url')
        .eq('id', materialToDelete)
        .single();

      if (fetchError) {
        console.error('Error fetching material:', fetchError);
        toast.error('Failed to delete material');
        setDeletingMaterials(prev => {
          const next = new Set(prev);
          next.delete(materialToDelete);
          return next;
        });
        return;
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('study_materials')
        .delete()
        .eq('id', materialToDelete);

      if (deleteError) {
        console.error('Error deleting material:', deleteError);
        toast.error('Failed to delete material');
        setDeletingMaterials(prev => {
          const next = new Set(prev);
          next.delete(materialToDelete);
          return next;
        });
        return;
      }

      // Delete file from storage if it exists
      if (material?.file_url) {
        // Extract file path from URL
        const urlParts = material.file_url.split('/storage/v1/object/public/study-materials/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          const { error: storageError } = await supabase.storage
            .from('study-materials')
            .remove([filePath]);

          if (storageError) {
            console.warn('Error deleting file from storage:', storageError);
            // Don't fail the operation if storage delete fails
          }
        }
      }

      // Update local state
      setMaterials(materials.filter(m => m.id !== materialToDelete));
      toast.success('Material deleted successfully');
      setDeletingMaterials(prev => {
        const next = new Set(prev);
        next.delete(materialToDelete);
        return next;
      });
      setMaterialToDelete(null);
    } catch (error) {
      console.error('Error in delete operation:', error);
      toast.error('Failed to delete material');
      setDeletingMaterials(prev => {
        const next = new Set(prev);
        next.delete(materialToDelete);
        return next;
      });
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      {/* File Viewer Modal */}
      <AnimatePresence>
        {viewingMaterial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={closeViewer}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-6xl h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b-2 border-black dark:border-white bg-[#F9F6F2] dark:bg-[#1a1a1a]">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-black dark:text-white" />
                  <h3 className="text-lg font-bold text-black dark:text-white truncate max-w-md">
                    {viewingMaterial.name}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeViewer}
                  className="h-8 w-8 rounded-lg border-2 border-black dark:border-white text-black dark:text-white hover:bg-red-100 dark:hover:bg-red-900/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="w-full h-[calc(100%-4rem)] bg-gray-100 dark:bg-gray-800">
                {loadingFile ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">Loading file...</p>
                    </div>
                  </div>
                ) : fileUrl ? (
                  <iframe
                    src={fileUrl}
                    className="w-full h-full"
                    title={viewingMaterial.name}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-600 dark:text-gray-400">Failed to load file</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-4 sm:space-y-6">
        {/* Full-screen uploading overlay */}
        {uploading && (
          <div className="fixed inset-0 bg-white/95 dark:bg-[#030213]/95 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-sm mx-4"
            >
              <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-gray-100 dark:border-gray-800"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 dark:border-t-cyan-400 animate-spin"></div>
                <div className="absolute inset-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <CloudUpload className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Uploading Material
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-4">
                Processing your file...
              </p>
              <div className="w-40 sm:w-48 mx-auto">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-2">{uploadProgress}%</p>
              </div>
            </motion.div>
          </div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-8"
        >
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Upload Materials</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Upload and organize your study materials</p>
          </div>
          {materials.length > 0 && (
            <Link href="/dashboard/tests">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:from-orange-600 hover:via-pink-600 hover:to-purple-700 text-white font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 border border-white/20">
                <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
                Generate Test
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </Link>
          )}
        </div>
        
        {/* Prompt for onboarding if not completed */}
        {!loadingPrefs && userPrefs && !userPrefs.onboarding_completed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700"
          >
            <p className="text-sm text-amber-900 dark:text-amber-200 font-medium">
              💡 Complete your{' '}
              <a href="/onboarding" className="underline font-bold hover:text-amber-700 dark:hover:text-amber-300">
                onboarding
              </a>
              {' '}to get personalized topic suggestions based on your weak areas!
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Upload Section */}
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
        <Card className="rounded-xl sm:rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-2 sm:border-[3px] border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] sm:dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] sm:dark:group-hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all duration-200">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-black dark:text-white font-bold text-base sm:text-lg">Upload New Material</CardTitle>
          </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-4 sm:p-8 text-center bg-gray-50 dark:bg-slate-800/30 hover:bg-gray-100 dark:hover:bg-slate-800/50 transition-all cursor-pointer ${
                  isDragging 
                    ? 'border-violet-500 dark:border-violet-600 bg-violet-50 dark:bg-violet-900/20' 
                    : 'border-gray-300 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-600/50'
                }`}
              >
                <Upload className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-blue-600 dark:text-blue-400 mb-2 sm:mb-3" />
                <p className="text-sm sm:text-base text-gray-900 dark:text-gray-200 mb-1 font-medium truncate px-2">
                  {selectedFile ? selectedFile.name : 'Tap to upload or drag & drop'}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">PDF, DOCX (Max 10MB)</p>
              </div>

              {/* AI Suggested Topics from Weak Areas */}
              {suggestedTopics.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    Your Weak Areas (click to focus)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTopics.map((topic, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedTopic(topic);
                          setCustomTopic(topic);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                          selectedTopic === topic
                            ? 'bg-violet-200 dark:bg-violet-800 text-violet-900 dark:text-violet-100 border-violet-500 dark:border-violet-600'
                            : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700 hover:bg-violet-200 dark:hover:bg-violet-900/50'
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Material Type and Exam Type Selection */}
              <div className="space-y-4">
                {/* Material Type Dropdown */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Material Type *
                  </label>
                  <Select value={materialType} onValueChange={setMaterialType}>
                    <SelectTrigger className="rounded-lg bg-white dark:bg-slate-800/50 border-2 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-200 font-medium">
                      <SelectValue placeholder="Select material type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="notes">📝 Study Notes</SelectItem>
                      <SelectItem value="syllabus">📋 Official Syllabus</SelectItem>
                      <SelectItem value="previous_year_paper">📄 Previous Year Paper</SelectItem>
                      <SelectItem value="textbook">📚 Textbook / Reference Book</SelectItem>
                      <SelectItem value="reference">📖 Additional Reference</SelectItem>
                      <SelectItem value="other">📁 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Exam Type Dropdown */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Exam / Syllabus For This Material *
                  </label>
                  <Select value={examType} onValueChange={setExamType}>
                    <SelectTrigger className="rounded-lg bg-white dark:bg-slate-800/50 border-2 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-200 font-medium">
                      <SelectValue placeholder="Select exam type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEET">🩺 NEET</SelectItem>
                      <SelectItem value="JEE">🔬 JEE (Mains/Advanced)</SelectItem>
                      <SelectItem value="UPSC">🏛️ UPSC Civil Services</SelectItem>
                      <SelectItem value="Banking">🏦 Banking (IBPS/SBI)</SelectItem>
                      <SelectItem value="SSC">📝 SSC (CGL/CHSL)</SelectItem>
                      <SelectItem value="CAT">💼 CAT</SelectItem>
                      <SelectItem value="GATE">⚙️ GATE</SelectItem>
                      <SelectItem value="Other">📚 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Upload Button */}
              <div className="space-y-4">
                <Button 
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="w-full bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg border-0 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Material'}
                </Button>
              </div>
            </CardContent>
          </Card>
      </motion.div>

      {/* Filter & Search */}
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
            <CardTitle className="text-black dark:text-white font-bold">My Materials</CardTitle>
          </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black dark:text-white" />
                  <Input
                    placeholder="Search materials..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 rounded-xl bg-white dark:bg-[#2a2a2a] border-2 border-black dark:border-white text-black dark:text-white placeholder:text-[#555555] dark:placeholder:text-gray-400 font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]"
                  />
                </div>

              </div>

              {/* Materials Table */}
              {loadingPrefs ? (
                <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-12 text-center bg-gray-50 dark:bg-slate-800/30">
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-12 w-12 border-4 border-black dark:border-white border-t-transparent dark:border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Loading materials...</p>
                  </div>
                </div>
              ) : filteredMaterials.length > 0 ? (
                <>
                  {/* Mobile Card View - Scrollable if more than 5 items */}
                  <div className={`sm:hidden space-y-3 ${filteredMaterials.length > 5 ? 'max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent' : ''}`}>
                    {filteredMaterials.map((material) => {
                      const isDeleting = deletingMaterials.has(material.id);
                      return (
                        <div 
                          key={material.id}
                          className={`p-3 bg-white dark:bg-[#2a2a2a] border-2 border-black dark:border-white rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] ${isDeleting ? 'opacity-50' : 'opacity-100'}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <FileText className="h-5 w-5 text-black dark:text-white flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-black dark:text-white truncate">{material.name}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">{material.type}</span>
                                  <span>{material.date}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-black dark:text-white border-2 border-black dark:border-white rounded-lg"
                                onClick={() => handleView(material)}
                                disabled={isDeleting}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-black dark:text-white border-2 border-black dark:border-white rounded-lg"
                                onClick={() => confirmDelete(material.id)}
                                disabled={isDeleting}
                              >
                                {isDeleting ? (
                                  <div className="h-4 w-4 border-2 border-black dark:border-white border-t-transparent dark:border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Desktop Table View - Scrollable if more than 6 items */}
                  <div className={`hidden sm:block border-2 border-black dark:border-white rounded-xl overflow-hidden bg-white dark:bg-[#2a2a2a] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] ${filteredMaterials.length > 6 ? 'max-h-[450px] overflow-y-auto' : ''}`}>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-black dark:border-white">
                        <TableHead className="text-black dark:text-white font-bold">File Name</TableHead>
                        <TableHead className="text-black dark:text-white font-bold">Type</TableHead>
                        <TableHead className="text-black dark:text-white font-bold">Date Uploaded</TableHead>
                        <TableHead className="text-right text-black dark:text-white font-bold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMaterials.map((material) => {
                        const isDeleting = deletingMaterials.has(material.id);
                        
                        return (
                        <TableRow 
                          key={material.id} 
                          className={`border-black dark:border-white transition-opacity ${isDeleting ? 'opacity-50' : 'opacity-100'}`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-black dark:text-white" />
                              <span className="text-black dark:text-white font-bold">{material.name}</span>
                              {isDeleting && (
                                <span className="text-xs text-red-600 dark:text-red-400 font-medium ml-2">
                                  Deleting...
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-black dark:text-white font-medium">{material.type}</TableCell>
                          <TableCell className="text-[#555555] dark:text-gray-400 font-medium">{material.date}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-black dark:text-white border-2 border-black dark:border-white rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]"
                                onClick={() => handleView(material)}
                                disabled={isDeleting}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-black dark:text-white border-2 border-black dark:border-white rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]"
                                onClick={() => confirmDelete(material.id)}
                                disabled={isDeleting}
                              >
                                {isDeleting ? (
                                  <div className="h-4 w-4 border-2 border-black dark:border-white border-t-transparent dark:border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {/* Items count */}
                {filteredMaterials.length > 0 && (
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2">
                    <span>{filteredMaterials.length} material{filteredMaterials.length !== 1 ? 's' : ''}</span>
                    {filteredMaterials.length > 5 && (
                      <span className="text-[10px] sm:text-xs">Scroll to see more</span>
                    )}
                  </div>
                )}
                </>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-12 text-center bg-gray-50 dark:bg-slate-800/30">
                  <FileText className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-2">No materials uploaded yet</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Upload your first study material to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
      </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the material
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMaterialToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
