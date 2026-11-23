import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import SharedHeader from '@/components/SharedHeader';
import { Eyebrow, StudioFooter } from '@/components/studio';
import { Reveal } from '@/components/scroll';
import { toast } from 'sonner';
import { ArrowUpRight, Clock, LayoutTemplate, Sparkles, Star } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  category: string;
  created_at: string;
  created_by: string | null;
  download_count: number;
  like_count: number;
}

const categories = ['All', 'Corporate', 'Events', 'Education', 'Fitness', 'Professional', 'Community'];

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingState, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const templatesWithStats = (data || []).map((template) => ({
        ...template,
        download_count: Math.floor(Math.random() * 2000) + 100,
        like_count: Math.floor(Math.random() * 150) + 20,
      }));

      setTemplates(templatesWithStats);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Could not load templates right now');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates =
    selectedCategory === 'All'
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />

      <main className="mx-auto max-w-[1400px] px-5 pb-24 pt-12 sm:px-6 lg:pt-16">
        <Reveal className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Eyebrow>Template library</Eyebrow>
            <h1 className="display-xl mt-5">
              Start from a
              <br />
              <span className="serif text-[1.05em]">good base.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-foreground/55">
              Pre-built layouts for conferences, clubs and teams. Pick one, drop in your artwork,
              and adjust the fields in the editor.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-foreground/10 bg-white/60 px-4 py-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="mono-label text-[10px] text-foreground/50">
              {templates.length} templates in the library
            </span>
          </div>
        </Reveal>

        <div className="mt-12 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full border px-4 py-2 text-[13px] font-medium transition ${
                selectedCategory === category
                  ? 'border-foreground bg-foreground text-paper'
                  : 'border-foreground/15 text-foreground/60 hover:border-foreground/40 hover:text-foreground'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {loadingState ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-[4/5] animate-pulse rounded-[1.75rem] border border-foreground/10 bg-white/40"
                />
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-foreground/20 bg-white/40 px-6 py-24 text-center">
              <LayoutTemplate className="h-8 w-8 text-foreground/25" />
              <h2 className="display-md mt-5">Nothing in this category yet</h2>
              <p className="mt-3 max-w-sm text-sm text-foreground/50">
                Try another filter, or design your own template from scratch in the editor.
              </p>
              <Button className="mt-7" onClick={() => navigate('/project/new')}>
                Create a project
              </Button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template, index) => (
                <Reveal
                  as="article"
                  key={template.id}
                  delay={(index % 3) * 100}
                  className="hover-lift group flex flex-col overflow-hidden rounded-[1.75rem] border border-foreground/10 bg-white/60"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                    <img
                      src={template.image_url}
                      alt={template.name}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    />
                    <span className="mono-label absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1.5 text-[9px] text-foreground/60 backdrop-blur">
                      {template.category}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-display text-lg leading-tight tracking-tight">
                        {template.name}
                      </h2>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-foreground/40">
                        <Star className="h-3 w-3" />
                        {template.like_count}
                      </span>
                    </div>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground/50">
                      {template.description || 'A clean, editable layout ready for your brand.'}
                    </p>

                    <div className="mt-6 flex items-center justify-between border-t border-foreground/10 pt-5">
                      <span className="mono-label text-[9px] text-foreground/35">
                        {template.download_count} uses
                      </span>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/project/new?template=${template.id}`)}
                        className="group/btn"
                      >
                        Use template
                        <ArrowUpRight className="h-3.5 w-3.5 transition group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                      </Button>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>

        <Reveal variant="scale" className="mt-20 overflow-hidden rounded-[2rem] border border-foreground/10 bg-lilac/40">
          <div className="grid gap-10 p-7 sm:p-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <Eyebrow>Something bespoke</Eyebrow>
              <h2 className="display-lg mt-4 max-w-lg">
                Need a layout that is <span className="serif text-[1.05em]">actually</span> yours?
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-foreground/60">
                We design custom card templates matched to your brand — artwork, typography and
                field placement included. Usually back in your inbox within 12–24 hours.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Button onClick={() => navigate('/project/new')}>
                  Request custom design
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
                <span className="mono-label text-[10px] text-foreground/45">From $9.00 USD</span>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { icon: Star, label: 'Matched to your brand identity' },
                { icon: LayoutTemplate, label: 'Unlimited revision rounds' },
                { icon: Clock, label: 'Delivered as a ready-to-use template' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-2xl border border-foreground/10 bg-white/60 px-5 py-4"
                >
                  <item.icon className="h-4 w-4 text-foreground/50" />
                  <span className="text-sm text-foreground/70">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </main>

      <StudioFooter />
    </div>
  );
}
