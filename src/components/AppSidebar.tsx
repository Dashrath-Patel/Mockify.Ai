import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  TrendingUp, 
  MessageSquare, 
  User, 
  Settings as SettingsIcon 
} from 'lucide-react';
import { cn } from './ui/utils';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  isOpen: boolean;
  darkMode: boolean;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'upload', label: 'Upload Materials', icon: Upload },
  { id: 'tests', label: 'Mock Tests', icon: FileText },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'community', label: 'Community', icon: MessageSquare },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar({ currentPage, setCurrentPage, isOpen, darkMode }: SidebarProps) {
  if (!isOpen) return null;

  return (
    <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 ${darkMode ? 'bg-black/80 border-slate-800/50' : 'bg-white border-gray-200'} border-r transition-colors overflow-y-auto`}>
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentPage(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                    isActive 
                      ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/20" 
                      : darkMode
                      ? "text-gray-300 hover:bg-slate-800"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
