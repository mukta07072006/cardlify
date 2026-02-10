import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  User,
  Crown,
  Loader2,
  ArrowLeft,
  Mail,
  Calendar,
  Save,
  Sparkles,
  Settings2
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
      setProfile(prev => prev ? { ...prev, name: editName } : null);
      toast.success('SETTINGS_UPDATED');
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setSaving(false);
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
    <div className="min-h-screen bg-[#f4f4f0] text-stone-900 font-mono uppercase selection:bg-rose-500 selection:text-white pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .font-pixel { font-family: 'Press Start 2P', cursive; }
        .pixel-card { border: 4px solid black; background: white; box-shadow: 8px 8px 0px 0px black; }
        .pixel-card-gold { border: 4px solid #b45309; background: #0c0a09; box-shadow: 8px 8px 0px 0px #b45309; }
        .pixel-input { border: 2px solid black; border-radius: 0; }
      `}</style>

      {/* Header */}
      <header className="bg-white border-b-4 border-black sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-4 group text-black">
            <div className="p-2 border-2 border-black group-hover:bg-black group-hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-pixel text-[10px]">BACK_TO_HQ</span>
          </Link>
          <img src="/cardlify.png" alt="Logo" className="h-8 object-contain" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-12">
        <div className="space-y-12">
          
          {/* Title Section */}
          <div className="space-y-2">
            <h2 className="font-pixel text-xl text-black">USER_IDENTITY</h2>
            <div className="h-1.5 w-24 bg-rose-500" />
          </div>

          {/* Subscription Status Card */}
          <div className={`p-8 transition-all ${isElite ? 'pixel-card-gold' : 'pixel-card'}`}>
            <div className="flex flex-col md:flex-row justify-between gap-8 items-start md:items-center">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 border-4 flex items-center justify-center ${isElite ? 'border-[#facc15] bg-[#facc15]/10 text-[#facc15]' : 'border-black bg-stone-100 text-black'}`}>
                  {isElite ? <Crown className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={`font-pixel text-[11px] ${isElite ? 'text-[#facc15]' : 'text-black'}`}>
                      {isElite ? 'ELITE_MEMBER' : 'BASIC_PLAN'}
                    </h3>
                    <Badge className={`rounded-none border-2 font-pixel text-[8px] ${isElite ? 'bg-[#facc15] border-white text-black' : 'bg-green-500 border-black text-white'}`}>
                      ACTIVE
                    </Badge>
                  </div>
                  <p className={`text-[10px] leading-relaxed ${isElite ? 'text-stone-400' : 'text-stone-500'}`}>
                    {isElite ? 'PREMIUM_SYSTEMS_ENGAGED: UNLIMITED_ACCESS' : 'SYSTEM_LOCKED: UPGRADE_REQUIRED_FOR_BULK'}
                  </p>
                </div>
              </div>
              
              <div className={`p-4 border-2 flex flex-col items-center min-w-[120px] ${isElite ? 'border-[#b45309] bg-stone-900 text-white' : 'border-black bg-stone-50 text-black'}`}>
                <span className="text-[8px] font-pixel opacity-60 mb-2">PROJECTS</span>
                <span className={`text-2xl font-pixel ${isElite ? 'text-[#facc15]' : 'text-black'}`}>{projectCount}</span>
              </div>
            </div>

            {!isElite && (
              <Button 
                className="w-full mt-8 rounded-none bg-black text-white hover:bg-stone-800 border-2 border-black font-pixel text-[10px] py-6 shadow-[6px_6px_0px_0px_#e11d48]"
                onClick={() => navigate('/pricing')}
              >
                <Crown className="w-4 h-4 mr-3 text-rose-500" />
                UPGRADE_MEMBERSHIP
              </Button>
            )}
          </div>

          {/* Settings Section */}
          <div className="pixel-card p-8 md:p-10 relative bg-white">
            <div className="flex items-center gap-3 mb-10 border-b-2 border-stone-100 pb-5">
              <Settings2 className="w-5 h-5 text-rose-500" />
              <h3 className="font-pixel text-[10px] text-black">CORE_SETTINGS</h3>
            </div>

            <div className="space-y-10">
              {/* Display Name Input */}
              <div className="space-y-4">
                <Label htmlFor="name" className="font-pixel text-[8px] text-stone-500">DISPLAY_NAME</Label>
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                    <Input
                      id="name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="pixel-input pl-12 h-14 font-bold bg-stone-50 border-2 border-black focus-visible:ring-0 focus-visible:border-rose-500 text-black"
                    />
                  </div>
                  <Button 
                    onClick={handleSave} 
                    disabled={saving || editName === profile?.name}
                    className="h-14 w-14 rounded-none bg-black text-white hover:bg-stone-800 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] flex items-center justify-center disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  </Button>
                </div>
              </div>

              {/* Read-only Info Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label className="font-pixel text-[8px] text-stone-500">COMMS_CHANNEL</Label>
                  <div className="flex items-center gap-4 p-4 border-2 border-stone-200 bg-stone-50/50">
                    <Mail className="w-5 h-5 text-stone-400" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold lowercase text-black">{profile?.email}</span>
                      <span className="text-[8px] text-green-600 font-pixel mt-1.5">VERIFIED</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="font-pixel text-[8px] text-stone-500">OPERATIONAL_SINCE</Label>
                  <div className="flex items-center gap-4 p-4 border-2 border-stone-200 bg-stone-50/50">
                    <Calendar className="w-5 h-5 text-stone-400" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-black">
                        {profile?.created_at && new Date(profile.created_at).toLocaleDateString('en-GB')}
                      </span>
                      <span className="text-[8px] text-stone-400 font-pixel mt-1.5">TIMESTAMP</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Link */}
          <div className="flex justify-center pt-4">
            <button className="flex items-center gap-3 px-4 py-2 border-2 border-transparent hover:border-black transition-all group">
              <img src="/cardlify.png" className="w-4 h-4 grayscale group-hover:grayscale-0" alt="Logo" />
              <span className="text-[8px] font-pixel text-stone-400 group-hover:text-black">MANAGE_BILLING_INVOICES</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}