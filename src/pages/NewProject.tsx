import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { generateProjectSlug } from '@/lib/urlUtils';
import { ArrowLeft, Upload, Loader2, CreditCard, Image } from 'lucide-react';

export default function NewProject() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templatePreview, setTemplatePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file (PNG or JPG)');
        return;
      }

      setTemplateFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setTemplatePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    if (!templateFile) {
      toast.error('Please upload a template image');
      return;
    }

    if (!user) {
      toast.error('You must be logged in');
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
      // Upload template image
      const fileExt = templateFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('templates')
        .upload(fileName, templateFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('templates')
        .getPublicUrl(fileName);

      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          project_name: projectName.trim(),
          template_image_url: publicUrl,
          status: 'active'
        })
        .select()
        .single();

      if (projectError) throw projectError;

      toast.success('Project created successfully!');
      navigate(`/project/${project.id}/editor`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 group cursor-pointer">
              <img 
                src="/cardlify.png" 
                alt="Cardlify Logo" 
                className="h-10 object-contain"
              />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Create New Project</h1>
              <p className="text-sm text-muted-foreground">Set up your card template</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Enter your project name and upload a template background image
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  placeholder="e.g., Annual Conference 2024"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={loading}
                />
                {projectName.trim() && (
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    <span className="font-medium">URL preview:</span> 
                    <span className="font-mono ml-1">
                      {generateProjectSlug(projectName.trim())}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Template Background Image</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  {templatePreview ? (
                    <div className="space-y-4">
                      <img 
                        src={templatePreview} 
                        alt="Template preview" 
                        className="max-h-64 mx-auto rounded-lg shadow-md"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setTemplateFile(null);
                          setTemplatePreview(null);
                        }}
                      >
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <Image className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Upload template image</p>
                          <p className="text-sm text-muted-foreground">PNG or JPG, max 5MB</p>
                        </div>
                        <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 pointer-events-none">
                          <Upload className="w-4 h-4" />
                          Choose File
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Project...
                    </>
                  ) : (
                    'Continue to Editor'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
