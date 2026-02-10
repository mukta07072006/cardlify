import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, 
  FolderOpen, 
  Trash2, 
  LogOut, 
  Users,
  Loader2,
  Calendar,
  Crown,
  Shield,
  User,
  LayoutGrid
} from 'lucide-react';
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
} from "@/components/ui/alert-dialog";

interface Project {
  id: string;
  project_name: string;
  template_image_url: string | null;
  status: string;
  created_at: string;
  submission_count?: number;
}

// Updated styles for a punchy Pixel Theme
const cardStyles = [
  { bg: 'bg-rose-100', border: 'border-rose-600', shadow: 'shadow-[6px_6px_0px_0px_#e11d48]', text: 'text-rose-600' },
  { bg: 'bg-stone-200', border: 'border-stone-800', shadow: 'shadow-[6px_6px_0px_0px_#1c1917]', text: 'text-stone-800' },
  { bg: 'bg-amber-100', border: 'border-amber-600', shadow: 'shadow-[6px_6px_0px_0px_#d97706]', text: 'text-amber-600' },
  { bg: 'bg-blue-100', border: 'border-blue-600', shadow: 'shadow-[6px_6px_0px_0px_#2563eb]', text: 'text-blue-600' },
];

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, isElite, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const canCreateProject = isElite || projects.length === 0;

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      const projectsWithCounts = await Promise.all(
        (projectsData || []).map(async (project) => {
          const { count } = await supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);
          return { ...project, submission_count: count || 0 };
        })
      );
      setProjects(projectsWithCounts);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
      setProjects(projects.filter(p => p.id !== projectId));
      toast.success('Project archived');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const activateEliteMembership = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_tier: 'elite' })
        .eq('user_id', user?.id);

      if (error) throw error;
      toast.success('Elite membership activated!');
      window.location.reload();
    } catch (error) {
      console.error('Error activating elite membership:', error);
      toast.error('Failed to activate elite membership');
    }
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f0]">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f0] text-stone-900 selection:bg-rose-500 selection:text-white pb-20 font-mono uppercase">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .font-pixel { font-family: 'Press Start 2P', monospace; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-pixel text-lg text-rose-600 tracking-tighter">CARDLIFY</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-stone-600 rounded-none border-2 border-transparent hover:border-black">
               HOME_PAGE
              </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="text-stone-600 rounded-none border-2 border-transparent hover:border-black">
               PROFILE
              </Button>
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="text-stone-600 rounded-none border-2 border-transparent hover:border-black">
                <Shield className="w-4 h-4 mr-2" /> ADMIN
              </Button>
            )}
            {!isElite && (
              <Button 
                variant="outline"
                size="sm"
                className="rounded-none border-2 border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100"
                onClick={() => navigate('/pricing')}
              >
                <Crown className="w-4 h-4 mr-2 text-amber-500" /> UPGRADE
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={signOut} className="text-rose-600 hover:bg-rose-100 rounded-none border-2 border-transparent hover:border-rose-600">
              <LogOut className="w-4 h-4 mr-2" /> SIGN_OUT
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-12">
        {/* Dashboard Title Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <h2 className="font-pixel text-2xl md:text-3xl font-bold text-stone-900 leading-none">
              USER_<span className="text-rose-500">WORKSPACE</span>
            </h2>
            <div className="flex items-center gap-3">
               <div className="bg-black text-white px-3 py-1 text-[10px] font-pixel">
                 {isElite ? 'ELITE_MEMBER' : 'FREE_PLAN'}
               </div>
               <span className="text-xs text-stone-400 font-bold border-l-2 border-stone-300 pl-3">
                 {projects.length} PROJECTS_TOTAL
               </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              onClick={() => navigate('/project/new')}
              disabled={!canCreateProject}
              className="rounded-none bg-rose-600 hover:bg-rose-700 text-white px-8 py-6 border-b-4 border-rose-900 active:border-b-0 active:translate-y-1 transition-all font-pixel text-[10px]"
            >
              <Plus className="w-4 h-4 mr-2" />
              NEW_PROJECT
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white border-4 border-black border-dashed">
            <LayoutGrid className="w-16 h-16 text-stone-200 mb-6" />
            <h3 className="font-pixel text-lg font-bold text-stone-900 mb-4 text-center px-4">NO_PROJECTS_FOUND</h3>
            <Button onClick={() => navigate('/project/new')} className="rounded-none border-2 border-black bg-stone-100 hover:bg-stone-200 text-black px-8">
              INITIALIZE_PROJECT
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => {
              const style = cardStyles[index % cardStyles.length];
              return (
                <div 
                  key={project.id}
                  className={`relative bg-white border-4 border-black p-6 ${style.shadow} hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200`}
                >
                  <div className="flex flex-col h-full">
                    <div className="mb-6">
                      <div className={`inline-flex p-3 border-2 border-black ${style.bg} ${style.text} mb-4`}>
                        <FolderOpen className="w-6 h-6" />
                      </div>
                      <h3 className="font-pixel text-xs font-bold text-stone-900 leading-relaxed mb-4 truncate">
                        {project.project_name}
                      </h3>
                      <div className="flex flex-col gap-2 text-stone-400 text-[10px] font-bold">
                        <span className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          DATE: {new Date(project.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-2">
                          <Users className="w-3 h-3" />
                          DATA: {project.submission_count} ENTRIES
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto pt-6 border-t-2 border-stone-100 flex items-center gap-3">
                      <Button 
                        onClick={() => navigate(`/project/${project.id}`)}
                        className="flex-1 rounded-none bg-stone-100 hover:bg-black hover:text-white text-stone-900 border-2 border-black transition-colors text-[10px] font-pixel"
                      >
                        OPEN_WS
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-none border-2 border-transparent hover:border-rose-600 text-stone-400 hover:text-rose-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-none border-4 border-black bg-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-pixel text-sm">ARCHIVE_CONFIRM?</AlertDialogTitle>
                            <AlertDialogDescription className="font-mono uppercase text-xs text-stone-500 leading-relaxed">
                              SYSTEM WILL REMOVE ALL DATA FOR "{project.project_name}". THIS ACTION CANNOT BE UNDONE.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col md:flex-row gap-2">
                            <AlertDialogCancel className="rounded-none border-2 border-black font-pixel text-[10px]">CANCEL</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteProject(project.id)}
                              className="rounded-none bg-rose-600 hover:bg-rose-700 text-white font-pixel text-[10px]"
                            >
                              EXECUTE_DELETE
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}