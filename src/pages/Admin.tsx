import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Shield,
  Users,
  FolderOpen,
  Image,
  Loader2,
  ArrowLeft,
  Crown,
  Plus,
  Trash2,
  Upload,
  Sparkles,
  LayoutTemplate,
  Clock,
  Calendar
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface UserWithProfile {
  id: string;
  email: string;
  name: string;
  subscription_tier: string;
  created_at: string;
  project_count: number;
  elite_expiry_date?: string;
}

interface ProjectWithStats {
  id: string;
  project_name: string;
  status: string;
  created_at: string;
  user_email: string;
  submission_count: number;
}

interface AdminTemplate {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  category: string;
  created_at: string;
}

export default function Admin() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [templates, setTemplates] = useState<AdminTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Template form state
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('general');
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Add state for elite duration management
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  const [durationUnit, setDurationUnit] = useState<'month' | 'year'>('month');

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isAdmin) {
        navigate('/dashboard');
        toast.error('Access denied. Admin privileges required.');
      }
    }
  }, [user, authLoading, roleLoading, isAdmin, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchAllData();
    }
  }, [user, isAdmin]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchProjects(), fetchTemplates()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersWithCounts = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.user_id);

          return {
            id: profile.user_id,
            email: profile.email,
            name: profile.name,
            subscription_tier: profile.subscription_tier,
            created_at: profile.created_at,
            project_count: count || 0,
          };
        })
      );

      setUsers(usersWithCounts);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const fetchProjects = async () => {
    try {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const projectsWithStats = await Promise.all(
        (projectsData || []).map(async (project) => {
          const { count } = await supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('user_id', project.user_id)
            .maybeSingle();

          return {
            id: project.id,
            project_name: project.project_name,
            status: project.status,
            created_at: project.created_at,
            user_email: profile?.email || 'Unknown',
            submission_count: count || 0,
          };
        })
      );

      setProjects(projectsWithStats);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    }
  };

  const toggleUserElite = async (userId: string, currentTier: string, durationMonths: number = 1) => {
    const newTier = currentTier === 'elite' ? 'free' : 'elite';
    try {
      let elite_expiry_date: string | null = null;
      if (newTier === 'elite') {
        const now = new Date();
        const expiryDate = new Date(now.setMonth(now.getMonth() + durationMonths));
        elite_expiry_date = expiryDate.toISOString();
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_tier: newTier,
          elite_expiry_date: elite_expiry_date
        })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.map(u => 
        u.id === userId ? { ...u, subscription_tier: newTier, elite_expiry_date } : u
      ));
      toast.success(`User ${newTier === 'elite' ? 'upgraded to' : 'downgraded from'} Cardlify Elite`);
    } catch (error) {
      console.error('Error updating user tier:', error);
      toast.error('Failed to update user subscription');
    }
  };

  // Function to handle elite upgrade with duration
  const handleEliteUpgrade = async () => {
    if (!selectedUserId) return;

    const durationInMonths = durationUnit === 'month' ? selectedDuration : selectedDuration * 12;
    await toggleUserElite(selectedUserId, 'free', durationInMonths);
    setSelectedUserId(null);
  };

  const handleAddTemplate = async () => {
    if (!templateName || !templateFile) {
      toast.error('Please provide a name and image');
      return;
    }

    setUploading(true);
    try {
      const fileExt = templateFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `admin-templates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('templates')
        .upload(filePath, templateFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('templates')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('admin_templates')
        .insert({
          name: templateName,
          description: templateDescription || null,
          image_url: urlData.publicUrl,
          category: templateCategory,
          created_by: user?.id,
        });

      if (insertError) throw insertError;

      toast.success('Template added successfully');
      setTemplateDialogOpen(false);
      setTemplateName('');
      setTemplateDescription('');
      setTemplateCategory('general');
      setTemplateFile(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error adding template:', error);
      toast.error('Failed to add template');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('admin_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      setTemplates(templates.filter(t => t.id !== templateId));
      toast.success('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50/50">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
      {/* Decorative gradient blur */}
      <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-rose-50/80 to-transparent pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-rose-100 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-100 to-rose-50 border border-rose-100 flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-semibold tracking-wide text-slate-800">
                Cardlify <span className="text-rose-600">Admin</span>
              </h1>
              <p className="text-xs text-rose-400 font-medium uppercase tracking-wider">System Control</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm" 
              onClick={() => navigate('/admin/elite')}
              className="text-amber-600 border-amber-200 hover:bg-amber-50 rounded-full px-4"
            >
              <Crown className="w-4 h-4 mr-2" />
              Elite Admin
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-full px-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-10 relative z-10">
        <Tabs defaultValue="users" className="space-y-8">
          <div className="flex items-center justify-between">
            <TabsList className="bg-white/50 border border-rose-100 p-1 rounded-2xl h-auto shadow-sm backdrop-blur-sm">
              <TabsTrigger 
                value="users" 
                className="rounded-xl px-6 py-2.5 data-[state=active]:bg-rose-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
              >
                <Users className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger 
                value="projects" 
                className="rounded-xl px-6 py-2.5 data-[state=active]:bg-rose-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Projects
              </TabsTrigger>
              <TabsTrigger 
                value="templates" 
                className="rounded-xl px-6 py-2.5 data-[state=active]:bg-rose-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
              >
                <LayoutTemplate className="w-4 h-4 mr-2" />
                Templates
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Elite Duration Management Section */}
          <div className="mb-8">
            <Card className="border-rose-100 shadow-xl shadow-rose-100/20 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100/30 border-b border-amber-100 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-100 to-amber-50 border border-amber-200 flex items-center justify-center shadow-sm">
                    <Crown className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-serif text-slate-800">Elite Membership Management</CardTitle>
                    <CardDescription className="text-slate-500">
                      Set duration for elite subscriptions
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-amber-700">Duration</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={selectedDuration}
                      onChange={(e) => setSelectedDuration(parseInt(e.target.value) || 1)}
                      className="w-32 border-amber-200 focus-visible:ring-amber-500"
                      placeholder="Duration"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit" className="text-amber-700">Unit</Label>
                    <Select value={durationUnit} onValueChange={(value: 'month' | 'year') => setDurationUnit(value)}>
                      <SelectTrigger id="unit" className="w-32 border-amber-200 focus:ring-amber-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">Month(s)</SelectItem>
                        <SelectItem value="year">Year(s)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleEliteUpgrade}
                    disabled={!selectedUserId}
                    className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-lg shadow-amber-200/50"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Apply Elite Duration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Tab */}
          <TabsContent value="users" className="animate-in fade-in-50 duration-500">
            <Card className="border-rose-100 shadow-xl shadow-rose-100/20 bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-white to-rose-50/30 border-b border-rose-50 px-8 py-6">
                <CardTitle className="text-xl font-serif text-slate-800">User Management</CardTitle>
                <CardDescription className="text-slate-500">
                  Overview of all registered users and their subscription tiers
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-rose-50/50">
                    <TableRow className="hover:bg-transparent border-rose-100">
                      <TableHead className="pl-8 text-rose-900/60 font-medium">Name</TableHead>
                      <TableHead className="text-rose-900/60 font-medium">Email</TableHead>
                      <TableHead className="text-rose-900/60 font-medium">Projects</TableHead>
                      <TableHead className="text-rose-900/60 font-medium">Status</TableHead>
                      <TableHead className="text-rose-900/60 font-medium">Expiry</TableHead>
                      <TableHead className="text-rose-900/60 font-medium">Joined</TableHead>
                      <TableHead className="text-rose-900/60 font-medium text-right pr-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} className="hover:bg-rose-50/40 border-rose-50 transition-colors">
                        <TableCell className="pl-8 font-medium text-slate-700">{u.name}</TableCell>
                        <TableCell className="text-slate-500">{u.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                             <span className="font-semibold text-rose-600">{u.project_count}</span>
                             <span className="text-xs text-slate-400">projects</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={`rounded-full px-3 py-0.5 border-0 font-normal ${
                              u.subscription_tier === 'elite' 
                                ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' 
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {u.subscription_tier === 'elite' ? (
                              <><Crown className="w-3 h-3 mr-1.5 fill-amber-200" /> Elite Member</>
                            ) : 'Free Tier'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {u.subscription_tier === 'elite' && u.elite_expiry_date ? (
                            <div className="flex items-center gap-1 text-xs">
                              <Clock className="w-3 h-3 text-amber-500" />
                              {new Date(u.elite_expiry_date).toLocaleDateString()}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end gap-2">
                            {u.subscription_tier === 'elite' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleUserElite(u.id, u.subscription_tier)}
                                className="rounded-full text-xs font-medium border-rose-200 text-rose-700 hover:bg-rose-50"
                              >
                                Downgrade
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUserId(u.id);
                                  setSelectedDuration(1);
                                  setDurationUnit('month');
                                }}
                                className="rounded-full text-xs font-medium border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-rose-600"
                              >
                                Set Elite
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="animate-in fade-in-50 duration-500">
            <Card className="border-rose-100 shadow-xl shadow-rose-100/20 bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-white to-rose-50/30 border-b border-rose-50 px-8 py-6">
                <CardTitle className="text-xl font-serif text-slate-800">Project Oversight</CardTitle>
                <CardDescription className="text-slate-500">
                  Global view of all user projects and generation statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-rose-50/50">
                    <TableRow className="hover:bg-transparent border-rose-100">
                      <TableHead className="pl-8 text-rose-900/60 font-medium">Project Name</TableHead>
                      <TableHead className="text-rose-900/60 font-medium">Owner</TableHead>
                      <TableHead className="text-rose-900/60 font-medium">Status</TableHead>
                      <TableHead className="text-rose-900/60 font-medium">Generations</TableHead>
                      <TableHead className="text-rose-900/60 font-medium">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id} className="hover:bg-rose-50/40 border-rose-50 transition-colors">
                        <TableCell className="pl-8 font-medium text-slate-700">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-400" />
                            {project.project_name}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500">{project.user_email}</TableCell>
                        <TableCell>
                          <Badge 
                            className={`rounded-full px-3 font-normal border-0 ${
                              project.status === 'active' 
                                ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' 
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Sparkles className="w-3 h-3 text-rose-400" />
                            {project.submission_count}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {new Date(project.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="animate-in fade-in-50 duration-500">
            <Card className="border-rose-100 shadow-xl shadow-rose-100/20 bg-white/90 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-rose-50 px-8 py-6">
                <div>
                  <CardTitle className="text-xl font-serif text-slate-800">Template Gallery</CardTitle>
                  <CardDescription className="text-slate-500">
                    Curate the visual templates available to users
                  </CardDescription>
                </div>
                <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-lg shadow-rose-200">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="font-serif text-xl">New Template</DialogTitle>
                      <DialogDescription>
                        Upload a design preview and assign category details.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Template Name</Label>
                        <Input
                          id="name"
                          className="focus-visible:ring-rose-500"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          placeholder="e.g., Corporate ID Card"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description (optional)</Label>
                        <Input
                          id="description"
                          className="focus-visible:ring-rose-500"
                          value={templateDescription}
                          onChange={(e) => setTemplateDescription(e.target.value)}
                          placeholder="Brief description"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Input
                          id="category"
                          className="focus-visible:ring-rose-500"
                          value={templateCategory}
                          onChange={(e) => setTemplateCategory(e.target.value)}
                          placeholder="e.g., corporate, event"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="image">Preview Image</Label>
                        <div className="border-2 border-dashed border-rose-200 rounded-lg p-4 bg-rose-50/50 hover:bg-rose-50 transition-colors">
                            <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            className="cursor-pointer border-0 bg-transparent"
                            onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                            />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setTemplateDialogOpen(false)} className="border-rose-200 hover:bg-rose-50 text-rose-700">
                        Cancel
                      </Button>
                      <Button onClick={handleAddTemplate} disabled={uploading} className="bg-rose-600 hover:bg-rose-700 text-white">
                        {uploading ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                        ) : (
                          <><Upload className="w-4 h-4 mr-2" /> Upload Template</>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-8">
                {templates.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-rose-100 rounded-2xl bg-rose-50/30">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-rose-100">
                        <Image className="w-8 h-8 text-rose-300" />
                    </div>
                    <p className="text-slate-800 font-medium">No templates yet</p>
                    <p className="text-slate-400 text-sm mt-1">Add your first design to get started.</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                      <Card key={template.id} className="group overflow-hidden border-rose-100 hover:border-rose-200 hover:shadow-lg hover:shadow-rose-100/50 transition-all duration-300">
                        <div className="aspect-video bg-rose-50 relative overflow-hidden">
                          <img
                            src={template.image_url}
                            alt={template.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                            <p className="text-white text-xs font-medium truncate">{template.description}</p>
                          </div>
                        </div>
                        <CardContent className="p-4 bg-white">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold text-slate-800">{template.name}</h4>
                              <Badge variant="secondary" className="mt-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border-0">
                                {template.category}
                              </Badge>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Template</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{template.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteTemplate(template.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}