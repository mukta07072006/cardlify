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
import { toast } from 'sonner';
import { 
  Shield, 
  Users, 
  Crown,
  Clock,
  Calendar,
  Check,
  X,
  Loader2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface User {
  id: string;
  user_id: string;
  email: string;
  name: string;
  subscription_tier: 'free' | 'elite';
  elite_expiry_date: string | null;
  created_at: string;
  project_count: number;
}

export default function EliteAdmin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
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
      fetchUsers();
    }
  }, [user, isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles with their subscription info
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get project counts for each user
      const usersWithCounts = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.user_id);

          return {
            id: profile.id,
            user_id: profile.user_id,
            email: profile.email,
            name: profile.name,
            subscription_tier: profile.subscription_tier,
            elite_expiry_date: profile.elite_expiry_date,
            created_at: profile.created_at,
            project_count: count || 0,
          };
        })
      );

      setUsers(usersWithCounts);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const setEliteSubscription = async (userId: string, durationMonths: number) => {
    try {
      const now = new Date();
      const expiryDate = new Date(now.setMonth(now.getMonth() + durationMonths));
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_tier: 'elite',
          elite_expiry_date: expiryDate.toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Elite subscription activated successfully!');
      fetchUsers(); // Refresh the user list
      setSelectedUserId(null);
    } catch (error) {
      console.error('Error setting elite subscription:', error);
      toast.error('Failed to set elite subscription');
    }
  };

  const removeEliteSubscription = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_tier: 'free',
          elite_expiry_date: null
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Elite subscription removed successfully!');
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error removing elite subscription:', error);
      toast.error('Failed to remove elite subscription');
    }
  };

  const handleSetElite = async () => {
    if (!selectedUserId) return;

    const durationInMonths = durationUnit === 'month' ? selectedDuration : selectedDuration * 12;
    await setEliteSubscription(selectedUserId, durationInMonths);
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
                Cardlify <span className="text-rose-600">Elite Admin</span>
              </h1>
              <p className="text-xs text-rose-400 font-medium uppercase tracking-wider">Subscription Management</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/admin')}
            className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-full px-4"
          >
            <Shield className="w-4 h-4 mr-2" />
            Main Admin
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-10 relative z-10">
        {/* Elite Duration Management Section */}
        <div className="mb-8">
          <Card className="border-rose-100 shadow-xl shadow-rose-100/20 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100/30 border-b border-amber-100 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-100 to-amber-50 border border-amber-200 flex items-center justify-center shadow-sm">
                  <Crown className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-serif text-slate-800">Elite Subscription Management</CardTitle>
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
                  onClick={handleSetElite}
                  disabled={!selectedUserId}
                  className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-lg shadow-amber-200/50"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Set Elite Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="border-rose-100 shadow-xl shadow-rose-100/20 bg-white/90 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-white to-rose-50/30 border-b border-rose-50 px-8 py-6">
            <CardTitle className="text-xl font-serif text-slate-800">User Subscription Management</CardTitle>
            <CardDescription className="text-slate-500">
              Manage elite subscriptions for all users
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
                  <TableHead className="text-rose-900/60 font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.user_id} className="hover:bg-rose-50/40 border-rose-50 transition-colors">
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
                    <TableCell>
                      <div className="flex gap-2">
                        {u.subscription_tier === 'elite' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeEliteSubscription(u.user_id)}
                            className="rounded-full text-xs font-medium border-rose-200 text-rose-700 hover:bg-rose-50"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Remove Elite
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUserId(u.user_id);
                              setSelectedDuration(1);
                              setDurationUnit('month');
                            }}
                            className="rounded-full text-xs font-medium border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-rose-600"
                          >
                            <Crown className="w-3 h-3 mr-1" />
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
      </main>
    </div>
  );
}