import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import SharedHeader from '@/components/SharedHeader';
import { 
  CreditCard, 
  ArrowRight, 
  Sparkles, 
  PenTool, 
  Share2, 
  Zap,
  MousePointer2,
  Instagram,
  Twitter
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Index() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f4f4f0] text-stone-900 selection:bg-rose-100 overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
        
        .font-pixel { font-family: 'Press Start 2P', monospace; letter-spacing: 1px; text-transform: uppercase; }
        .font-pixel-mono { font-family: 'VT323', monospace; letter-spacing: 0.5px; }
        
        @keyframes pixel-jump {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-pixel-jump { animation: pixel-jump 1s step-end infinite; }
        
        /* Pixel specific utilities */
        .pixel-border { border: 4px solid #1c1917; }
        .pixel-shadow { shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]; }
      `}</style>

      {/* Global Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.10] mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')] z-[60]" />

      <SharedHeader />

      {/* Hero Section */}
      <section className="relative z-10 pt-4 pb-12 px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[0.7fr_1.3fr] gap-12 items-center">
          
          <div className="relative h-[320px] hidden lg:flex items-center justify-center">
            <div className="relative z-20 w-48 h-64 bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(225,29,72,1)] overflow-hidden">
               <img src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" alt="Art" />
            </div>
            <div className="absolute top-10 right-10 z-30 bg-white p-2 border-2 border-black shadow-[4px_4px_0px_0px_black]">
                <MousePointer2 className="w-4 h-4 text-rose-500" />
            </div>
            <div className="absolute -bottom-2 right-12 z-10 w-40 h-56 bg-stone-200 border-4 border-stone-300" />
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-pixel leading-tight tracking-wider text-stone-900">
              AUTOMATE <span className="text-rose-500 underline decoration-8 underline-offset-8">CARD</span> <br /> 
              CREATION.
            </h1>

            <p className="text-base md:text-lg text-stone-500 leading-relaxed max-w-lg font-pixel-mono">
              A SOPHISTICATED PLATFORM FOR BULK CARD GENERATION. SIMPLE FOR YOU, SEAMLESS FOR YOUR PARTICIPANTS.
            </p>

            <div className="flex items-center gap-5 pt-4">
                <Button size="lg" className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-6 text-lg rounded-none border-b-8 border-rose-800 active:border-b-0 active:translate-y-2 transition-all font-pixel text-xs">
                  START CREATING
                </Button>
                <div className="flex -space-x-3">
                    {[1,2,3].map(i => (
                        <div key={i} className="w-10 h-10 border-2 border-black bg-stone-200 overflow-hidden shadow-sm">
                            <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" className="grayscale" />
                        </div>
                    ))}
                    <div className="pl-5 text-sm font-bold text-stone-400 self-center font-pixel-mono uppercase">+2k users</div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative pt-24 pb-12 px-8 overflow-hidden bg-stone-100 border-y-4 border-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-32">
            {[
              { icon: PenTool, title: "Bulk Card Generation", desc: "Generate hundreds of personalized cards automatically using a single design template. No need to manually edit each photo and name — our system creates all cards in seconds." },
              { icon: Share2, title: "Simple Link-Based Collection", desc: "Share one link with your members. They upload their photo and details themselves, and the system instantly turns that information into a professional card." },
              { icon: Zap, title: "Fast & Consistent Design", desc: "Keep every card perfectly aligned and branded. Your layout stays fixed, so all cards look professional and uniform without design mistakes." }
            ].map((f, i) => (
              <div key={i} className="group p-10 bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all">
                <div className="w-16 h-16 border-4 border-rose-600 bg-rose-500 text-white flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_black]">
                  <f.icon className="w-8 h-8" />
                </div>
                <h3 className="font-pixel text-lg font-bold mb-4">{f.title}</h3>
                <p className="text-stone-500 leading-relaxed font-pixel-mono text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contributors Section */}
      <section className="py-24 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="font-pixel text-2xl font-bold text-stone-900 underline decoration-rose-500 underline-offset-8">
              TOP CONTRIBUTORS
            </h2>
            <p className="text-stone-500 mt-4 font-pixel-mono text-lg">
              MEMBERS WITH THE HIGHEST CARD GENERATION VOLUME.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6 border-t-4 border-black pt-8">
            {[
              { rank: 1, name: "Salim Ullah", count: 2450 },
              { rank: 2, name: "Yasmin Akhter", count: 1980 },
              { rank: 3, name: "Moin Ul Haque", count: 1650 },
              { rank: 4, name: "MD SHAHADAT", count: 1420 },
              { rank: 5, name: "Get Together", count: 1280 },
              { rank: 6, name: "Fahim Ahmed", count: 1150 }
            ].map((user, i) => (
              <div key={i} className="flex items-center justify-between py-4 border-b-2 border-stone-100 hover:bg-rose-50 px-2 transition-all">
                <div className="flex items-center gap-4">
                  <span className={`font-pixel text-[10px] w-8 ${i < 3 ? 'text-rose-500' : 'text-stone-300'}`}>
                    {user.rank.toString().padStart(2, '0')}
                  </span>
                  <span className="font-bold text-stone-800 font-pixel-mono text-lg">{user.name}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-bold text-stone-900 font-pixel-mono text-xl">{user.count.toLocaleString()}</span>
                  <span className="text-[10px] uppercase font-pixel text-stone-400">Cards</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-32 px-8 bg-stone-100 border-t-4 border-black overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <span className="inline-block py-2 px-4 border-2 border-black bg-white text-[10px] font-pixel text-rose-500 mb-6 shadow-[4px_4px_0px_0px_black]">
              PROCESS
            </span>
            <h2 className="font-pixel text-3xl font-bold mb-6 text-stone-900">HOW IT WORKS</h2>
            <p className="text-stone-500 text-base max-w-2xl mx-auto font-pixel-mono text-xl">
              FROM DESIGN TO DISTRIBUTION IN MINUTES. CHOOSE YOUR PATH BELOW.
            </p>
          </div>

          <Tabs defaultValue="organizers" className="max-w-5xl mx-auto">
            <div className="flex justify-center mb-16">
              <TabsList className="grid w-full max-w-md grid-cols-2 h-16 bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] p-1 rounded-none">
                <TabsTrigger value="organizers" className="text-[10px] font-pixel data-[state=active]:bg-rose-500 data-[state=active]:text-white rounded-none">ORGANIZERS</TabsTrigger>
                <TabsTrigger value="participants" className="text-[10px] font-pixel data-[state=active]:bg-rose-500 data-[state=active]:text-white rounded-none">PARTICIPANTS</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="organizers" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
              {[
                { step: "01", title: "Create Project", desc: "Sign up and start a new project. Upload your own template or pick from our curated gallery." },
                { step: "02", title: "Set Layout", desc: "Drag & drop dynamic fields like Name, Photo, and ID. Lock the design to ensure consistency." },
                { step: "03", title: "Share Link", desc: "Get your unique magic link. Send it to your group via WhatsApp, Email, or Slack." },
                { step: "04", title: "Auto-Generate", desc: "As members submit details, cards are instantly created. No manual data entry needed." },
                { step: "05", title: "Bulk Export", desc: "Download a ZIP of all cards or a print-ready PDF with crop marks in one click." }
              ].map((item, i) => (
                <div key={i} className="relative p-8 border-4 border-black bg-white shadow-[6px_6px_0px_0px_#fca5a5]">
                  <div className="absolute top-6 right-6 text-2xl font-pixel text-rose-200">{item.step}</div>
                  <h3 className="font-pixel text-sm font-bold mb-3">{item.title}</h3>
                  <p className="text-stone-500 leading-relaxed text-sm font-pixel-mono">{item.desc}</p>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="participants" className="grid md:grid-cols-3 gap-6 animate-in fade-in duration-500">
              {[
                { step: "01", title: "Open Link", desc: "Click the secure link shared by your organizer. No account creation required." },
                { step: "02", title: "Submit Details", desc: "Upload your photo and fill in your details. Preview your card in real-time." },
                { step: "03", title: "Instant Download", desc: "Get your high-quality ID card immediately after submission. Save it to your phone." }
              ].map((item, i) => (
                <div key={i} className="relative p-8 border-4 border-black bg-white shadow-[6px_6px_0px_0px_#fca5a5]">
                  <div className="absolute top-6 right-6 text-2xl font-pixel text-rose-200">{item.step}</div>
                  <h3 className="font-pixel text-sm font-bold mb-3">{item.title}</h3>
                  <p className="text-stone-500 leading-relaxed text-sm font-pixel-mono">{item.desc}</p>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-32 px-8 bg-white border-t-4 border-black">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-pixel text-3xl font-bold mb-4 text-stone-900">FAQ</h2>
            <p className="text-stone-500 text-base font-pixel-mono text-xl uppercase tracking-widest">ANSWERS TO YOUR BURNING QUESTIONS.</p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {[
              { q: "Do participants need to create an account?", a: "No. Participants can generate their card using the shared link without creating any account." },
              { q: "What file formats are supported for templates?", a: "You can upload templates in JPG or PNG format. We recommend high-resolution images for best print quality." },
              { q: "Can I generate cards for a large group?", a: "Yes! You can generate hundreds or even thousands of personalized cards in one project using a single link." },
              { q: "Can I edit the design after submissions start?", a: "You can edit the layout before submissions begin. Once data starts coming in, the layout is locked to ensure consistency across all cards." },
              { q: "What photo size should participants upload?", a: "Participants can upload JPG or PNG photos up to 5MB. Our system automatically handles resizing and cropping to fit your design." },
              { q: "Can I download all cards at once?", a: "Unfortunately no, we are working on it. However, you can download each card individually from your dashboard." },
              { q: "Is any design skill required?", a: "Not at all. The platform is built for non-designers. Just drag, drop, and you're ready to go." },
              { q: "Is my data secure?", a: "Yes. Each project is private. Public links only allow submissions and do not expose other participants' data." },
              { q: "Can I use this for event passes?", a: "Absolutely. It's perfect for ID cards, event badges, certificates, gym memberships, and more." },
              { q: "What if a participant makes a mistake?", a: "As an organizer, you have full control to delete or regenerate any specific card from your dashboard." },
              { q: "Is there a free plan?", a: "Yes. We offer 1 project per user in free plan with 100 generations." },
              { q: "Do I need Photoshop?", a: "No external software is needed. You can do everything directly in your web browser." }
            ].map((faq, i) => (
              <AccordionItem 
                key={i} 
                value={`item-${i}`} 
                className="bg-white border-4 border-black px-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.05)] rounded-none"
              >
                <AccordionTrigger className="text-sm font-pixel hover:no-underline text-left py-6">
                  <span className="flex gap-4">
                    <span className="text-rose-500">Q.</span>
                    {faq.q}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-stone-600 font-pixel-mono text-lg leading-relaxed pb-6 pl-10">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white border-t-8 border-rose-600 pt-16 pb-12 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <span className="font-pixel text-2xl text-rose-500 tracking-tighter italic">CARDLIFY</span>
              <p className="max-w-xs text-stone-400 font-pixel-mono text-lg leading-tight uppercase">
                DESIGN ONCE. GENERATE FOR EVERYONE.
              </p>
              <div className="flex gap-3 pt-2">
                {[Instagram, Twitter].map((Icon, i) => (
                  <div key={i} className="w-12 h-12 border-2 border-white bg-transparent flex items-center justify-center text-white hover:bg-rose-500 hover:border-rose-500 cursor-pointer transition-all shadow-[4px_4px_0px_0px_white] active:shadow-none active:translate-y-1">
                    <Icon className="w-6 h-6" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6 font-pixel-mono">
              <h4 className="font-pixel text-[10px] text-rose-500">PRODUCT</h4>
              <ul className="space-y-3 text-stone-400 text-lg">
                <li><a href="#" className="hover:text-white">FEATURES</a></li>
                <li><a href="#" className="hover:text-white">TEMPLATES</a></li>
                <li><a href="#" className="hover:text-white">PRICING</a></li>
              </ul>
            </div>

            <div className="space-y-6 font-pixel-mono">
              <h4 className="font-pixel text-[10px] text-rose-500">LEGAL</h4>
              <ul className="space-y-3 text-stone-400 text-lg">
                <li><Link to="/terms" className="hover:text-white">TERMS OF SERVICE</Link></li>
                <li><Link to="/privacy" className="hover:text-white">PRIVACY POLICY</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex justify-center pt-8 border-t border-stone-800 text-stone-500 font-pixel-mono text-sm tracking-widest">
            <p>© 2026 CARDLIFY. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}