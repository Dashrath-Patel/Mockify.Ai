"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import LoadingScreen from "@/components/loading-screen";
import { 
  Upload, 
  FileText,
  Image as ImageIcon,
  File,
  Search,
  Trash2,
  Download,
  Eye,
  Calendar,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

interface Material {
  id: string;
  filename: string;
  fileType: string;
  fileSize?: number;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const supabase = createClient();

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: materialsData } = await supabase
        .from('study_materials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setMaterials(materialsData?.map(material => ({
        id: material.id,
        filename: material.file_url?.split('/').pop() || 'Unknown',
        fileType: material.file_type,
        fileSize: material.file_size,
        processingStatus: material.processing_status,
        createdAt: material.created_at
      })) || []);

    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white border-0"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-500 text-white border-0"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case 'pending':
        return <Badge className="bg-blue-500 text-white border-0"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 text-white border-0"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white border-0">{status}</Badge>;
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    if (fileType.includes('image')) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const filteredMaterials = materials.filter(material =>
    material.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <LoadingScreen message="Loading your materials..." />;
  }

  return (
    <div className="min-h-screen bg-[#F9F6F2]">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        {/* Header */}
        <div className="mb-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                Study Materials
              </h1>
              <p className="text-lg text-neutral-600 dark:text-neutral-400">
                Manage and organize your study resources
              </p>
            </div>
            <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg">
              <Link href="/upload">
                <Upload className="h-5 w-5 mr-2" />
                Upload Material
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-200 mb-1">Total Files</p>
                  <p className="text-4xl font-bold text-white">{materials.length}</p>
                </div>
                <File className="h-12 w-12 text-white/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-200 mb-1">Processed</p>
                  <p className="text-4xl font-bold text-white">
                    {materials.filter(m => m.processingStatus === 'completed').length}
                  </p>
                </div>
                <CheckCircle2 className="h-12 w-12 text-white/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-orange-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-200 mb-1">Processing</p>
                  <p className="text-4xl font-bold text-white">
                    {materials.filter(m => m.processingStatus === 'processing').length}
                  </p>
                </div>
                <Loader2 className="h-12 w-12 text-white/30 animate-spin" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-red-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-200 mb-1">Failed</p>
                  <p className="text-4xl font-bold text-white">
                    {materials.filter(m => m.processingStatus === 'failed').length}
                  </p>
                </div>
                <XCircle className="h-12 w-12 text-white/30" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <Input
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 border-2"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Materials Grid */}
        <div className="grid gap-6">
          {filteredMaterials.length > 0 ? (
            filteredMaterials.map((material, index) => (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-neutral-900 shadow-lg group">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 rounded-xl">
                        {getFileIcon(material.fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {material.filename}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                          <span>{material.fileType}</span>
                          <span>•</span>
                          <span>{formatFileSize(material.fileSize)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(material.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(material.processingStatus)}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="border-2">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="border-2">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="border-2 text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950 shadow-lg">
              <CardContent className="text-center py-16">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="inline-block p-4 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full mb-6"
                >
                  <Upload className="h-16 w-16 text-green-600 dark:text-green-400" />
                </motion.div>
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
                  {searchQuery ? 'No materials found' : 'No materials uploaded'}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
                  {searchQuery 
                    ? 'Try adjusting your search query'
                    : 'Upload your study materials to get started with AI-generated questions'}
                </p>
                <Button asChild className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg">
                  <Link href="/upload">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Materials
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
