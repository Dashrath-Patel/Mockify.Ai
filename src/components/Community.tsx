import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { MessageSquare, ThumbsUp, Send, Search, Users } from 'lucide-react';
import { Separator } from './ui/separator';
import { createClient } from '@/lib/supabase';

interface Discussion {
  id: number;
  user: string;
  avatar: string;
  title: string;
  content: string;
  topic: string;
  likes: number;
  comments: number;
  time: string;
}

const mockDiscussions: Discussion[] = [
  {
    id: 1,
    user: 'Priya Sharma',
    avatar: 'PS',
    title: 'Best strategy for UPSC Prelims preparation?',
    content: 'I am starting my UPSC prep and looking for advice on how to effectively prepare for Prelims. Should I focus more on NCERTs or current affairs?',
    topic: 'UPSC',
    likes: 24,
    comments: 12,
    time: '2 hours ago'
  },
  {
    id: 2,
    user: 'Rahul Verma',
    avatar: 'RV',
    title: 'Economics concepts - Need clarification',
    content: 'Can someone explain the difference between fiscal deficit and revenue deficit in simple terms? I keep getting confused.',
    topic: 'Economy',
    likes: 18,
    comments: 8,
    time: '5 hours ago'
  },
  {
    id: 3,
    user: 'Anjali Desai',
    avatar: 'AD',
    title: 'SSC CGL Tier 2 preparation tips',
    content: 'Cleared Tier 1 with good marks. What should be my strategy for Tier 2? Any recommended books or resources?',
    topic: 'SSC',
    likes: 31,
    comments: 15,
    time: '1 day ago'
  },
  {
    id: 4,
    user: 'Vikram Singh',
    avatar: 'VS',
    title: 'Modern Indian History - Important topics',
    content: 'Which topics in Modern Indian History are most frequently asked in competitive exams? Freedom struggle movements?',
    topic: 'History',
    likes: 15,
    comments: 6,
    time: '1 day ago'
  }
];

export function Community() {
  const [discussions, setDiscussions] = useState<Discussion[]>(mockDiscussions);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userName, setUserName] = useState<string>('User');
  const [userInitials, setUserInitials] = useState<string>('U');
  const supabase = createClient();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('name')
            .eq('id', user.id)
            .single();
          
          const name = userData?.name || user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
          setUserName(name);
          setUserInitials(name.charAt(0).toUpperCase());
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleCreatePost = () => {
    if (newTitle && newContent) {
      const newPost: Discussion = {
        id: discussions.length + 1,
        user: userName,
        avatar: userInitials,
        title: newTitle,
        content: newContent,
        topic: 'General',
        likes: 0,
        comments: 0,
        time: 'Just now'
      };
      setDiscussions([newPost, ...discussions]);
      setNewTitle('');
      setNewContent('');
      setShowNewPost(false);
    }
  };

  const handleLike = (id: number) => {
    setDiscussions(discussions.map(d => 
      d.id === id ? { ...d, likes: d.likes + 1 } : d
    ));
  };

  const filteredDiscussions = discussions.filter(d =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
          <Users className="h-8 w-8 text-violet-500" />
          Community
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-base">Connect with fellow aspirants, share knowledge, and learn together</p>
      </motion.div>

      {/* Search and Create */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col md:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search discussions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-lg bg-white dark:bg-slate-800/50 border-2 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-200 placeholder:text-gray-500 focus:border-violet-400 dark:focus:border-violet-600 transition-colors"
          />
        </div>
        <Button
          onClick={() => setShowNewPost(!showNewPost)}
          className="bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-lg border-0 shadow-lg shadow-violet-500/20 font-semibold"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          New Discussion
        </Button>
      </motion.div>

      {/* Create New Post */}
      {showNewPost && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="group cursor-pointer"
          whileHover={{ 
            y: -4,
            transition: { duration: 0.2 }
          }}
        >
          <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-black dark:text-white font-bold">Start a Discussion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Discussion title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="rounded-xl bg-white dark:bg-[#2a2a2a] border-2 border-black dark:border-white text-black dark:text-white placeholder:text-[#555555] dark:placeholder:text-gray-400 font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]"
              />
              <Textarea
                placeholder="Share your thoughts, questions, or insights..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="rounded-xl min-h-[100px] bg-white dark:bg-[#2a2a2a] border-2 border-black dark:border-white text-black dark:text-white placeholder:text-[#555555] dark:placeholder:text-gray-400 font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]"
              />
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowNewPost(false)}
                  className="rounded-xl bg-white dark:bg-[#2a2a2a] border-2 border-black dark:border-white text-black dark:text-white font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]"
                >
                  Cancel
                  </Button>
                  <Button
                    onClick={handleCreatePost}
                    className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 hover:from-amber-500 hover:via-orange-600 hover:to-red-600 text-white border-2 border-black dark:border-white rounded-xl font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Post
                  </Button>
                </div>
              </CardContent>
            </Card>
        </motion.div>
      )}

      {/* Discussions List */}
      <div className="space-y-4">
        {filteredDiscussions.map((discussion, index) => (
          <motion.div
            key={discussion.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="group cursor-pointer"
            whileHover={{ 
              y: -4,
              transition: { duration: 0.2 }
            }}
          >
            <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all duration-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gradient-to-r from-violet-400 to-purple-500 text-white font-bold">
                      {discussion.avatar}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-black dark:text-white font-bold">{discussion.user}</span>
                      <span className="text-[#555555] dark:text-gray-500">•</span>
                      <span className="text-sm text-[#555555] dark:text-gray-500 font-medium">{discussion.time}</span>
                      <Badge variant="outline" className="ml-2 bg-gradient-to-r from-amber-400 to-orange-500 border-2 border-black dark:border-white text-white font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.3)]">
                        {discussion.topic}
                      </Badge>
                    </div>

                    <h3 className="text-black dark:text-white font-bold mb-2 text-lg">{discussion.title}</h3>
                    <p className="text-black dark:text-gray-300 mb-4 leading-relaxed font-medium">{discussion.content}</p>

                    <Separator className="my-3 bg-black dark:bg-white" />

                    <div className="flex items-center gap-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(discussion.id)}
                        className="text-black dark:text-white border-2 border-black dark:border-white rounded-lg p-2 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)] transition-all duration-200"
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {discussion.likes}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-black dark:text-white border-2 border-black dark:border-white rounded-lg p-2 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)] transition-all duration-200"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {discussion.comments} Comments
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredDiscussions.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="rounded-2xl bg-[#F9F6F2] dark:bg-[#1a1a1a] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-black dark:text-white mb-3" />
              <p className="text-black dark:text-white font-bold text-lg">No discussions found</p>
              <p className="text-sm text-[#555555] dark:text-gray-400 mt-1 font-medium">Try a different search term</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
