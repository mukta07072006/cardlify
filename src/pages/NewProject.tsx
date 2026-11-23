import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SharedHeader from '@/components/SharedHeader';
import { Eyebrow, StudioFooter } from '@/components/studio';
import { toast } from 'sonner';
import { generateProjectSlug } from '@/lib/urlUtils';
import { cn } from '@/lib/utils';
import type { ProjectMode } from '@/lib/forms';
import { ArrowLeft, ArrowRight, ClipboardList, Image, LayoutTemplate, Loader2, Sparkles, Upload, X } from 'lucide-react';

const MODES: {
  value: ProjectMode;
  title: string;
  description: string;
  icon: typeof Image;
}[] = [
  {
    value: 'card',
    title: 'Card only',
    description: 'Collect details and generate a personalised card from your artwork.',
    icon: Image,
  },
  {
    value: 'form',
    title: 'Form only',
    description: 'A clean Google-Forms-style questionnaire. No card design needed.',
    icon: ClipboardList,
  },
  {
    value: 'both',
    title: 'Card + form',
    description: 'Ask extra questions and hand out a card when people finish.',
    icon: Sparkles,
  },
];

export default function NewProject() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [mode, setMode] = useState<ProjectMode>('card');
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templatePreview, setTemplatePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const needsCard = mode !== 'form';

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

  const clearArtwork = () => {
    setTemplateFile(null);
    setTemplatePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    if (needsCard && !templateFile) {
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
      let publicUrl: string | null = null;

      if (templateFile) {
        const fileExt = templateFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('templates')
          .upload(fileName, templateFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl: uploadedUrl } } = supabase.storage
          .from('templates')
          .getPublicUrl(fileName);

        publicUrl = uploadedUrl;
      }

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          project_name: projectName.trim(),
          template_image_url: publicUrl,
          status: 'active',
          project_mode: mode,
          form_title: mode === 'card' ? null : projectName.trim(),
        })
        .select()
        .single();

      if (projectError) throw projectError;

      toast.success('Project created');
      navigate(mode === 'card' ? `/project/${project.id}/editor` : `/project/${project.id}/forms`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />

      <main className="mx-auto max-w-[900px] px-5 py-12 sm:px-6 lg:py-16">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-foreground/50 transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
        </Link>

        <div className="mt-8">
          <Eyebrow>New project</Eyebrow>
          <h1 className="display-xl mt-5">
            Start a new
            <br />
            <span className="serif text-[1.05em]">batch.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-foreground/55">
            Pick how people should take part. A card, a form, or both — you can change the
            questions any time.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div className="surface p-7">
            <div className="space-y-2">
              <Label htmlFor="projectName" className="mono-label text-foreground/45">
                Project name
              </Label>
              <Input
                id="projectName"
                placeholder="e.g. Annual Conference 2026"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={loading}
                className="h-12 rounded-xl border-foreground/15 bg-white/70 text-base"
              />
              {projectName.trim() && (
                <p className="pt-1 text-xs text-foreground/40">
                  Share link name:{' '}
                  <span className="font-mono text-foreground/60">{generateProjectSlug(projectName.trim())}</span>
                </p>
              )}
            </div>

            <div className="mt-8 space-y-3">
              <Label className="mono-label text-foreground/45">What should people get?</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {MODES.map((option) => {
                  const Icon = option.icon;
                  const active = mode === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMode(option.value)}
                      disabled={loading}
                      aria-pressed={active}
                      className={cn(
                        'rounded-2xl border p-5 text-left transition',
                        active
                          ? 'border-foreground/70 bg-lime/25 shadow-[0_1px_0_rgba(0,0,0,0.04)]'
                          : 'border-foreground/12 bg-background/40 hover:border-foreground/30 hover:bg-white/60',
                      )}
                    >
                      <div
                        className={cn(
                          'grid h-10 w-10 place-items-center rounded-xl',
                          active ? 'bg-foreground text-lime' : 'bg-secondary text-foreground/50',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="mt-4 text-sm font-medium">{option.title}</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-foreground/50">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <Label className="mono-label text-foreground/45">
                  Template artwork {needsCard ? '' : '(optional)'}
                </Label>
                {!needsCard && (
                  <span className="mono-label text-[9px] text-foreground/35">
                    Add later in the card editor
                  </span>
                )}
              </div>

              {templatePreview ? (
                <div className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-background/50 p-4">
                  <img
                    src={templatePreview}
                    alt="Template preview"
                    className="mx-auto max-h-[360px] rounded-xl object-contain"
                  />
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <p className="mono-label truncate text-[9px] text-foreground/40">
                      {templateFile?.name}
                    </p>
                    <Button type="button" variant="ghost" size="sm" onClick={clearArtwork}>
                      <X className="h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="group block cursor-pointer rounded-2xl border border-dashed border-foreground/20 bg-background/40 px-6 py-10 text-center transition hover:border-foreground/40 hover:bg-white/60">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-lilac/70">
                    <Image className="h-5 w-5 text-foreground/60" />
                  </div>
                  <p className="mt-5 text-sm font-medium">
                    {needsCard ? 'Drop your card artwork here' : 'Upload artwork for the card'}
                  </p>
                  <p className="mt-1 text-xs text-foreground/45">PNG or JPG, up to 5MB</p>
                  <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-foreground/15 px-4 py-2 text-xs">
                    <Upload className="h-3.5 w-3.5" /> Choose file
                  </span>
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

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="group">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                </>
              ) : mode === 'card' ? (
                <>
                  Continue to editor
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </>
              ) : (
                <>
                  <LayoutTemplate className="h-4 w-4" />
                  Build the form
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </div>
        </form>
      </main>

      <StudioFooter />
    </div>
  );
}
