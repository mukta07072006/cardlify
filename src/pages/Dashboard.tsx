import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Wordmark } from '@/components/studio';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Users,
  Loader2,
  Calendar,
  Crown,
  Shield,
  LayoutGrid,
  ArrowUpRight,
  FolderOpen,
  FileText,
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
} from '@/components/ui/alert-dialog';

interface Project {
  id: string;
  project_name: string;
  template_image_url: string | null;
  status: string;
  created_at: string;
  project_mode: string | null;
  submission_count?: number;
}

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
        }),
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
      setProjects(projects.filter((p) => p.id !== projectId));
      toast.success('Project deleted');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-foreground/40" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between px-5 sm:px-6">
          <Link to="/" aria-label="Cardlify home">
            <Wordmark />
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="hidden sm:inline-flex">
              Studio
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
              Profile
            </Button>
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
                <Shield className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}
            {!isElite && (
              <Button variant="outline" size="sm" onClick={() => navigate('/pricing')}>
                <Crown className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Upgrade</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={signOut} className="text-foreground/50">
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 pt-12 sm:px-6 lg:pt-16">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span
                className={`mono-label rounded-full px-3 py-1.5 text-[10px] ${
                  isElite ? 'bg-foreground text-lime' : 'border border-foreground/15 text-foreground/50'
                }`}
              >
                {isElite ? 'Elite member' : 'Free plan'}
              </span>
              <span className="mono-label text-[10px] text-foreground/35">
                {projects.length} {projects.length === 1 ? 'project' : 'projects'}
              </span>
            </div>
            <h1 className="display-xl mt-5">
              Your <span className="serif text-[1.05em]">workspace.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-foreground/55">
              Every project is one template and one shareable link. Open a project to see its
              submissions, or start a new batch.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2">
            <Button
              size="lg"
              onClick={() => navigate('/project/new')}
              disabled={!canCreateProject}
              className="group"
            >
              <Plus className="h-4 w-4" />
              New project
              <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
            {!canCreateProject && (
              <p className="max-w-[220px] text-xs leading-relaxed text-foreground/40">
                Free accounts run one project at a time.{' '}
                <Link to="/pricing" className="underline underline-offset-2">
                  Upgrade to Elite
                </Link>{' '}
                for unlimited.
              </p>
            )}
          </div>
        </div>

        <div className="mt-12">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-foreground/20 bg-white/40 px-6 py-24 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-lilac/70">
                <LayoutGrid className="h-7 w-7 text-foreground/60" />
              </div>
              <h2 className="display-md mt-6">Nothing on the wall yet</h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-foreground/50">
                Upload a template, place your fields, and Cardlify will produce the rest.
              </p>
              <Button className="mt-7" onClick={() => navigate('/project/new')}>
                <Plus className="h-4 w-4" /> Create your first project
              </Button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <article
                  key={project.id}
                  className="hover-lift group flex flex-col overflow-hidden rounded-[1.75rem] border border-foreground/10 bg-white/60"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="relative block aspect-[16/9] w-full overflow-hidden bg-secondary text-left"
                  >
                    {project.template_image_url ? (
                      <img
                        src={project.template_image_url}
                        alt={project.project_name}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-lilac/60 to-secondary">
                        <FolderOpen className="h-9 w-9 text-foreground/25" />
                      </div>
                    )}
                    <span className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 backdrop-blur">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          project.status === 'active' ? 'bg-lime' : 'bg-foreground/25'
                        }`}
                      />
                      <span className="mono-label text-[9px] text-foreground/60">{project.status}</span>
                    </span>
                  </button>

                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="font-display text-xl leading-tight tracking-tight">
                      {project.project_name}
                    </h2>
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-foreground/45">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(project.created_at).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {project.submission_count} entries
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        {project.project_mode === 'form'
                          ? 'Form only'
                          : project.project_mode === 'both'
                            ? 'Card + form'
                            : 'Card only'}
                      </span>
                    </div>

                    <div className="mt-6 flex items-center gap-2 border-t border-foreground/10 pt-5">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/project/${project.id}`)}
                      >
                        Open project
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${project.project_name}`}
                            className="text-foreground/35 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-3xl border-foreground/10">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="display-md">Delete this project?</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm leading-relaxed text-foreground/55">
                              All submissions and generated cards for “{project.project_name}” will
                              be removed. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-full">Keep it</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteProject(project.id)}
                              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete project
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
