import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import SharedHeader from '@/components/SharedHeader';
import { Eyebrow, Marquee, StudioFooter } from '@/components/studio';
import { Parallax, Reveal } from '@/components/scroll';
import {
  ArrowRight,
  ArrowUpRight,
  ClipboardList,
  Layers,
  Link2,
  Printer,
  Check,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const FEATURES = [
  {
    icon: Layers,
    title: 'One template, every card',
    body: 'Upload your artwork once, drop in the photo and text zones, and lock the layout. Every card that comes out is pixel-perfect and on brand.',
    tag: 'Design system',
  },
  {
    icon: Link2,
    title: 'A link does the collecting',
    body: 'Send one link to the group chat. People add their own name, role and photo — Cardlify composes the card instantly, no spreadsheets needed.',
    tag: 'Zero admin',
  },
  {
    icon: ClipboardList,
    title: 'Forms, when you need them',
    body: 'Build a Google-Forms-style questionnaire in the same project — short answers, paragraphs, emails, dates, dropdowns, multiple choice and checkboxes, each with required fields and help text.',
    tag: 'Forms',
  },
  {
    icon: Printer,
    title: 'Export like a studio',
    body: 'Download cards one by one, or pull every answer and card URL into a CSV or PDF report. Hand your printer the results and you are done.',
    tag: 'Output',
  },
];

const STATS = [
  { value: '2.4k+', label: 'Cards generated' },
  { value: '180', label: 'Projects shipped' },
  { value: '30s', label: 'Average per card' },
  { value: '100%', label: 'Layout consistency' },
];

const CONTRIBUTORS = [
  { rank: 1, name: 'Salim Ullah', count: 2450 },
  { rank: 2, name: 'Yasmin Akhter', count: 1980 },
  { rank: 3, name: 'Moin Ul Haque', count: 1650 },
  { rank: 4, name: 'MD Shahadat', count: 1420 },
  { rank: 5, name: 'Get Together', count: 1280 },
  { rank: 6, name: 'Fahim Ahmed', count: 1150 },
];

const ORGANIZER_STEPS = [
  { title: 'Create the project', body: 'Name the project, then choose what it delivers: a card, a form, or both. Card projects take template artwork; form projects do not need any.' },
  { title: 'Compose the layout', body: 'For cards, drag photo and text fields into place and lock the design so nobody can knock it out of alignment later.' },
  { title: 'Or build a form', body: 'Add questions in the form builder — short answer, paragraph, email, number, date, dropdown, multiple choice or checkboxes — and mark the required ones. Your edits are kept as a draft as you type.' },
  { title: 'Share one link', body: 'Copy the submission link into WhatsApp, email or Slack. Participants never need an account, whether they are filling a form or picking up a card.' },
  { title: 'Watch it land', body: 'Cards are composed in the browser the moment they arrive, and answers drop straight into your submission log with a Form response for each one.' },
  { title: 'Export and close', body: 'Download individual cards, a CSV of every answer, or a PDF report for the archive.' },
];

const PARTICIPANT_STEPS = [
  { title: 'Open the link', body: 'A secure, private page opens in the browser. No sign-up, no password, no app to install.' },
  { title: 'Fill it in', body: 'Type your details, upload a photo if the card needs one, and answer any questions the organiser added. Required fields are marked.' },
  { title: 'Done instantly', body: 'Your personalised card is generated on the spot for you to download — or, for a form, your answers go straight to the organiser.' },
];

const FAQS = [
  { q: 'Do participants need to create an account?', a: 'No. Participants can submit a form or generate their card using the shared link without creating any account.' },
  { q: 'Can I collect form answers without making cards?', a: 'Yes. When you create a project you choose card, form, or both. Form-only projects skip the artwork entirely and just collect answers.' },
  { q: 'What question types can I add?', a: 'Short answer, paragraph, email, number, date, dropdown, multiple choice and checkboxes — each with an optional placeholder, help text and a required toggle. You can reorder questions any time before responses arrive.' },
  { q: 'How do I get the answers out?', a: 'Open the project and export every response to CSV or PDF. Answers are stored with the submission, along with the participant name and the card URL when a card was generated.' },
  { q: 'What file formats are supported for templates?', a: 'You can upload templates in JPG or PNG format. We recommend high-resolution images for best print quality.' },
  { q: 'Can I generate cards for a large group?', a: 'Yes! You can generate hundreds or even thousands of personalised cards in one project using a single link.' },
  { q: 'Can I edit the design after submissions start?', a: 'You can edit the layout before submissions begin. Once data starts coming in, the layout is locked to ensure consistency across all cards.' },
  { q: 'What photo size should participants upload?', a: 'Participants can upload JPG or PNG photos up to 5MB. Our system automatically handles resizing and cropping to fit your design.' },
  { q: 'Can I download all cards at once?', a: 'Bulk ZIP download is in progress. For now you can download each card individually from your dashboard.' },
  { q: 'Is any design skill required?', a: 'Not at all. The platform is built for non-designers. Just drag, drop, and you are ready to go.' },
  { q: 'Is my data secure?', a: 'Yes. Each project is private. Public links only allow submissions and do not expose other participants data.' },
  { q: 'Can I use this for event passes?', a: 'Absolutely. It is built for ID cards, event badges, certificates, gym memberships and more.' },
  { q: 'What if a participant makes a mistake?', a: 'As an organiser you have full control to delete or regenerate any specific card from your dashboard.' },
  { q: 'Is there a free plan?', a: 'Yes. The free plan includes 1 project per user with 100 card generations.' },
  { q: 'Do I need Photoshop?', a: 'No external software is needed. Everything happens in your browser.' },
];

/** Product screenshot framed like a SaaS dashboard window. */
function DashboardScreen() {
  return (
    <div className="relative mx-auto w-full">
      <div
        className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-lilac/40 blur-2xl"
        aria-hidden
      />

      <div className="overflow-hidden rounded-[1.5rem] border border-foreground/10 bg-white shadow-[0_45px_90px_-45px_rgba(18,17,15,0.55)] ring-1 ring-white/50">
        <div className="flex items-center gap-1.5 border-b border-foreground/10 bg-white/80 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-coral/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-lime" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          <span className="mono-label ml-3 truncate text-[9px] text-foreground/35">
            cardlify · project overview
          </span>
        </div>
        <img
          src="/header-right.png"
          alt="Cardlify project dashboard with a share link, submissions count and card log"
          className="block w-full"
          loading="lazy"
        />
      </div>
    </div>
  );
}

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const start = () => navigate(user ? '/dashboard' : '/auth');

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <SharedHeader />

      {/* Hero */}
      <section className="mx-auto max-w-[1400px] px-5 pb-16 pt-10 sm:px-6 lg:pb-24 lg:pt-16">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <Reveal variant="up">
            <Eyebrow>Bulk card studio · est. 2026</Eyebrow>
            <h1 className="display-xl mt-6 text-foreground">
              Design once.
              <br />
              Personalise
              <br />
              <span className="serif relative inline-block text-[1.05em]">
                everyone.
                <svg
                  aria-hidden
                  viewBox="0 0 300 14"
                  className="absolute -bottom-1 left-0 h-3 w-full text-lime"
                  preserveAspectRatio="none"
                >
                  <path d="M2 10C60 3 140 2 298 8" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="mt-8 max-w-lg text-base leading-relaxed text-foreground/60 sm:text-lg">
              Cardlify turns one template into hundreds of finished ID cards, passes and
              certificates. You design the layout, we handle the rest — one link at a time.
            </p>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-foreground/50">
              Need to collect details instead? Every project can deliver cards, a form, or both.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={start} className="group">
                Start creating
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/templates')}>
                Browse templates
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-3">
                {['SU', 'YA', 'MH', 'GT'].map((initials, i) => (
                  <div
                    key={initials}
                    className="grid h-9 w-9 place-items-center rounded-full border-2 border-background text-[10px] font-semibold"
                    style={{ background: ['#D9D2FF', '#D6FF3F', '#FFD7C9', '#E6E1D6'][i] }}
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <p className="text-sm text-foreground/50">
                <span className="font-medium text-foreground">2,000+ organisers</span> shipping cards
                with Cardlify
              </p>
            </div>
          </Reveal>

          <Parallax speed={0.05} className="mx-auto w-full">
            <Reveal variant="scale" delay={140}>
              <DashboardScreen />
            </Reveal>
          </Parallax>
        </div>
      </section>

      <Marquee
        items={[
          'ID cards',
          'Event passes',
          'Certificates',
          'RSVP forms',
          'Registration forms',
          'Membership badges',
          'Conference credentials',
          'Team directories',
        ]}
      />

      {/* Stats */}
      <section className="mx-auto max-w-[1400px] px-5 sm:px-6">
        <div className="grid grid-cols-2 divide-foreground/10 border-b border-foreground/10 py-10 sm:grid-cols-4 sm:divide-x">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 90} className="px-2 py-4 sm:px-8">
              <p className="display-md font-display">{stat.value}</p>
              <p className="mono-label mt-2 text-foreground/40">{stat.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 sm:px-6 lg:py-28">
        <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Eyebrow>Capabilities</Eyebrow>
            <h2 className="display-lg mt-4 max-w-xl">
              A studio pipeline, <span className="serif text-[1.05em]">without</span> the studio.
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-foreground/55">
            Everything a design team would set up by hand — templating, data collection and
            export — in one calm workflow.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {FEATURES.map((feature, i) => (
            <Reveal
              as="article"
              key={feature.title}
              delay={i * 110}
              className="hover-lift group relative overflow-hidden rounded-[1.75rem] border border-foreground/10 bg-white/60 p-7 sm:p-8"
            >
              <div className="flex items-start justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-foreground text-paper">
                  <feature.icon className="h-5 w-5" />
                </div>
                <span className="mono-label text-[10px] text-foreground/30">0{i + 1}</span>
              </div>
              <p className="mono-label mt-8 text-[10px] text-foreground/40">{feature.tag}</p>
              <h3 className="mt-3 font-display text-xl tracking-tight">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground/55">{feature.body}</p>
              <div className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-lime transition-transform duration-500 group-hover:scale-x-100" />
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-foreground/10 bg-white/40">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:py-28">
          <Reveal variant="up" className="lg:sticky lg:top-28 lg:self-start">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="display-lg mt-4">
              Two paths,
              <br />
              one <span className="serif text-[1.05em]">calm</span> process.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-foreground/55">
              Organisers build the system once. Participants just fill in the blanks. No training,
              no onboarding calls, no design software.
            </p>
            <Button variant="outline" className="mt-8" onClick={() => navigate('/templates')}>
              See starter templates
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Reveal>

          <Reveal variant="up" delay={120}>
          <Tabs defaultValue="organizers">
            <TabsList className="h-auto w-full justify-start gap-1 rounded-full border border-foreground/10 bg-white/60 p-1.5 sm:w-auto">
              <TabsTrigger
                value="organizers"
                className="rounded-full px-5 py-2.5 text-sm data-[state=active]:bg-foreground data-[state=active]:text-paper data-[state=active]:shadow-none"
              >
                For organisers
              </TabsTrigger>
              <TabsTrigger
                value="participants"
                className="rounded-full px-5 py-2.5 text-sm data-[state=active]:bg-foreground data-[state=active]:text-paper data-[state=active]:shadow-none"
              >
                For participants
              </TabsTrigger>
            </TabsList>

            {[
              { value: 'organizers', steps: ORGANIZER_STEPS },
              { value: 'participants', steps: PARTICIPANT_STEPS },
            ].map(({ value, steps }) => (
              <TabsContent key={value} value={value} className="mt-8 space-y-0">
                {steps.map((step, i) => (
                  <div
                    key={step.title}
                    className="group grid grid-cols-[auto_1fr] gap-5 border-b border-foreground/10 py-6 sm:gap-8"
                  >
                    <span className="mono-label pt-1 text-foreground/30">0{i + 1}</span>
                    <div>
                      <h3 className="font-display text-lg tracking-tight">{step.title}</h3>
                      <p className="mt-2 max-w-lg text-sm leading-relaxed text-foreground/55">
                        {step.body}
                      </p>
                    </div>
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
          </Reveal>
        </div>
      </section>

      {/* Contributors */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 sm:px-6 lg:py-28">
        <Reveal className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>Leaderboard</Eyebrow>
            <h2 className="display-lg mt-4">
              The people
              <br />
              making <span className="serif text-[1.05em]">cards</span>.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-foreground/55">
              Organisers with the highest generation volume this season. A little friendly
              competition is a good thing.
            </p>
            <Link
              to="/lovelypeoples"
              className="mono-label mt-8 inline-flex items-center gap-2 text-foreground/60 hover:text-foreground"
            >
              Meet lovely people <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-[1.75rem] border border-foreground/10 bg-white/60 p-2 sm:p-4">
            {CONTRIBUTORS.map((person, i) => (
              <div
                key={person.name}
                className="group flex items-center justify-between gap-4 border-b border-foreground/10 px-4 py-5 last:border-0"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span
                    className={`mono-label w-7 shrink-0 text-[10px] ${
                      i < 3 ? 'text-foreground' : 'text-foreground/30'
                    }`}
                  >
                    {String(person.rank).padStart(2, '0')}
                  </span>
                  <span className="truncate font-display text-base tracking-tight sm:text-lg">
                    {person.name}
                  </span>
                  {i === 0 && (
                    <span className="hidden rounded-full bg-lime px-2 py-1 text-[9px] font-medium uppercase tracking-wider sm:inline">
                      Top
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-base tabular-nums sm:text-lg">
                    {person.count.toLocaleString()}
                  </span>
                  <span className="mono-label text-[9px] text-foreground/35">cards</span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="border-t border-foreground/10 bg-white/40">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-20 sm:px-6 lg:grid-cols-[0.7fr_1.3fr] lg:py-28">
          <Reveal variant="up" className="lg:sticky lg:top-28 lg:self-start">
            <Eyebrow>Questions</Eyebrow>
            <h2 className="display-lg mt-4">
              Good to <span className="serif text-[1.05em]">know.</span>
            </h2>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-foreground/55">
              Still curious? Everything about templates, privacy and exports lives here.
            </p>
            <a
              href="https://www.instagram.com/cardlify26"
              target="_blank"
              rel="noreferrer"
              className="mono-label mt-8 inline-flex items-center gap-2 text-foreground/60 hover:text-foreground"
            >
              Ask us on Instagram <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </Reveal>

          <Reveal variant="up" delay={120}>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, i) => (
              <AccordionItem key={faq.q} value={`item-${i}`} className="border-b border-foreground/10">
                <AccordionTrigger className="gap-6 py-5 text-left hover:no-underline [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0">
                  <span className="flex gap-4 text-[15px] font-medium tracking-tight text-foreground/85">
                    <span className="mono-label hidden pt-1 text-[10px] text-foreground/30 sm:block">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {faq.q}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-5 pl-0 text-sm leading-relaxed text-foreground/55 sm:pl-11">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 sm:px-6 lg:py-24">
        <Reveal variant="scale">
        <div className="relative overflow-hidden rounded-[2rem] bg-foreground px-7 py-14 text-paper sm:px-14 sm:py-20">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-lime/20 blur-3xl" />
          <div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-lilac/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <p className="mono-label text-lime">No credit card · 100 free cards</p>
            <h2 className="display-lg mt-5">
              Your next 500 cards are one <span className="serif text-[1.05em] text-lime">link</span> away.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-paper/60">
              Set the template up once, add a form if you need one, then send the link. Cards and
              answers arrive while you get on with the event.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button size="lg" variant="accent" onClick={start}>
                Create your first project
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Link
                to="/pricing"
                className="inline-flex h-14 items-center gap-2 rounded-full border border-paper/20 px-7 text-sm text-paper/80 transition hover:border-paper/50 hover:text-paper"
              >
                See pricing
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2">
              {['Cards, forms or both', 'Participants need no account', 'Private by default'].map((item) => (
                <span key={item} className="flex items-center gap-2 text-xs text-paper/50">
                  <Check className="h-3.5 w-3.5 text-lime" /> {item}
                </span>
              ))}
            </div>
          </div>
        </div>
        </Reveal>
      </section>

      <StudioFooter />
    </div>
  );
}
