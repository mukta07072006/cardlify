import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import SharedHeader from '@/components/SharedHeader';
import { Eyebrow, StudioFooter } from '@/components/studio';
import { Reveal } from '@/components/scroll';
import { Check, Crown, Layers, Users, ArrowUpRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type PlanKey = 'free' | 'elite' | 'studio';
type EliteState = 'loading' | 'available' | 'claimed' | 'active';

const PLANS: {
  key: PlanKey;
  name: string;
  price: string;
  note?: string;
  description: string;
  features: string[];
  icon: typeof Users;
  popular: boolean;
  cta: string;
  enabled: boolean;
}[] = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    note: '/ month',
    description: 'One project, one template and 100 cards — enough for a first batch.',
    features: [
      '1 active project',
      '100 card generations',
      'Emails for the first 100 responses',
      'Full template editor',
    ],
    icon: Users,
    popular: false,
    cta: 'Start free',
    enabled: true,
  },
  {
    key: 'elite',
    name: 'Elite',
    price: '$0',
    note: '/ first month',
    description: 'Everything unlocked for a month, on us. No card and no waitlist.',
    features: [
      'Unlimited projects',
      'Unlimited generations',
      'A confirmation email per response',
      'Your own sender name',
      'No Cardlify watermark',
    ],
    icon: Crown,
    popular: true,
    cta: 'Get 1 month free Elite',
    enabled: true,
  },
  {
    key: 'studio',
    name: 'Studio',
    price: 'Soon',
    description: 'For agencies and teams running cards for several clients at once.',
    features: ['Team collaboration', 'API access', 'White-label links', 'Dedicated manager'],
    icon: Layers,
    popular: false,
    cta: 'Talk to us',
    enabled: false,
  },
];

