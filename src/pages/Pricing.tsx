import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import SharedHeader from '@/components/SharedHeader';
import { Eyebrow, StudioFooter } from '@/components/studio';
import { Reveal } from '@/components/scroll';
import { Check, Crown, Layers, Users, ArrowUpRight } from 'lucide-react';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    description: 'One project, one template and 100 cards — enough for a first batch.',
    features: ['1 active project', '100 card generations', 'Full template editor', 'Community support'],
    icon: Users,
    popular: false,
    cta: 'Start free',
  },
  {
    name: 'Elite',
    price: 'Soon',
    description: 'For organisers shipping batches every month. Unlimited projects, priority help.',
    features: ['Unlimited projects', 'Unlimited generations', 'Pro editor controls', 'Custom branding'],
    icon: Crown,
    popular: true,
    cta: 'Join the waitlist',
  },
  {
    name: 'Studio',
    price: 'Soon',
    description: 'For agencies and teams running cards for several clients at once.',
    features: ['Team collaboration', 'API access', 'White-label links', 'Dedicated manager'],
    icon: Layers,
    popular: false,
    cta: 'Talk to us',
  },
];

const FAQS = [
  { q: 'Can I upgrade later?', a: 'Yes. Your projects and submissions carry over to a higher plan.' },
  { q: 'Which payments do you accept?', a: 'bKash, Nagad and all major cards are supported.' },
  { q: 'Can I cancel anytime?', a: 'Yes. There is no cancellation fee and your data stays yours.' },
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSelect = (price: string) => {
    if (price === 'Soon') return;
    navigate(user ? '/dashboard' : '/auth');
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
            Start with a hundred cards, upgrade when the next event gets bigger. Every plan includes
            the full editor and unlimited participants.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {PLANS.map((plan, i) => (
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
                  Most picked
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
                {plan.price !== 'Soon' && (
                  <span className={`text-xs ${plan.popular ? 'text-paper/45' : 'text-foreground/40'}`}>
                    / month
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
                disabled={plan.price === 'Soon'}
                onClick={() => handleSelect(plan.price)}
                variant={plan.popular ? 'accent' : 'outline'}
                className="mt-8 w-full"
              >
                {plan.cta}
                {plan.price !== 'Soon' && <ArrowUpRight className="h-4 w-4" />}
              </Button>
            </Reveal>
          ))}
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
