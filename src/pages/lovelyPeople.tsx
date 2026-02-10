import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Search, Download, Loader2, ArrowRight, Heart, Sparkles } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { Instagram } from 'lucide-react'; 
import { motion } from 'framer-motion';

interface LovelyPerson {
  id: number;
  Name: string; 
}

export default function LovelyPeople() {
  const [people, setPeople] = useState<LovelyPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const { isAdmin } = useUserRole();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchPeople();
    document.fonts.load('10pt "Press Start 2P"');
  }, []);

  const fetchPeople = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lovely_people')
        .select('id, Name'); 

      if (error) throw error;
      setPeople(data || []);
    } catch (error: any) {
      console.error('Error:', error.message);
      toast.error('SYNC_ERROR');
    } finally {
      setLoading(false);
    }
  };

  const addPerson = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error('ENTER_NAME');
      return;
    }

    try {
      setAdding(true);
      const { data, error } = await supabase
        .from('lovely_people')
        .insert([{ Name: name }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setPeople((p) => [data as LovelyPerson, ...p]);
        toast.success('PERSON_ADDED');
        setNewName('');
        setShowAdd(false);
      }
    } catch (err: any) {
      console.error('Add person error', err);
      // Row-Level Security violation (client cannot insert) — show clearer guidance
      if (err?.code === '42501') {
        toast.error('DB_PERMISSION_DENIED — check RLS policy for lovely_people');
      } else {
        toast.error('ADD_FAILED');
      }
    } finally {
      setAdding(false);
    }
  };

  const generateAndDownloadCard = async (person: LovelyPerson) => {
    try {
      setProcessingId(person.id);
      const img = new Image();
      img.src = '/lovely_card.png';
      img.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('ASSET_MISSING'));
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // --- ADJUST THESE VALUES ---
      const fontMultiplier = 0.026 // Increase this (e.g., 0.10) for BIGGER text
      const yOffset = 0.57;       // 0.5 is center. 0.4 is higher. 0.6 is lower.
      // ---------------------------

      const fontSize = Math.floor(canvas.width * fontMultiplier); 
      ctx.font = `${fontSize}px "Press Start 2P"`;
      ctx.fillStyle = '#000000'; // Change to '#ffffff' if your card is dark
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Position calculation
      const xPos = canvas.width / 2;
      const yPos = canvas.height * yOffset;
      
      ctx.fillText(person.Name.toUpperCase(), xPos, yPos);

      const link = document.createElement('a');
      link.download = `CARD_${person.Name.toUpperCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('CARD_MINTED');
    } catch (error) {
      toast.error('GENERATION_FAILED');
    } finally {
      setProcessingId(null);
    }
  };
  return (
    <div className="min-h-screen bg-[#fffafa] text-black font-mono lowercase selection:bg-rose-500 selection:text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .font-pixel { font-family: 'Press Start 2P', cursive; }
        
        .list-row {
          border-bottom: 2px solid #ffe4e6;
          transition: all 0.2s;
        }
        .list-row:hover {
          background-color: #fff1f2;
          border-bottom: 2px solid #f43f5e;
        }
        
        .pixel-btn-pink {
          border: 3px solid black;
          background: #f43f5e;
          color: white;
          font-family: 'Press Start 2P', cursive;
          font-size: 8px;
          border-radius: 0;
          box-shadow: 4px 4px 0px 0px black;
          image-rendering: pixelated;
        }
        .pixel-btn-pink:hover {
          background: black;
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0px 0px #f43f5e;
        }
        .pixel-btn-pink:active {
          transform: translate(2px, 2px);
          box-shadow: 0px 0px 0px 0px black;
        }

        .pink-glow {
          text-shadow: 2px 2px 0px #ffe4e6;
        }
        /* Mobile-specific tweaks */
        @media (max-width: 640px) {
          .pixel-btn-pink {
            font-size: 7px;
            padding-left: 10px;
            padding-right: 10px;
          }
          .font-pixel { font-size: 11px; }
          .pink-glow { text-shadow: 1px 1px 0px #ffe4e6; }
          .list-row { padding-top: 0.75rem; padding-bottom: 0.75rem; }
        }
      `}</style>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-32 relative z-10">
        
        {/* Pink Infused Header */}
        <div className="mb-20 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
            <span className="font-pixel text-[8px] tracking-[0.2em] text-rose-500 font-bold uppercase">
              Follow On Instagram
            </span>
          </div>

          <h1 className="font-pixel text-2xl sm:text-3xl md:text-5xl uppercase mb-12 pink-glow">
            Lovely <span className="text-rose-500">People</span>
          </h1>
          
          <div className="relative max-w-xl w-full">
            <div className="absolute inset-0 bg-rose-100 translate-x-1 translate-y-1" />
            <div className="relative flex items-center gap-3 bg-white border-2 border-black px-3 sm:px-4 py-2 w-full">
              <Search className="w-5 h-5 text-rose-500" />
              <Input
                placeholder="search_the_elite..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-none bg-transparent font-pixel text-[9px] h-12 sm:h-14 focus-visible:ring-0 placeholder:text-rose-200 uppercase w-full"
              />
            </div>
            {isAdmin && (
              <div className="mt-3 flex items-center gap-3">
                {!showAdd ? (
                  <Button onClick={() => setShowAdd(true)} className="pixel-btn-pink px-3 py-2 text-[10px]">ADD_PERSON</Button>
                ) : (
                  <div className="flex w-full gap-2">
                    <Input
                      placeholder="NAME"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="bg-white border-2 border-black px-3 py-2 font-pixel text-[9px] uppercase w-full"
                    />
                    <Button onClick={addPerson} disabled={adding || !newName.trim()} className="pixel-btn-pink px-3 py-2">
                      {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SAVE'}
                    </Button>
                    <Button onClick={() => { setShowAdd(false); setNewName(''); }} className="px-3 py-2 bg-gray-200 border-2 border-black text-black">CANCEL</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* List Header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-4 sm:px-6 py-2 border-b-4 border-black bg-rose-50 font-pixel text-[8px] text-rose-900 uppercase tracking-widest">
          <span className="col-span-1">NAME_</span>
          <span className="col-span-1 text-right md:text-right">CARD_</span>
        </div>

        {/* The Pink List */}
        <div className="mb-20 bg-white border-x-2 border-black">
          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-500 mb-4" />
              <span className="font-pixel text-[8px] text-rose-300">syncing_with_pink_server...</span>
            </div>
          ) : people.length === 0 ? (
            <div className="py-24 text-center border-b-2 border-black border-dashed">
              <Heart className="w-8 h-8 text-rose-100 mx-auto mb-4" />
              <span className="font-pixel text-[8px] text-rose-200 uppercase">empty_heart_no_data</span>
            </div>
          ) : (
            people
              .filter((p) => p.Name.toLowerCase().includes(search.toLowerCase()))
              .map((person) => (
                <div key={person.id} className="list-row flex flex-col md:flex-row items-start md:items-center md:justify-between py-6 px-4 md:px-6 group">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-2 h-2 bg-rose-500 rotate-45 group-hover:scale-150 transition-transform" />
                    <span className="font-pixel text-[12px] md:text-sm uppercase tracking-tight group-hover:text-rose-600 transition-colors break-words">
                      {person.Name}
                    </span>
                  </div>

                  <div className="w-full md:w-auto mt-4 md:mt-0">
                    <Button
                      onClick={() => generateAndDownloadCard(person)}
                      disabled={processingId === person.id}
                      className="pixel-btn-pink px-6 h-10 md:h-12 w-full md:w-auto"
                    >
                      {processingId === person.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          <Download className="w-4 h-4" />
                          <span className="hidden md:inline">GENERATE_PASS</span>
                          <span className="md:hidden">MINT</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Styled Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-black text-white p-6 font-pixel text-[7px] border-4 border-rose-500 shadow-[8px_8px_0px_0px_rgba(244,63,94,0.3)]">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
             <div className="w-2 h-2 bg-rose-500 animate-ping" />
             <span className="text-white text-[10px]">Total_Lovely_People: <span className='font-bold text-[16px] text-yellow-300'>{people.length}</span></span>
          </div>
          <motion.a 
  href="https://www.instagram.com/cardlify26" 
  target="_blank" 
  rel="noopener noreferrer"
  // Floating animation
  animate={{ y: [0, -3, 0] }}
  transition={{ 
    duration: 3, 
    repeat: Infinity, 
    ease: "easeInOut" 
  }}
  className="
    flex items-center gap-1.5 
    bg-gradient-to-r from-rose-500 to-pink-500 
    text-white text-[9px] font-bold tracking-wider
    px-2.5 py-1 rounded-full
    shadow-[0_0_10px_rgba(244,63,94,0.3)]
    hover:shadow-[0_0_15px_rgba(244,63,94,0.6)]
    hover:scale-105 transition-all
  "
>
  <Instagram size={10} strokeWidth={3} />
  <span className="opacity-90">FOLLOW_CARDLIFY</span>
</motion.a>
        </div>
      </main>
    </div>
  );
}