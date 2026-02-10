import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Profile', path: '/profile' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'Lovely_Peoples', path: '/lovelypeoples' },
  { label: 'Support', path: '#' },
];

function LovelyButton({ label, onClick }: { label: string; onClick: () => void }) {
  const [hearts, setHearts] = useState<{ id: number; x: number; delay: number }[]>([]);

  const spawnHearts = () => {
    const newHearts = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100 - 50, 
      delay: i * 0.08,             
    }));
    
    setHearts((prev) => [...prev, ...newHearts]);
    
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => !newHearts.find(nh => nh.id === h.id)));
    }, 2000);
  };

  return (
    <div className="relative inline-block">
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ y: 0, opacity: 1, scale: 0.5 }}
            animate={{ y: -70, opacity: 0, scale: 1.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: heart.delay }}
            className="absolute left-1/2 -translate-x-1/2 text-pink-500 pointer-events-none"
            style={{ left: `calc(50% + ${heart.x}px)` }}
          >
            <Heart size={18} fill="currentColor" />
          </motion.div>
        ))}
      </AnimatePresence>

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          spawnHearts();
          onClick();
        }}
        onMouseEnter={spawnHearts}
        className="
          bg-pink-50 border-pink-200 text-pink-600 font-bold
          hover:bg-pink-100 hover:border-pink-300 hover:text-pink-700
          shadow-[0_0_10px_rgba(252,231,243,0.8)]
          transition-all duration-300 group rounded-full px-5
        "
      >
        <Heart size={14} className="mr-2 fill-pink-500 group-hover:animate-pulse" />
        {label.replace('_', ' ')}
      </Button>
    </div>
  );
}

export default function SharedHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="relative z-50 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
      <Link to="/">
        <img src="/cardlify.png" alt="Cardlify Logo" className="h-auto w-40" />
      </Link>

      <div className="flex items-center gap-4 text-sm font-semibold">
        {user ? (
          <>
            {NAV_LINKS.map((link) => {
              if (link.label === 'Lovely_Peoples') {
                return (
                  <LovelyButton
                    key={link.label}
                    label={link.label}
                    onClick={() => navigate(link.path)}
                  />
                );
              }

              return (
                <Button
                  key={link.label}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(link.path)}
                  className="text-stone-600 hover:text-pink-500 hover:bg-pink-50/50"
                >
                  {link.label}
                </Button>
              );
            })}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                signOut();
                navigate('/');
              }} 
              className="ml-2 border-stone-200 hover:bg-stone-50"
            >
              Sign Out
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-6">
            <Link to="/auth" className="text-stone-500 hover:text-pink-500">Log in</Link>
            <Button 
              onClick={() => navigate('/auth')} 
              className="bg-pink-600 hover:bg-pink-700 text-white rounded-full px-6 shadow-md"
            >
              Get Started
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}