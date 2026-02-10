import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import SharedHeader from '@/components/SharedHeader'; // Ensuring header stays
import { Check, Star, Crown, Users, Layers } from 'lucide-react';

const PLANS = [
  {
    name: 'LVL_1: FREE',
    price: '$0',
    description: 'Basic equipment for new players.',
    features: ['1 PROJECT', '100 CARDS', 'BASIC EDITOR', 'SUPPORT'],
    icon: Users,
    popular: false
  },
  {
    name: 'LVL_99: ELITE',
    price: 'SOON',
    description: 'God-tier specs for power users.',
    features: ['UNLIMITED XP', 'PRO EDITOR', 'PRIORITY DMG', 'CUSTOM BRAND'],
    icon: Crown,
    popular: true
  },
  {
    name: 'GUILD: BIZ',
    price: 'SOON',
    description: 'For massive raiding parties.',
    features: ['TEAM CO-OP', 'API ACCESS', 'WHITE LABEL', 'MANAGER'],
    icon: Layers,
    popular: false
  }
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f4f4f0] text-stone-900 font-mono uppercase selection:bg-rose-500 selection:text-white">
      {/* Shared Header stays at the top */}
      <SharedHeader />

      {/* Retro Paper Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/fake-brick.png')] z-0" />

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-32">
        {/* Title Section */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter">
            SELECT <span className="text-rose-600 bg-rose-100 px-2">PLAN_</span>
          </h1>
          <p className="text-stone-500 text-sm max-w-md mx-auto border-2 border-dashed border-stone-300 p-2">
            [!] CHOOSE WISELY. HIGHER LEVELS UNLOCK BETTER LOOT.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PLANS.map((plan, i) => (
            <div 
              key={i}
              className={`relative bg-white border-4 p-8 transition-all hover:-translate-x-1 hover:-translate-y-1 ${
                plan.popular 
                  ? 'border-rose-600 shadow-[8px_8px_0px_0px_#e11d48]' 
                  : 'border-black shadow-[8px_8px_0px_0px_#000]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-rose-600 text-white px-4 py-1 text-xs font-bold border-2 border-black">
                  POPULAR_PICK
                </div>
              )}

              <div className="text-center mb-8">
                <div className={`inline-block p-2 border-2 mb-4 ${plan.popular ? 'bg-rose-100 border-rose-600' : 'bg-stone-100 border-black'}`}>
                  <plan.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black mb-2">{plan.name}</h3>
                <div className="text-4xl font-black mb-1 tracking-tighter">
                  {plan.price}
                </div>
                <p className="text-[10px] text-stone-400 leading-tight italic">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-10 border-t-2 border-stone-100 pt-6">
                {plan.features.map((feat, index) => (
                  <li key={index} className="flex items-center gap-3 text-xs font-bold">
                    <span className={plan.popular ? 'text-rose-600' : 'text-green-600'}>▶</span>
                    {feat}
                  </li>
                ))}
              </ul>

              <Button 
                disabled={plan.price === 'SOON'}
                className={`w-full h-14 text-xs font-black border-2 border-b-6 active:border-b-2 active:translate-y-1 transition-all ${
                  plan.popular 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-900' 
                    : 'bg-white hover:bg-stone-50 text-black border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]'
                }`}
              >
                {plan.price === 'SOON' ? 'LOCKED_AREA' : 'JOIN_NOW'}
              </Button>
            </div>
          ))}
        </div>

        {/* FAQ - Pixelated Light Style */}
        <div className="mt-32 max-w-3xl mx-auto">
          <div className="border-4 border-black bg-stone-100 p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-black mb-8 text-center border-b-4 border-black pb-4">HELP_FILES (FAQ)</h2>
            <div className="grid gap-6">
              {[
                { q: "CAN I UPGRADE?", a: "YES. XP CARRIES OVER TO HIGHER PLANS." },
                { q: "LOCAL PAYMENTS?", a: "BKASH, NAGAD, AND CARDS SUPPORTED." },
                { q: "CANCEL ANYTIME?", a: "YES. NO CANCELLATION DEBUFFS." }
              ].map((faq, i) => (
                <div key={i} className="border-b-2 border-stone-300 pb-4 last:border-0">
                  <h4 className="font-black text-rose-600">{`? ${faq.q}`}</h4>
                  <p className="text-xs font-medium text-stone-500 mt-1">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}