const FAQS = [
  {
    q: 'What does the free month include?',
    a: 'Everything Elite has: unlimited projects, unlimited generations, your own sender name, a confirmation email for every response and no Cardlify watermark. It is free for one month, one per account, no card needed.',
  },
  {
    q: 'What happens when the month ends?',
    a: 'Your account drops back to the Free plan. Projects, forms and responses stay, and Free still sends confirmation emails for the first 100 registrations of each project.',
  },
  {
    q: 'Do free projects send confirmation emails?',
    a: 'Yes. The first 100 registrations of every project get the branded email with their serial code. Elite keeps them going for every response.',
  },
  {
    q: 'Which payments do you accept?',
    a: 'bKash, Nagad and all major cards are supported.',
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [eliteState, setEliteState] = useState<EliteState>(user ? 'loading' : 'available');
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!user) {
      setEliteState('available');
      return;
    }

    let cancelled = false;

    const loadClaimState = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('subscription_tier, elite_expiry_date, elite_trial_started_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;

      const active =
        data?.subscription_tier === 'elite' &&
        (!data.elite_expiry_date || new Date(data.elite_expiry_date).getTime() > Date.now());

      setEliteState(active ? 'active' : data?.elite_trial_started_at ? 'claimed' : 'available');
    };

    loadClaimState();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const claimFreeMonth = async () => {
    if (!user) {
      navigate('/auth?next=/pricing');
      return;
    }
    if (claiming || eliteState === 'claimed') return;
    if (eliteState === 'active') {
      navigate('/dashboard');
      return;
    }

    setClaiming(true);
    try {
      const { data, error } = await supabase.rpc('claim_elite_trial');

      if (error) {
        if (error.message?.includes('trial_already_claimed')) {
          setEliteState('claimed');
          toast.error('Your free month has already been claimed.');
        } else {
          toast.error('Could not start your free month. Please try again.');
        }
        return;
      }

      const alreadyActive = Boolean((data as { already_active?: boolean } | null)?.already_active);
      setEliteState('active');
      toast.success(
        alreadyActive
          ? 'Elite is already active on your account.'
          : 'Your free month of Elite is active — every feature is unlocked.',
      );
      navigate('/dashboard');
    } catch {
      toast.error('Could not start your free month. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  const selectPlan = (key: PlanKey) => {
    if (key === 'elite') {
      claimFreeMonth();
      return;
    }
    if (key === 'free') navigate(user ? '/dashboard' : '/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />

      <main className="mx-auto max-w-[1400px] px-5 pb-24 pt-12 sm:px-6 lg:pt-16">
        <Reveal variant="up" className="max-w-2xl">
          <Eyebrow>Plans</Eyebrow>
          <h1 className="display-xl mt-5">
            Simple plans for
            <br />
            <span className="serif text-[1.05em]">serious batches.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-foreground/55">
            Every account starts with a free month of Elite — no waitlist, no card. After that, the
            Free plan still sends confirmation emails for the first 100 registrations of each
            project.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {PLANS.map((plan, i) => {
            const isElitePlan = plan.key === 'elite';
            const busy = isElitePlan && (claiming || eliteState === 'loading');
            const label = isElitePlan
              ? eliteState === 'active'
                ? 'Elite is active'
                : eliteState === 'claimed'
                  ? 'Free month claimed'
                  : plan.cta
              : plan.cta;

            return (
              <Reveal
                key={plan.name}
                delay={i * 110}
                className={`hover-lift relative flex flex-col rounded-[1.75rem] border p-7 sm:p-8 ${
                  plan.popular
                    ? 'border-foreground/15 bg-foreground text-paper'
                    : 'border-foreground/10 bg-white/60'
                }`}
              >
                {plan.popular && (
                  <span className="mono-label absolute right-6 top-6 rounded-full bg-lime px-3 py-1.5 text-[9px] text-foreground">
                    1 month free
                  </span>
                )}

                <div
                  className={`grid h-11 w-11 place-items-center rounded-2xl ${
                    plan.popular ? 'bg-paper/10 text-lime' : 'bg-secondary text-foreground/70'
                  }`}
                >
                  <plan.icon className="h-5 w-5" />
                </div>

                <h2 className="mt-6 font-display text-xl tracking-tight">{plan.name}</h2>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-display text-4xl tracking-tight">{plan.price}</span>
                  {plan.note && (
                    <span
                      className={`text-xs ${plan.popular ? 'text-paper/45' : 'text-foreground/40'}`}
                    >
                      {plan.note}
                    </span>
                  )}
                </div>
                <p
                  className={`mt-3 text-sm leading-relaxed ${
                    plan.popular ? 'text-paper/55' : 'text-foreground/50'
                  }`}
                >
                  {plan.description}
                </p>

                <ul
                  className={`mt-7 space-y-3 border-t pt-6 text-sm ${
                    plan.popular ? 'border-paper/10' : 'border-foreground/10'
                  }`}
                >
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          plan.popular ? 'text-lime' : 'text-foreground/45'
                        }`}
                      />
                      <span className={plan.popular ? 'text-paper/75' : 'text-foreground/70'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  disabled={!plan.enabled || busy || (isElitePlan && eliteState === 'claimed')}
                  onClick={() => selectPlan(plan.key)}
                  variant={plan.popular ? 'accent' : 'outline'}
                  className="mt-8 w-full"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
                  {plan.enabled && !busy && <ArrowUpRight className="h-4 w-4" />}
                </Button>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-20 grid gap-10 border-t border-foreground/10 pt-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal variant="up">
            <Eyebrow>Billing questions</Eyebrow>
            <h2 className="display-lg mt-4">
              Before you <span className="serif text-[1.05em]">commit.</span>
            </h2>
          </Reveal>
          <div>
            {FAQS.map((faq, i) => (
              <Reveal key={faq.q} delay={i * 80} className="border-b border-foreground/10 py-6 last:border-0">
                <h3 className="text-[15px] font-medium tracking-tight">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/55">{faq.a}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </main>

      <StudioFooter />
    </div>
  );
}
