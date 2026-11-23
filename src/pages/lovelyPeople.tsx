import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Search, Download, Loader2, Heart, Instagram } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import SharedHeader from '@/components/SharedHeader';
import { Eyebrow, StudioFooter } from '@/components/studio';

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
    <div className="min-h-screen bg-background">
      <SharedHeader />

      <main className="mx-auto max-w-[1150px] px-5 py-14 sm:px-6 lg:py-20">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <Eyebrow>Certified lovely people</Eyebrow>
            <h1 className="display-xl mt-5">
              Lovely
              <br />
              <span className="serif text-[1.05em]">people.</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-foreground/55">
              Our little wall of favourites. Search a name, generate a card, and keep it forever.
            </p>
          </div>

          <a
            href="https://www.instagram.com/cardlify26"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 self-start rounded-full border border-foreground/15 px-4 py-2 text-xs text-foreground/60 transition hover:border-foreground/40 hover:text-foreground"
          >
            <Instagram className="h-3.5 w-3.5" />
            @cardlify26
          </a>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/30" />
            <Input
              placeholder="Search a lovely person…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 rounded-full border-foreground/15 bg-white/70 pl-11"
            />
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              {!showAdd ? (
                <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
                  Add person
                </Button>
              ) : (
                <div className="flex w-full gap-2">
                  <Input
                    placeholder="Name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-9 rounded-full border-foreground/15 bg-white/70"
                  />
                  <Button size="sm" onClick={addPerson} disabled={adding || !newName.trim()}>
                    {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowAdd(false);
                      setNewName('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-foreground/10 bg-white/60">
          <div className="flex items-center justify-between border-b border-foreground/10 px-6 py-4">
            <span className="mono-label text-[9px] text-foreground/35">Name</span>
            <span className="mono-label text-[9px] text-foreground/35">Card</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="h-6 w-6 animate-spin text-foreground/30" />
              <p className="mono-label mt-4 text-[9px] text-foreground/35">Loading the wall…</p>
            </div>
          ) : people.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Heart className="h-7 w-7 text-foreground/20" />
              <p className="mt-4 text-sm font-medium">Nobody here yet</p>
              <p className="mt-1 text-xs text-foreground/45">The wall is waiting for its first name.</p>
            </div>
          ) : (
            people
              .filter((p) => p.Name.toLowerCase().includes(search.toLowerCase()))
              .map((person, index) => (
                <div
                  key={person.id}
                  className="group flex items-center justify-between gap-4 border-b border-foreground/[0.07] px-5 py-4 transition-colors last:border-0 hover:bg-white/70 sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="mono-label w-7 shrink-0 text-[9px] text-foreground/25">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="truncate font-display text-lg tracking-tight">{person.Name}</span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateAndDownloadCard(person)}
                    disabled={processingId === person.id}
                    className="shrink-0"
                  >
                    {processingId === person.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Generate card</span>
                        <span className="sm:hidden">Card</span>
                      </>
                    )}
                  </Button>
                </div>
              ))
          )}
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-foreground/10 bg-lilac/30 px-6 py-4 sm:flex-row sm:items-center">
          <p className="text-sm text-foreground/60">
            <span className="font-display text-lg">{people.length}</span> lovely people and counting
          </p>
          <p className="mono-label text-[9px] text-foreground/35">Certified by Cardlify</p>
        </div>
      </main>

      <StudioFooter />
    </div>
  );
}
