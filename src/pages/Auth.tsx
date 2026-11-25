import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Loader2, Lock, Mail, User } from 'lucide-react';
import { z } from 'zod';
import { Eyebrow, Wordmark } from '@/components/studio';

const authSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
  name: z.string().min(2, 'At least 2 characters').optional(),
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
  const [searchParams] = useSearchParams();
  const requestedNext = searchParams.get('next');
  const destination =
    requestedNext && requestedNext.startsWith('/') && !requestedNext.startsWith('//')
      ? requestedNext
      : '/dashboard';

  useEffect(() => {
    if (user) navigate(destination);
  }, [user, navigate, destination]);

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
          toast.success('Welcome back');
          navigate(destination);
        }
      } else {
        const { error } = await signUp(email, password, name);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Account created — check your inbox');
          setIsLogin(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-5 py-6 sm:px-6">
        <Link to="/" aria-label="Cardlify home">
          <Wordmark />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-foreground/55 transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to studio
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-[1400px] flex-1 items-center gap-16 px-5 pb-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden lg:block">
          <Eyebrow>{isLogin ? 'Welcome back' : 'Start your studio'}</Eyebrow>
          <h1 className="display-xl mt-6">
            Your next 500 cards
            <br />
            start <span className="serif text-[1.05em]">here.</span>
          </h1>
          <p className="mt-7 max-w-md text-base leading-relaxed text-foreground/55">
            One account gives you the template editor, unlimited participant links and the whole
            export pipeline. No design software, no spreadsheets.
          </p>

          <ul className="mt-10 space-y-4">
            {[
              '100 free cards on the free plan',
              'Participants never need an account',
              'Every card private until you share it',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-foreground/70">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-lime">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-12 max-w-sm rounded-3xl border border-foreground/10 bg-lilac/40 p-6">
            <p className="text-sm leading-relaxed text-foreground/70">
              “We printed 340 conference badges in an afternoon. The layout never moved once.”
            </p>
            <p className="mono-label mt-4 text-[10px] text-foreground/45">
              Salim Ullah · Design Guild
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="surface p-6 sm:p-9">
            <div className="flex rounded-full border border-foreground/10 bg-background/60 p-1.5">
              {[
                { label: 'Sign in', value: true },
                { label: 'Create account', value: false },
              ].map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => {
                    setIsLogin(tab.value);
                    setErrors({});
                  }}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                    isLogin === tab.value
                      ? 'bg-foreground text-paper'
                      : 'text-foreground/55 hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-8">
              <h2 className="display-md">
                {isLogin ? 'Sign in to Cardlify' : 'Create your account'}
              </h2>
              <p className="mt-2 text-sm text-foreground/50">
                {isLogin
                  ? 'Pick up where your last batch left off.'
                  : 'Free forever for one project and 100 cards.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="mono-label text-foreground/45">
                    Full name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/30" />
                    <Input
                      id="name"
                      placeholder="Ayesha Rahman"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 rounded-xl border-foreground/15 bg-white/70 pl-11"
                    />
                  </div>
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="mono-label text-foreground/45">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/30" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@studio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl border-foreground/15 bg-white/70 pl-11"
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="mono-label text-foreground/45">
                    Password
                  </Label>
                  {isLogin && (
                    <span className="text-[11px] text-foreground/35">Min. 6 characters</span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/30" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl border-foreground/15 bg-white/70 pl-11"
                  />
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <Button type="submit" size="lg" disabled={loading} className="group w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Working…
                  </>
                ) : (
                  <>
                    {isLogin ? 'Continue' : 'Create account'}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-7 flex items-center gap-3">
              <span className="h-px flex-1 bg-foreground/10" />
              <span className="mono-label text-[9px] text-foreground/30">or</span>
              <span className="h-px flex-1 bg-foreground/10" />
            </div>

            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="mt-5 w-full text-center text-sm text-foreground/55 transition hover:text-foreground"
            >
              {isLogin ? 'New here? Create an account' : 'Already have an account? Sign in'}
            </button>
          </div>

          <p className="mono-label mt-6 text-center text-[9px] text-foreground/30">
            Secure by default · powered by Supabase
          </p>
        </div>
      </main>
    </div>
  );
}
