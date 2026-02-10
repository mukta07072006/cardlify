import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import SharedHeader from '@/components/SharedHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  LayoutTemplate,
  Star,
  Users,
  Eye,
  Clock,
  ArrowRight
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  category: string;
  created_at: string;
  created_by: string | null;
  download_count: number;
  like_count: number;
}

export default function Templates() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingState, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const templatesWithStats = (data || []).map(template => ({
        ...template,
        download_count: Math.floor(Math.random() * 2000) + 100,
        like_count: Math.floor(Math.random() * 150) + 20
      }));

      setTemplates(templatesWithStats);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('SYSTEM_ERROR: UNABLE_TO_FETCH_TEMPLATES');
      setTemplates([]); 
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = selectedCategory === 'All' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const categories = ['All', 'Corporate', 'Events', 'Education', 'Fitness', 'Professional', 'Community'];

  return (
    <div className="min-h-screen bg-[#f4f4f0] text-black font-mono uppercase selection:bg-rose-500 selection:text-white pb-32">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .font-pixel { font-family: 'Press Start 2P', cursive; }
        .pixel-card { border: 4px solid black; background: white; box-shadow: 8px 8px 0px 0px black; }
        .pixel-card-subtle { border: 2px solid black; background: white; box-shadow: 4px 4px 0px 0px black; }
        .pixel-btn-shadow { box-shadow: 4px 4px 0px 0px rgba(0,0,0,1); }
      `}</style>

      <SharedHeader />

      <main className="max-w-7xl mx-auto px-6 pt-20">
        {/* Hero Section */}
        <div className="mb-16 border-l-8 border-rose-500 pl-8">
          <h1 className="font-pixel text-2xl md:text-4xl text-black mb-6 leading-tight">
            TEMPLATE_<span className="text-rose-500">DATABASE</span>
          </h1>
          <p className="text-[10px] md:text-xs text-stone-600 max-w-2xl leading-loose font-bold">
            DOWNLOAD_CORE_ASSETS. READY_TO_USE_PROFILES. 
            SELECT_A_BASE_UNIT_TO_BEGIN_CONSTRUCTION.
          </p>
        </div>

        {/* Categories Filter */}
        <div className="flex flex-wrap gap-4 mb-16">
          {categories.map((category) => (
            <button 
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 border-2 border-black font-pixel text-[8px] transition-all ${
                selectedCategory === category 
                  ? "bg-black text-white translate-x-1 translate-y-1 shadow-none" 
                  : "bg-white text-black pixel-btn-shadow hover:-translate-y-0.5"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Grid Area */}
        {loadingState ? (
            <div className="grid md:grid-cols-3 gap-10">
              {[1,2,3].map(i => (
                <div key={i} className="pixel-card h-80 bg-stone-200 animate-pulse" />
              ))}
            </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="py-20 border-4 border-dashed border-stone-300 text-center font-pixel text-[10px] text-stone-400">
            ERROR: NO_RECORDS_FOUND_IN_THIS_SECTOR
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredTemplates.map((template) => (
              <div 
                key={template.id} 
                className="pixel-card group flex flex-col"
              >
                {/* Image */}
                <div className="aspect-[1.6/1] border-b-4 border-black overflow-hidden bg-stone-100">
                  <img
                    src={template.image_url}
                    alt={template.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-pixel text-[10px] text-black leading-normal">
                      {template.name}
                    </h3>
                  </div>
                  
                  <Badge className="w-fit rounded-none border-2 border-black bg-stone-100 text-black font-pixel text-[7px] mb-4 py-1">
                    {template.category}
                  </Badge>
                  
                  <p className="text-[9px] text-stone-500 mb-8 flex-1 leading-relaxed font-bold">
                     {template.description || "STANDARD_ISSUE_ID_UNIT."}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="rounded-none border-2 border-black font-pixel text-[8px] h-10 hover:bg-stone-100"
                      onClick={() => toast.info(`ACCESSING: ${template.name}`)}
                    >
                      <Eye className="w-3 h-3 mr-2" />
                      PREVIEW
                    </Button>
                    <Button 
                      className="rounded-none bg-black text-white border-2 border-black font-pixel text-[8px] h-10 hover:bg-rose-600 transition-colors"
                      onClick={() => navigate(`/project/new?template=${template.id}`)}
                    >
                      USE_UNIT
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom Section */}
        <div className="mt-32">
            <div className="mb-12">
              <h2 className="font-pixel text-xl text-black mb-4">
                REQUEST_<span className="text-rose-500">CUSTOM</span>_DESIGN
              </h2>
              <div className="h-1 w-32 bg-black" />
            </div>

            <Card className="rounded-none border-4 border-black shadow-[12px_12px_0px_0px_#facc15] bg-white">
              <CardContent className="p-8 md:p-12">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 border-4 border-black bg-rose-500 flex items-center justify-center text-white">
                        <LayoutTemplate className="w-8 h-8" />
                      </div>
                      <h3 className="font-pixel text-sm leading-tight text-black">CUSTOM_DESIGN_ENGINEERING</h3>
                    </div>
                    
                    <div className="space-y-6">
                      {[
                        "MATCH_BRAND_IDENTITY_SPECIFICATIONS",
                        "UNLIMITED_ITERATION_CYCLES",
                        "FULL_SOURCE_CODE_DELIVERY"
                      ].map((text, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <Star className="w-4 h-4 text-rose-500" />
                          <span className="text-[10px] font-bold text-stone-700">{text}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-amber-50 border-2 border-amber-500 p-6 flex gap-4">
                      <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <p className="font-pixel text-[12px] text-amber-800 mb-2">ETA: 12-24_HOURS</p>
                        <p className="text-[9px] text-amber-700 font-bold leading-relaxed">
                          DESIGN_FABRICATION_QUEUE_IS_CURRENTLY_OPTIMIZED.
                        </p>
                      </div>
                    </div>

                    <div className="bg-stone-900 border-2 border-stone-700 p-4 inline-block">
                      <p className="text-[#facc15] font-pixel text-[22px]">
                        STARTING_AT: $9.00_USD
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 p-8 border-4 border-black bg-[#f4f4f0]">
                    <h4 className="font-pixel text-[10px] text-black mb-6">INITIATE_REQUEST</h4>
                    <Button className="w-full bg-black text-white border-2 border-black rounded-none h-14 font-pixel text-[16px] pixel-btn-shadow hover:bg-rose-500 hover:text-white transition-all">
                      ORDER_NOW
                    </Button>
      
                    
                    <div className="mt-8 pt-8 border-t-2 border-stone-300 text-center">
                      <a href="#" className="font-pixel text-[7px] text-stone-400 hover:text-rose-500 transition-colors flex items-center justify-center gap-2">
                        CONTACT_US <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}