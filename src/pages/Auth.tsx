import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Sparkles, User, Mail, Lock } from 'lucide-react';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('INVALID_EMAIL'),
  password: z.string().min(6, 'MIN_6_CHARS'),
  name: z.string().min(2, 'MIN_2_CHARS').optional(),
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
    document.fonts.load('10pt "Press Start 2P"');
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
          toast.error(error.message);
        } else {
          toast.success('SYSTEM_READY: ACCESS_GRANTED');
          navigate('/dashboard');
        }
      } else {
        const { error } = await signUp(email, password, name);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('ACCOUNT_CREATED: VERIFY_EMAIL');
          setIsLogin(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative bg-[#f4f4f0] text-black font-mono uppercase flex items-center justify-center p-4 overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .font-pixel { font-family: 'Press Start 2P', cursive; }
        
        .pixel-card {
          background: white;
          border: 4px solid black;
          box-shadow: 12px 12px 0px 0px rgba(0,0,0,1);
        }

        .pixel-btn-black {
          background: black;
          color: white;
          border: 4px solid black;
          box-shadow: 4px 4px 0px 0px #f43f5e;
          transition: all 0.1s;
        }
        .pixel-btn-black:active {
          transform: translate(2px, 2px);
          box-shadow: 0px 0px 0px 0px black;
        }

        .pixel-input {
          border: 4px solid black !important;
          background: #fdfdfd !important;
          border-radius: 0 !important;
          font-family: 'Press Start 2P', cursive;
          font-size: 8px !important;
        }

        @keyframes step-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-step-float { animation: step-float 4s steps(4) infinite; }

        .bg-grid {
          background-size: 40px 40px;
          background-image: radial-gradient(circle, #000 1px, transparent 1px);
          opacity: 0.1;
        }
      `}</style>

      {/* Pixelated Background Elements */}
      <div className="fixed inset-0 bg-grid z-0" />
      <div className="fixed top-20 right-20 w-32 h-32 bg-rose-500/10 border-4 border-black -rotate-12 z-0" />
      <div className="fixed bottom-20 left-20 w-24 h-24 bg-black/5 border-4 border-black rotate-12 z-0" />

      {/* Back to Home Link */}
      <Link to="/" className="absolute top-8 left-8 z-50 flex items-center gap-2 text-black hover:text-rose-500 transition-colors font-pixel text-[8px]">
        <ArrowLeft className="w-4 h-4" />
        <span>BACK_TO_HOME</span>
      </Link>

      {/* Main Container */}
      <div className="w-full max-w-[1000px] grid lg:grid-cols-2 gap-16 items-center relative z-10">
        
        {/* Left Side: Visual/Branding */}
        <div className="hidden lg:flex flex-col justify-center items-start space-y-12">
            <div className="relative">
                <div className="relative z-10 bg-white p-2 border-4 border-black shadow-[10px_10px_0px_0px_#f43f5e] animate-step-float max-w-[280px]">
                    <img 
                        src="https://images.unsplash.com/photo-1542598953-41310c43f54b?q=80&w=2070&auto=format&fit=crop" 
                        alt="Visual" 
                        className="w-full h-auto object-cover aspect-[3/4] grayscale contrast-125"
                    />
                    <div className="absolute -bottom-6 -right-6 bg-black text-white p-3 border-4 border-white shadow-lg flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-rose-500" />
                        <span className="font-pixel text-[7px]">2K_USERS_ACTIVE</span>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="font-pixel text-3xl leading-tight text-black">
                    STUDIO_<br/>
                    <span className="text-rose-500 italic">ACCESS.</span>
                </h2>
                <p className="text-stone-500 font-pixel text-[8px] max-w-xs leading-loose">
                    &gt; INITIALIZING_ID_GENERATOR...<br/>
                    &gt; MINT_CARDS_IN_SECONDS.
                </p>
            </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="w-full max-w-md mx-auto">
            <div className="pixel-card p-8 md:p-10 relative overflow-hidden">
                
                {/* Form Header */}
                <div className="text-center mb-10 relative z-10">
                    <div className="inline-flex items-center justify-center w-auto h-auto mb-6">
                        <img 
                          src="/cardlify.png" 
                          alt="Logo" 
                          className="w-40 h-auto object-contain"
                        />
                    </div>
                    <h1 className="font-pixel text-lg text-black mb-4 uppercase">
                        {isLogin ? 'USER_SIGN_IN' : 'CREATE_ID'}
                    </h1>
                    <div className="h-1 w-20 bg-black mx-auto mb-4" />
                </div>

                {/* The Form */}
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    
                    {!isLogin && (
                        <div className="space-y-2">
                            <Label className="font-pixel text-[7px] text-stone-400">FULL_NAME</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                                <Input
                                    placeholder="TYPE_NAME..."
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="pixel-input pl-10 h-12"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="font-pixel text-[7px] text-stone-400">EMAIL_ADDRESS</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                            <Input
                                type="email"
                                placeholder="USER@DOMAIN.COM"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pixel-input pl-10 h-12"
                            />
                        </div>
                        {errors.email && <p className="font-pixel text-[6px] text-rose-500">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label className="font-pixel text-[7px] text-stone-400">SECURITY_KEY</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                            <Input
                                type="password"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pixel-input pl-10 h-12"
                            />
                        </div>
                    </div>

                    <Button 
                        type="submit" 
                        disabled={loading}
                        className="w-full h-14 rounded-none font-pixel text-[9px] pixel-btn-black uppercase"
                    >
                        {loading ? 'PROCESSING...' : (isLogin ? 'LOGIN_NOW' : 'MINT_ACCOUNT')}
                    </Button>
                </form>

                {/* Toggle Link */}
                <div className="mt-10 pt-6 border-t-4 border-stone-100 text-center relative z-10">
                    <button
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setErrors({});
                        }}
                        className="font-pixel text-[8px] text-black hover:text-rose-500 transition-colors uppercase underline underline-offset-8"
                    >
                        {isLogin ? "NEW_ENTRY?_REGISTER" : "HAVE_ID?_SIGN_IN"}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}