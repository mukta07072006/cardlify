import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

const NAV_LINKS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Profile', path: '/profile' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'Templates', path: '/templates' },
  { label: 'Support', path: '#' },
];

export default function SharedHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="relative z-50 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
      <Link to="/">
        <img src="/cardlify.png" alt="Cardlify Logo" className="h-10" />
      </Link>

      <div className="flex items-center gap-4 text-sm font-semibold">
        {user ? (
          <>
            {NAV_LINKS.map((link) => (
              <Button
                key={link.label}
                variant="ghost"
                size="sm"
                onClick={() => navigate(link.path)}
                className="text-stone-600 hover:text-rose-500"
              >
                {link.label}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={signOut} className="ml-2">
              Sign Out
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-6">
            <Link to="/auth" className="text-stone-500 hover:text-rose-500">Log in</Link>
            <Button onClick={() => navigate('/auth')} className="bg-stone-900 rounded-full px-6">
              Get Started
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}