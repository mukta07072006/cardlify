import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CreditCard, Loader2, ArrowLeft, Sparkles, User, Mail, Lock } from 'lucide-react';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateForm = () => {
    try {
      if (isLogin) {
        authSchema.pick({ email: true, password: true }).parse({ email, password });
      } else {
        authSchema.parse({ email, password, name });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string; name?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as 'email' | 'password' | 'name'] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password. Please try again.');
          } else if (error.message.includes('Email not confirmed')) {
            toast.error('Please verify your email before signing in.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Welcome back!');
          navigate('/dashboard');
        }
      } else {
        const { error } = await signUp(email, password, name);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Please sign in instead.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Account created! Please check your email to verify your account.');
          setIsLogin(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative bg-stone-50 text-stone-900 selection:bg-rose-100 flex items-center justify-center p-4 overflow-x-hidden">
      {/* Import Fancy Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');
        .font-fancy { font-family: 'Playfair Display', serif; }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(3deg); }
          50% { transform: translateY(-15px) rotate(6deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>

      {/* Global Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.15] mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')] z-[60]" />

      {/* Abstract Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-rose-200/40 rounded-full blur-[100px] animate-pulse" />
         <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-stone-200/60 rounded-full blur-[100px]" />
      </div>

      {/* Back to Home Link */}
      <Link to="/" className="absolute top-8 left-8 z-50 flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm tracking-wide">Back to Home</span>
      </Link>

      {/* Main Container */}
      <div className="w-full max-w-[1000px] grid lg:grid-cols-2 gap-8 items-center relative z-10">
        
        {/* Left Side: Visual/Branding (Hidden on mobile) */}
        <div className="hidden lg:flex flex-col justify-center items-start space-y-8 pr-12">
            <div className="relative">
                <div className="relative z-10 bg-white p-4 rounded-3xl shadow-2xl border-[8px] border-white animate-float rotate-3 max-w-[280px]">
                    <img 
                        src="https://images.unsplash.com/photo-1542598953-41310c43f54b?q=80&w=2070&auto=format&fit=crop" 
                        alt="Visual" 
                        className="rounded-2xl w-full h-auto object-cover aspect-[3/4]"
                    />
                    <div className="absolute -bottom-6 -right-6 bg-stone-900 text-white p-4 rounded-2xl shadow-lg flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-rose-400" />
                        <span className="font-bold text-sm">Join 2k+ Creators</span>
                    </div>
                </div>
                {/* Decorative background shape behind image */}
                <div className="absolute top-10 left-10 w-full h-full bg-rose-100 rounded-[2.5rem] -z-10 rotate-6" />
            </div>

            <div className="pt-8">
                <h2 className="font-fancy text-5xl font-bold leading-tight text-stone-900">
                    Your studio <br/>
                    <span className="italic text-rose-500">awaiting.</span>
                </h2>
                <p className="mt-4 text-stone-500 text-lg max-w-xs leading-relaxed">
                    Create, manage, and distribute thousands of ID cards in minutes.
                </p>
            </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="w-full max-w-md mx-auto">
            <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl shadow-stone-200/50 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden">
                
                {/* Form Header */}
                <div className="text-center mb-10 relative z-10">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-rose-500 rounded-2xl shadow-lg shadow-rose-200 mb-6 rotate-[-6deg] hover:rotate-0 transition-transform duration-300">
                        <img 
                          src="/cardlify.png" 
                          alt="Cardlify Logo" 
                          className="w-7 h-7 object-contain"
                        />
                    </div>
                    <h1 className="font-fancy text-3xl font-bold text-stone-900 mb-2">
                        {isLogin ? 'Welcome back' : 'Start crafting'}
                    </h1>
                    <p className="text-stone-500 text-sm">
                        {isLogin ? 'Enter your details to access your workspace.' : 'Create your account to get started.'}
                    </p>
                </div>

                {/* The Form */}
                <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                    
                    {!isLogin && (
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-stone-400 ml-1">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 h-5 w-5 text-stone-400" />
                                <Input
                                    id="name"
                                    placeholder=" Your Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={loading}
                                    className="pl-12 h-12 rounded-xl bg-stone-50 border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-stone-800"
                                />
                            </div>
                            {errors.name && <p className="text-xs text-rose-500 font-medium ml-1">{errors.name}</p>}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-stone-400 ml-1">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 h-5 w-5 text-stone-400" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                className="pl-12 h-12 rounded-xl bg-stone-50 border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-stone-800"
                            />
                        </div>
                        {errors.email && <p className="text-xs text-rose-500 font-medium ml-1">{errors.email}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-stone-400 ml-1">Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 h-5 w-5 text-stone-400" />
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                className="pl-12 h-12 rounded-xl bg-stone-50 border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-stone-800"
                            />
                        </div>
                        {errors.password && <p className="text-xs text-rose-500 font-medium ml-1">{errors.password}</p>}
                    </div>

                    <Button 
                        type="submit" 
                        disabled={loading}
                        className="w-full h-12 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold shadow-lg shadow-stone-900/20 hover:shadow-xl hover:shadow-stone-900/30 transition-all duration-300 mt-2"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
                                <span>Processing...</span>
                            </div>
                        ) : (
                            isLogin ? 'Sign In' : 'Create Account'
                        )}
                    </Button>
                </form>

                {/* Footer / Toggle */}
                <div className="mt-8 pt-6 border-t border-stone-100 text-center relative z-10">
                    <p className="text-stone-500 text-sm">
                        {isLogin ? "New to Cardlify?" : "Already have an account?"}
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setErrors({});
                        }}
                        className="mt-2 text-base font-bold text-stone-900 hover:text-rose-500 transition-colors font-fancy underline underline-offset-4 decoration-stone-200 hover:decoration-rose-300"
                    >
                        {isLogin ? "Create an account" : "Sign in to account"}
                    </button>
                </div>

                {/* Decorative sheen inside the card */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-gradient-to-br from-rose-50/50 to-transparent rounded-full blur-2xl pointer-events-none" />
            </div>
        </div>
      </div>
    </div>
  );
}