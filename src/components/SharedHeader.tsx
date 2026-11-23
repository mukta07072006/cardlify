import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Wordmark } from '@/components/studio';
import { ScrollProgress } from '@/components/scroll';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Studio', path: '/' },
  { label: 'Templates', path: '/templates' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'Lovely People', path: '/lovelypeoples' },
];

export default function SharedHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = user ? [...NAV_LINKS, { label: 'Dashboard', path: '/dashboard' }] : NAV_LINKS;

  return (
    <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between px-5 sm:px-6">
        <Link to="/" aria-label="Cardlify home" className="shrink-0">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-foreground/10 bg-white/50 p-1.5 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/'}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-4 py-2 text-[13px] font-medium transition-colors',
                  isActive
                    ? 'bg-foreground text-paper'
                    : 'text-foreground/60 hover:bg-foreground/[0.06] hover:text-foreground',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
                Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await signOut();
                  navigate('/');
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="px-4 py-2 text-[13px] font-medium text-foreground/60 transition hover:text-foreground"
              >
                Log in
              </Link>
              <Button size="sm" onClick={() => navigate('/auth')} className="group">
                Start free
                <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-full border border-foreground/15 md:hidden"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-foreground/10 bg-background px-5 pb-6 pt-4 md:hidden">
          <div className="flex flex-col">
            {links.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'border-b border-foreground/10 py-3 text-lg tracking-tight',
                    isActive ? 'text-foreground' : 'text-foreground/55',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            {user ? (
              <>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setOpen(false); navigate('/profile'); }}>
                  Profile
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={async () => {
                    setOpen(false);
                    await signOut();
                    navigate('/');
                  }}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setOpen(false); navigate('/auth'); }}>
                  Log in
                </Button>
                <Button size="sm" className="flex-1" onClick={() => { setOpen(false); navigate('/auth'); }}>
                  Start free
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      <ScrollProgress />
    </header>
  );
}
