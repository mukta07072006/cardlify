import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SharedHeader from '@/components/SharedHeader';
import { Eyebrow, StudioFooter } from '@/components/studio';
import { toast } from 'sonner';
import {
  Crown,
  Loader2,
  Mail,
  Calendar,
  Save,
  Check,
  ArrowUpRight,
  User,
} from 'lucide-react';

interface ProfileData {
  name: string;
  email: string;
  created_at: string;
}

export default function Profile() {
  const { user, authLoading } = useAuth();
  const { isElite, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [projectCount, setProjectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchProjectCount();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, email, created_at')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setEditName(data.name);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectCount = async () => {
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id);
    setProjectCount(count || 0);
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: editName })
        .eq('user_id', user?.id);

      if (error) throw error;
      setProfile((prev) => (prev ? { ...prev, name: editName } : null));
      toast.success('Profile updated');
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setSaving(false);
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
    <div className="min-h-screen bg-background">
      <SharedHeader />

      <main className="mx-auto max-w-[1150px] px-5 py-12 sm:px-6 lg:py-16">
        <Eyebrow>Account</Eyebrow>
        <h1 className="display-lg mt-4">
          Your <span className="serif text-[1.05em]">profile.</span>
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-foreground/55">
          Manage how you appear on projects, check your plan, and update your display name.
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div
            className={`flex flex-col rounded-[1.75rem] border p-7 ${
              isElite
                ? 'border-foreground/15 bg-foreground text-paper'
                : 'border-foreground/10 bg-white/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`mono-label rounded-full px-3 py-1.5 text-[9px] ${
                  isElite ? 'bg-lime text-foreground' : 'border border-foreground/15 text-foreground/45'
                }`}
              >
                {isElite ? 'Elite member' : 'Free plan'}
              </span>
              {isElite ? (
                <Crown className="h-4 w-4 text-lime" />
              ) : (
                <User className="h-4 w-4 text-foreground/30" />
              )}
            </div>

            <p className={`mt-8 text-sm leading-relaxed ${isElite ? 'text-paper/60' : 'text-foreground/50'}`}>
              {isElite
                ? 'Unlimited projects and generations are unlocked on this account.'
                : 'One active project and 100 card generations on the free plan.'}
            </p>

            <div className={`mt-6 flex items-baseline gap-3 border-t pt-6 ${isElite ? 'border-paper/10' : 'border-foreground/10'}`}>
              <span className="font-display text-4xl tracking-tight">{projectCount}</span>
              <span className={`mono-label text-[10px] ${isElite ? 'text-paper/40' : 'text-foreground/35'}`}>
                projects created
              </span>
            </div>

            {!isElite && (
              <Button className="mt-6 w-full" onClick={() => navigate('/pricing')}>
                <Crown className="h-4 w-4" />
                Upgrade membership
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="surface p-7">
            <h2 className="display-md">Settings</h2>
            <p className="mt-2 text-sm text-foreground/50">
              This is the name organisers and participants will see.
            </p>

            <div className="mt-8 space-y-2">
              <Label htmlFor="name" className="mono-label text-foreground/45">
                Display name
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/30" />
                  <Input
                    id="name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-12 rounded-xl border-foreground/15 bg-white/70 pl-11"
                  />
                </div>
                <Button
                  onClick={handleSave}
                  disabled={saving || editName === profile?.name}
                  className="h-12 px-5"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span className="sr-only">Save name</span>
                </Button>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-foreground/10 bg-background/50 p-5">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-foreground/35" />
                  <span className="mono-label text-[9px] text-foreground/35">Email</span>
                </div>
                <p className="mt-3 truncate text-sm font-medium">{profile?.email}</p>
                <span className="mt-2 flex items-center gap-1 text-[11px] text-foreground/45">
                  <Check className="h-3 w-3" /> Verified
                </span>
              </div>

              <div className="rounded-2xl border border-foreground/10 bg-background/50 p-5">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-foreground/35" />
                  <span className="mono-label text-[9px] text-foreground/35">Member since</span>
                </div>
                <p className="mt-3 text-sm font-medium">
                  {profile?.created_at &&
                    new Date(profile.created_at).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                </p>
                <span className="mono-label mt-2 block text-[9px] text-foreground/30">Cardlify studio</span>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-foreground/10 pt-6">
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
                Back to dashboard
              </Button>
              <button
                type="button"
                onClick={() => navigate('/pricing')}
                className="text-xs text-foreground/40 underline-offset-4 hover:text-foreground hover:underline"
              >
                Manage billing
              </button>
            </div>
          </div>
        </div>
      </main>

      <StudioFooter />
    </div>
  );
}
