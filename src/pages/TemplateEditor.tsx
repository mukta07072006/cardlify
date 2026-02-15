import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { CommitNumberInput } from '@/components/CommitNumberInput';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Plus, 
  Image, 
  Type, 
  Save, 
  Link2, 
  Trash2,
  Loader2,
  GripVertical,
  Circle,
  Square,
  RectangleHorizontal,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Layers,
  RotateCw,
  Droplet,
  Sparkles,
  Grid3x3,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  Menu,
  X,
  ChevronDown,
  Settings,
  Palette,
  Layout,
  Eye,
  EyeOff
} from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

// Premium Font Library
const PREMIUM_FONTS = [
  { name: 'Inter', category: 'Sans-serif', weights: [300, 400, 500, 600, 700, 800] },
  { name: 'Roboto', category: 'Sans-serif', weights: [300, 400, 500, 700, 900] },
  { name: 'Open Sans', category: 'Sans-serif', weights: [300, 400, 600, 700, 800] },
  { name: 'Montserrat', category: 'Sans-serif', weights: [300, 400, 500, 600, 700, 800, 900] },
  { name: 'Poppins', category: 'Sans-serif', weights: [300, 400, 500, 600, 700, 800] },
  { name: 'Lato', category: 'Sans-serif', weights: [300, 400, 700, 900] },
  { name: 'Raleway', category: 'Sans-serif', weights: [300, 400, 500, 600, 700, 800] },
  { name: 'Nunito', category: 'Sans-serif', weights: [300, 400, 600, 700, 800] },
  { name: 'Playfair Display', category: 'Serif', weights: [400, 500, 600, 700, 800, 900] },
  { name: 'Merriweather', category: 'Serif', weights: [300, 400, 700, 900] },
  { name: 'Lora', category: 'Serif', weights: [400, 500, 600, 700] },
  { name: 'PT Serif', category: 'Serif', weights: [400, 700] },
  { name: 'Crimson Text', category: 'Serif', weights: [400, 600, 700] },
  { name: 'Bebas Neue', category: 'Display', weights: [400] },
  { name: 'Oswald', category: 'Display', weights: [300, 400, 500, 600, 700] },
  { name: 'Righteous', category: 'Display', weights: [400] },
  { name: 'Pacifico', category: 'Handwriting', weights: [400] },
  { name: 'Dancing Script', category: 'Handwriting', weights: [400, 500, 600, 700] },
  { name: 'Caveat', category: 'Handwriting', weights: [400, 500, 600, 700] },
  { name: 'Roboto Mono', category: 'Monospace', weights: [300, 400, 500, 600, 700] },
  { name: 'Fira Code', category: 'Monospace', weights: [300, 400, 500, 600, 700] },
  { name: 'JetBrains Mono', category: 'Monospace', weights: [300, 400, 500, 600, 700, 800] },
  // Bangla Fonts
  { name: 'Noto Sans Bengali', category: 'Bangla', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: 'Noto Serif Bengali', category: 'Bangla', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: 'Hind Siliguri', category: 'Bangla', weights: [300, 400, 500, 600, 700] },
  { name: 'Baloo Da 2', category: 'Bangla', weights: [400, 500, 600, 700, 800] },
  { name: 'Mina', category: 'Bangla', weights: [400, 700] },
  { name: 'Tiro Bangla', category: 'Bangla', weights: [400] },
];

interface Field {
  id: string;
  field_type: 'photo' | 'text';
  field_name: string;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  font_size: number;
  font_color: string;
  font_family: string;
  font_weight: number;
  font_bold: boolean;
  font_italic: boolean;
  text_align: 'left' | 'center' | 'right';
  border_enabled: boolean;
  border_size: number;
  border_color: string;
  background_color: string;
  background_opacity: number;
  shape: 'rectangle' | 'rounded' | 'circle';
  rotation: number;
  opacity: number;
  shadow_enabled: boolean;
  shadow_blur: number;
  shadow_color: string;
  letter_spacing: number;
  line_height: number;
  z_index: number;
}

interface Project {
  id: string;
  project_name: string;
  template_image_url: string;
  status: string;
}

interface HistoryState {
  fields: Field[];
  timestamp: number;
}

// Memoized Field Component
const FieldOverlay = memo(({ 
  field, 
  isSelected, 
  onMouseDown,
  onTouchStart,
  onClick,
  scale = 1
}: { 
  field: Field;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent, fieldId: string, isResize?: boolean) => void;
  onTouchStart: (e: React.TouchEvent, fieldId: string, isResize?: boolean) => void;
  onClick: (e: React.MouseEvent | React.TouchEvent) => void;
  scale: number;
}) => {
  const shapeClass = field.shape === 'circle' 
    ? 'rounded-full' 
    : field.shape === 'rounded' 
      ? 'rounded-xl' 
      : 'rounded-none';
  
  const shadowStyle = field.shadow_enabled ? {
    boxShadow: `0 0 ${field.shadow_blur}px ${field.shadow_color}`
  } : {};

  return (
    <div
      className={`absolute cursor-move overflow-hidden transition-all duration-100 ${shapeClass} ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-2 z-50' : ''
      }`}
      style={{
        left: `${field.x_position}%`,
        top: `${field.y_position}%`,
        width: `${field.width}%`,
        height: `${field.height}%`,
        transform: `rotate(${field.rotation}deg)`,
        opacity: field.opacity,
        border: field.border_enabled 
          ? `${field.border_size}px solid ${field.border_color}` 
          : isSelected 
            ? '2px solid #3b82f6' 
            : '2px dashed rgba(156, 163, 175, 0.5)',
        backgroundColor: field.field_type === 'text' && field.background_opacity > 0
          ? `${field.background_color}${Math.round(field.background_opacity * 255).toString(16).padStart(2, '0')}`
          : isSelected 
            ? 'rgba(59, 130, 246, 0.1)' 
            : 'rgba(255, 255, 255, 0.3)',
        zIndex: field.z_index,
        touchAction: 'none',
        ...shadowStyle
      }}
      onMouseDown={(e) => onMouseDown(e, field.id)}
      onTouchStart={(e) => onTouchStart(e, field.id)}
      onClick={onClick}
    >
      <div className="absolute inset-0 overflow-hidden flex items-center px-1">
        {field.field_type === 'photo' ? (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="w-4 h-4 text-gray-400" />
          </div>
        ) : (
          <div className="w-full min-w-0" style={{ textAlign: field.text_align || 'left' }}>
            <span 
              className="inline-flex max-w-full items-center gap-1 rounded bg-white/90 px-2 py-1 text-xs font-medium overflow-hidden"
              style={{
                fontFamily: field.font_family,
                fontSize: `${Math.min(field.font_size * scale * 0.5, 12)}px`,
                fontWeight: field.font_weight,
                fontStyle: field.font_italic ? 'italic' : 'normal',
                color: field.font_color,
                letterSpacing: `${field.letter_spacing}px`,
                lineHeight: field.line_height
              }}
            >
              <Type className="w-3 h-3 flex-shrink-0" />
              <span className="min-w-0 truncate">{field.field_name}</span>
            </span>
          </div>
        )}
      </div>
    
      {/* Resize Handle - larger for touch */}
      {isSelected && (
        <>
          <div
            className="absolute -bottom-2 -right-2 w-6 h-6 md:w-5 md:h-5 bg-blue-500 rounded-sm border-2 border-white cursor-se-resize shadow-lg hover:scale-110 transition-transform z-10 touch-none"
            onMouseDown={(e) => onMouseDown(e, field.id, true)}
            onTouchStart={(e) => onTouchStart(e, field.id, true)}
          />
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-sm border-2 border-white shadow" />
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-sm border-2 border-white shadow" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-sm border-2 border-white shadow" />
        </>
      )}
    </div>
  );
});

FieldOverlay.displayName = 'FieldOverlay';

export default function TemplateEditor() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formLink, setFormLink] = useState('');
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const gridSize = 5;

  // Mobile UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Undo/Redo history
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const maxHistory = 50;

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load Google Fonts
  useEffect(() => {
    const loadFonts = async () => {
      try {
        const fontFamilies = PREMIUM_FONTS.map(font => {
          const weights = font.weights.join(';');
          return `${font.name.replace(' ', '+')}:wght@${weights}`;
        }).join('&family=');
        
        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`;
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        await document.fonts.ready;
        
        let allFontsLoaded = false;
        let attempts = 0;
        const maxAttempts = 20;
        
        while (!allFontsLoaded && attempts < maxAttempts) {
          allFontsLoaded = true;
          
          for (const font of PREMIUM_FONTS) {
            for (const weight of font.weights) {
              const fontDescriptor = `${weight} 16px "${font.name}"`;
              if (!document.fonts.check(fontDescriptor)) {
                allFontsLoaded = false;
                break;
              }
            }
            if (!allFontsLoaded) break;
          }
          
          if (!allFontsLoaded) {
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
          }
        }
        
        console.log(`Editor: All ${PREMIUM_FONTS.length} fonts loaded after ${attempts} attempts`);
      } catch (error) {
        console.error('Error loading fonts in editor:', error);
      }
    };

    loadFonts();
  }, []);

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const snapValue = (value: number) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  const normalizeField = useCallback((field: Field): Field => {
    const width = clamp(Number.isFinite(field.width) ? field.width : 20, 1, 100);
    const height = clamp(Number.isFinite(field.height) ? field.height : 5, 1, 100);
    const x_position = clamp(Number.isFinite(field.x_position) ? field.x_position : 0, 0, 100 - width);
    const y_position = clamp(Number.isFinite(field.y_position) ? field.y_position : 0, 0, 100 - height);
    const font_size = clamp(Number.isFinite(field.font_size) && field.font_size > 0 ? field.font_size : 16, 8, 120);

    return {
      ...field,
      width,
      height,
      x_position,
      y_position,
      font_size,
      text_align: (field.text_align || 'left') as Field['text_align'],
      font_weight: field.font_weight || 400,
      rotation: field.rotation || 0,
      opacity: field.opacity ?? 1,
      shadow_enabled: field.shadow_enabled ?? false,
      shadow_blur: field.shadow_blur || 4,
      shadow_color: field.shadow_color || '#000000',
      letter_spacing: field.letter_spacing ?? 0,
      line_height: field.line_height ?? 1.5,
      z_index: field.z_index ?? 1,
    };
  }, []);

  const addToHistory = useCallback((newFields: Field[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ fields: newFields, timestamp: Date.now() });
      return newHistory.slice(-maxHistory);
    });
    setHistoryIndex(prev => Math.min(prev + 1, maxHistory - 1));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setFields(history[historyIndex - 1].fields);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setFields(history[historyIndex + 1].fields);
    }
  }, [historyIndex, history]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedField) {
        e.preventDefault();
        copyField();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedField) {
        e.preventDefault();
        duplicateField();
      } else if (e.key === 'Delete' && selectedField) {
        e.preventDefault();
        deleteField(selectedField);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedField, undo, redo]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProject();
  }, [projectId, user]);

  const fetchProject = async () => {
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);
      setFormLink(`${window.location.origin}/submit/${projectId}`);

      const { data: fieldsData, error: fieldsError } = await supabase
        .from('fields')
        .select('*')
        .eq('project_id', projectId);

      if (fieldsError) throw fieldsError;
      
      const processedFields = fieldsData?.map(f => {
        const isLegacyFormat = f.x_position > 100 || f.y_position > 100 || f.width > 100 || f.height > 100;
        const fontSize = (typeof f.font_size === 'number' && f.font_size > 0) ? f.font_size : 16;

        // Extract optional properties with defaults
        const font_weight = (f as any).font_weight || 400;
        const font_bold = (f as any).font_bold || false;
        const font_italic = (f as any).font_italic || false;
        const text_align = ((f as any).text_align || 'left') as 'left' | 'center' | 'right';
        const rotation = (f as any).rotation || 0;
        const opacity = (f as any).opacity ?? 1;
        const shadow_enabled = (f as any).shadow_enabled ?? false;
        const shadow_blur = (f as any).shadow_blur || 4;
        const shadow_color = (f as any).shadow_color || '#000000';
        const letter_spacing = (f as any).letter_spacing ?? 0;
        const line_height = (f as any).line_height ?? 1.5;
        const z_index = (f as any).z_index ?? 1;

        if (isLegacyFormat) {
          return normalizeField({
            ...f,
            field_type: f.field_type as 'photo' | 'text',
            shape: (f.shape || 'rectangle') as 'rectangle' | 'rounded' | 'circle',
            font_family: f.font_family || 'Inter',
            font_weight,
            font_bold,
            font_italic,
            text_align,
            font_size: fontSize,
            x_position: Math.min(90, (f.x_position / 800) * 100),
            y_position: Math.min(90, (f.y_position / 600) * 100),
            width: Math.max(5, Math.min(50, (f.width / 800) * 100)),
            height: Math.max(5, Math.min(50, (f.height / 600) * 100)),
            rotation,
            opacity,
            shadow_enabled,
            shadow_blur,
            shadow_color,
            letter_spacing,
            line_height,
            z_index,
          });
        }

        return normalizeField({
          ...f,
          field_type: f.field_type as 'photo' | 'text',
          shape: (f.shape || 'rectangle') as 'rectangle' | 'rounded' | 'circle',
          font_family: f.font_family || 'Inter',
          font_weight,
          font_bold,
          font_italic,
          text_align,
          font_size: fontSize,
          rotation,
          opacity,
          shadow_enabled,
          shadow_blur,
          shadow_color,
          letter_spacing,
          line_height,
          z_index,
        });
      }) || [];

      setFields(processedFields);
      if (processedFields.length > 0) {
        addToHistory(processedFields);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  const addField = useCallback((type: 'photo' | 'text') => {
    const maxZIndex = fields.reduce((max, f) => Math.max(max, f.z_index || 1), 0);
    const newField: Field = {
      id: `temp-${Date.now()}`,
      field_type: type,
      field_name: type === 'photo' ? `Photo ${fields.filter(f => f.field_type === 'photo').length + 1}` : `Text ${fields.filter(f => f.field_type === 'text').length + 1}`,
      x_position: 10,
      y_position: 10,
      width: type === 'photo' ? 25 : 30,
      height: type === 'photo' ? 25 : 10,
      font_size: 16,
      font_color: '#000000',
      font_family: 'Inter',
      font_weight: 400,
      font_bold: false,
      font_italic: false,
      text_align: 'left',
      border_enabled: false,
      border_size: 2,
      border_color: '#000000',
      background_color: '#ffffff',
      background_opacity: 0,
      shape: 'rectangle',
      rotation: 0,
      opacity: 1,
      shadow_enabled: false,
      shadow_blur: 4,
      shadow_color: '#000000',
      letter_spacing: 0,
      line_height: 1.5,
      z_index: maxZIndex + 1,
    };
    
    const newFields = [...fields, normalizeField(newField)];
    setFields(newFields);
    setSelectedField(newField.id);
    addToHistory(newFields);
    
    // Open properties on mobile
    if (isMobile) {
      setIsPropertiesOpen(true);
    }
  }, [fields, normalizeField, addToHistory, isMobile]);

  const updateField = useCallback((id: string, updates: Partial<Field>, shouldAddToHistory = false) => {
    setFields(prev => {
      const newFields = prev.map(f => {
        if (f.id === id) {
          const updated = { ...f, ...updates };
          if ('x_position' in updates || 'y_position' in updates || 'width' in updates || 'height' in updates) {
            return normalizeField(updated);
          }
          return updated;
        }
        return f;
      });
      
      // Add to history if explicitly requested (for property changes that should be undoable)
      if (shouldAddToHistory) {
        addToHistory(newFields);
      }
      
      return newFields;
    });
  }, [normalizeField, addToHistory]);

  const deleteField = useCallback((id: string) => {
    const newFields = fields.filter(f => f.id !== id);
    setFields(newFields);
    setSelectedField(null);
    addToHistory(newFields);
    setIsPropertiesOpen(false);
    toast.success('Field deleted');
  }, [fields, addToHistory]);

  const duplicateField = useCallback(() => {
    if (!selectedField) return;
    
    const field = fields.find(f => f.id === selectedField);
    if (!field) return;

    const maxZIndex = fields.reduce((max, f) => Math.max(max, f.z_index || 1), 0);
    const newField = {
      ...field,
      id: `temp-${Date.now()}`,
      field_name: `${field.field_name} (Copy)`,
      x_position: Math.min(field.x_position + 5, 90),
      y_position: Math.min(field.y_position + 5, 90),
      z_index: maxZIndex + 1,
    };

    const newFields = [...fields, newField];
    setFields(newFields);
    setSelectedField(newField.id);
    addToHistory(newFields);
    toast.success('Field duplicated');
  }, [selectedField, fields, addToHistory]);

  const copyField = useCallback(() => {
    if (!selectedField) return;
    const field = fields.find(f => f.id === selectedField);
    if (field) {
      localStorage.setItem('copiedField', JSON.stringify(field));
      toast.success('Field copied');
    }
  }, [selectedField, fields]);

  const bringToFront = useCallback(() => {
    if (!selectedField) return;
    const maxZIndex = fields.reduce((max, f) => Math.max(max, f.z_index || 1), 0);
    updateField(selectedField, { z_index: maxZIndex + 1 });
  }, [selectedField, fields, updateField]);

  const sendToBack = useCallback(() => {
    if (!selectedField) return;
    const minZIndex = fields.reduce((min, f) => Math.min(min, f.z_index || 1), 999);
    updateField(selectedField, { z_index: minZIndex - 1 });
  }, [selectedField, fields, updateField]);

  const getEventPosition = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: (e as React.MouseEvent).clientX, clientY: (e as React.MouseEvent).clientY };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, fieldId: string, isResize = false) => {
    e.stopPropagation();
    setSelectedField(fieldId);
    
    if (isMobile) {
      setIsPropertiesOpen(true);
    }
    
    if (isResize) {
      setResizing(fieldId);
    } else {
      setDragging(fieldId);
      const field = fields.find(f => f.id === fieldId);
      if (field && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const xPx = (field.x_position / 100) * rect.width;
        const yPx = (field.y_position / 100) * rect.height;
        setDragOffset({
          x: e.clientX - xPx,
          y: e.clientY - yPx
        });
      }
    }
  }, [fields, isMobile]);

  const handleTouchStart = useCallback((e: React.TouchEvent, fieldId: string, isResize = false) => {
    e.stopPropagation();
    setSelectedField(fieldId);
    
    if (isMobile) {
      setIsPropertiesOpen(true);
    }
    
    const touch = e.touches[0];
    if (isResize) {
      setResizing(fieldId);
    } else {
      setDragging(fieldId);
      const field = fields.find(f => f.id === fieldId);
      if (field && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const xPx = (field.x_position / 100) * rect.width;
        const yPx = (field.y_position / 100) * rect.height;
        setDragOffset({
          x: touch.clientX - xPx,
          y: touch.clientY - yPx
        });
      }
    }
  }, [fields, isMobile]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    
    if (dragging) {
      const field = fields.find(f => f.id === dragging);
      if (!field) return;

      const xPx = e.clientX - dragOffset.x;
      const yPx = e.clientY - dragOffset.y;
      
      let x = (xPx / rect.width) * 100;
      let y = (yPx / rect.height) * 100;

      x = snapValue(clamp(x, 0, 100 - field.width));
      y = snapValue(clamp(y, 0, 100 - field.height));

      updateField(dragging, { x_position: x, y_position: y });
    } else if (resizing) {
      const field = fields.find(f => f.id === resizing);
      if (!field) return;

      const xPx = (field.x_position / 100) * rect.width;
      const yPx = (field.y_position / 100) * rect.height;
      
      let width = ((e.clientX - xPx) / rect.width) * 100;
      let height = ((e.clientY - yPx) / rect.height) * 100;

      width = snapValue(clamp(width, 5, 100 - field.x_position));
      height = snapValue(clamp(height, 5, 100 - field.y_position));

      updateField(resizing, { width, height });
    }
  }, [dragging, resizing, fields, dragOffset, updateField, snapValue]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!canvasRef.current) return;
    
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    
    if (dragging) {
      const field = fields.find(f => f.id === dragging);
      if (!field) return;

      const xPx = touch.clientX - dragOffset.x;
      const yPx = touch.clientY - dragOffset.y;
      
      let x = (xPx / rect.width) * 100;
      let y = (yPx / rect.height) * 100;

      x = snapValue(clamp(x, 0, 100 - field.width));
      y = snapValue(clamp(y, 0, 100 - field.height));

      updateField(dragging, { x_position: x, y_position: y });
    } else if (resizing) {
      const field = fields.find(f => f.id === resizing);
      if (!field) return;

      const xPx = (field.x_position / 100) * rect.width;
      const yPx = (field.y_position / 100) * rect.height;
      
      let width = ((touch.clientX - xPx) / rect.width) * 100;
      let height = ((touch.clientY - yPx) / rect.height) * 100;

      width = snapValue(clamp(width, 5, 100 - field.x_position));
      height = snapValue(clamp(height, 5, 100 - field.y_position));

      updateField(resizing, { width, height });
    }
  }, [dragging, resizing, fields, dragOffset, updateField, snapValue]);

  const handleMouseUp = useCallback(() => {
    if (dragging || resizing) {
      addToHistory(fields);
    }
    setDragging(null);
    setResizing(null);
  }, [dragging, resizing, fields, addToHistory]);

  const saveFields = async () => {
    if (!projectId) return;
    
    setSaving(true);
    try {
      await supabase
        .from('fields')
        .delete()
        .eq('project_id', projectId);

      const fieldsToSave = fields.map(({ id, ...field }) => ({
        project_id: projectId,
        ...field,
      }));

      const { error } = await supabase
        .from('fields')
        .insert(fieldsToSave);

      if (error) throw error;
      
      toast.success('Template saved successfully!');
    } catch (error) {
      console.error('Error saving fields:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const copyFormLink = () => {
    navigator.clipboard.writeText(formLink);
    toast.success('Form link copied to clipboard!');
  };

  const selectedFieldData = useMemo(() => 
    fields.find(f => f.id === selectedField),
    [fields, selectedField]
  );

  const selectedFont = useMemo(() => 
    selectedFieldData ? PREMIUM_FONTS.find(f => f.name === selectedFieldData.font_family) : null,
    [selectedFieldData]
  );

  // Properties Panel Component (for mobile drawer)
  const PropertiesPanel = () => {
    if (!selectedFieldData) return null;

    return (
      <div className="space-y-4 pb-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="text-xs md:text-sm">
              <Layout className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="style" className="text-xs md:text-sm">
              <Palette className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              Style
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs md:text-sm">
              <Settings className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              Advanced
            </TabsTrigger>
          </TabsList>

          {/* Basic Tab */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Field Name</Label>
              <Input
                value={selectedFieldData.field_name}
                onChange={(e) => updateField(selectedFieldData.id, { field_name: e.target.value })}
                className="h-10 md:h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">X Position</Label>
                <CommitNumberInput
                  value={Math.round(selectedFieldData.x_position)}
                  min={0}
                  max={100}
                  onCommit={(next) => updateField(selectedFieldData.id, { x_position: next })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Y Position</Label>
                <CommitNumberInput
                  value={Math.round(selectedFieldData.y_position)}
                  min={0}
                  max={100}
                  onCommit={(next) => updateField(selectedFieldData.id, { y_position: next })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Width</Label>
                <CommitNumberInput
                  value={Math.round(selectedFieldData.width)}
                  min={1}
                  max={100}
                  onCommit={(next) => updateField(selectedFieldData.id, { width: next })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Height</Label>
                <CommitNumberInput
                  value={Math.round(selectedFieldData.height)}
                  min={1}
                  max={100}
                  onCommit={(next) => updateField(selectedFieldData.id, { height: next })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Shape</Label>
              <ToggleGroup
                type="single"
                value={selectedFieldData.shape}
                onValueChange={(value) => value && updateField(selectedFieldData.id, { shape: value as Field['shape'] })}
                className="justify-start"
              >
                <ToggleGroupItem value="rectangle" aria-label="Rectangle" className="px-4 h-10">
                  <Square className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Rectangle</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="rounded" aria-label="Rounded" className="px-4 h-10">
                  <RectangleHorizontal className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Rounded</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="circle" aria-label="Circle" className="px-4 h-10">
                  <Circle className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Circle</span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="space-y-4 mt-4">
            {selectedFieldData.field_type === 'text' && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Font Family</Label>
                  <Select
                    value={selectedFieldData.font_family}
                    onValueChange={(value) => updateField(selectedFieldData.id, { font_family: value }, true)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {['Sans-serif', 'Serif', 'Display', 'Handwriting', 'Monospace', 'Bangla'].map(category => (
                        <div key={category}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{category}</div>
                          {PREMIUM_FONTS.filter(f => f.category === category).map(font => (
                            <SelectItem 
                              key={font.name} 
                              value={font.name}
                              style={{ fontFamily: font.name }}
                            >
                              {font.name}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Font Size</Label>
                    <CommitNumberInput
                      value={selectedFieldData.font_size}
                      min={8}
                      max={120}
                      onCommit={(value) => updateField(selectedFieldData.id, { font_size: value }, true)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Weight</Label>
                    <Select
                      value={String(selectedFieldData.font_weight)}
                      onValueChange={(value) => updateField(selectedFieldData.id, { font_weight: Number(value) }, true)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedFont?.weights.map(weight => (
                          <SelectItem key={weight} value={String(weight)}>
                            {weight === 300 ? 'Light' : weight === 400 ? 'Regular' : weight === 500 ? 'Medium' : weight === 600 ? 'Semibold' : weight === 700 ? 'Bold' : weight === 800 ? 'Extra Bold' : 'Black'}
                          </SelectItem>
                        )) || <SelectItem value="400">Regular</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Font Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={selectedFieldData.font_color}
                      onChange={(e) => updateField(selectedFieldData.id, { font_color: e.target.value }, true)}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={selectedFieldData.font_color}
                      onChange={(e) => updateField(selectedFieldData.id, { font_color: e.target.value }, true)}
                      className="flex-1 h-10 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Text Alignment</Label>
                  <ToggleGroup
                    type="single"
                    value={selectedFieldData.text_align}
                    onValueChange={(value) => value && updateField(selectedFieldData.id, { text_align: value as Field['text_align'] }, true)}
                    className="justify-start"
                  >
                    <ToggleGroupItem value="left" className="px-4 h-10">
                      <AlignLeft className="w-4 h-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="center" className="px-4 h-10">
                      <AlignCenter className="w-4 h-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="right" className="px-4 h-10">
                      <AlignRight className="w-4 h-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <div className="flex items-center justify-between py-2">
                  <Label className="text-sm cursor-pointer">Italic</Label>
                  <Switch
                    checked={selectedFieldData.font_italic}
                    onCheckedChange={(checked) => updateField(selectedFieldData.id, { font_italic: checked }, true)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Letter Spacing</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[selectedFieldData.letter_spacing]}
                      onValueChange={([value]) => updateField(selectedFieldData.id, { letter_spacing: value }, true)}
                      min={-2}
                      max={10}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="text-xs font-mono w-12 text-right">{selectedFieldData.letter_spacing.toFixed(1)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Background</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={selectedFieldData.background_color}
                      onChange={(e) => updateField(selectedFieldData.id, { background_color: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Slider
                      value={[selectedFieldData.background_opacity]}
                      onValueChange={([value]) => updateField(selectedFieldData.id, { background_opacity: value })}
                      min={0}
                      max={1}
                      step={0.01}
                      className="flex-1"
                    />
                    <span className="text-xs font-mono w-12 text-right">{Math.round(selectedFieldData.background_opacity * 100)}%</span>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Border</Label>
                <Switch
                  checked={selectedFieldData.border_enabled}
                  onCheckedChange={(checked) => updateField(selectedFieldData.id, { border_enabled: checked })}
                />
              </div>
              {selectedFieldData.border_enabled && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs">Border Size</Label>
                    <Slider
                      value={[selectedFieldData.border_size]}
                      onValueChange={([value]) => updateField(selectedFieldData.id, { border_size: value })}
                      min={1}
                      max={20}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Border Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={selectedFieldData.border_color}
                        onChange={(e) => updateField(selectedFieldData.id, { border_color: e.target.value })}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={selectedFieldData.border_color}
                        onChange={(e) => updateField(selectedFieldData.id, { border_color: e.target.value })}
                        className="flex-1 h-10 font-mono text-xs"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <RotateCw className="w-4 h-4" />
                Rotation
              </Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[selectedFieldData.rotation]}
                  onValueChange={([value]) => updateField(selectedFieldData.id, { rotation: value })}
                  min={-180}
                  max={180}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs font-mono w-14 text-right">{selectedFieldData.rotation}°</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Droplet className="w-4 h-4" />
                Opacity
              </Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[selectedFieldData.opacity]}
                  onValueChange={([value]) => updateField(selectedFieldData.id, { opacity: value })}
                  min={0}
                  max={1}
                  step={0.01}
                  className="flex-1"
                />
                <span className="text-xs font-mono w-14 text-right">{Math.round(selectedFieldData.opacity * 100)}%</span>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Drop Shadow</Label>
                <Switch
                  checked={selectedFieldData.shadow_enabled}
                  onCheckedChange={(checked) => updateField(selectedFieldData.id, { shadow_enabled: checked })}
                />
              </div>
              {selectedFieldData.shadow_enabled && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs">Shadow Blur</Label>
                    <Slider
                      value={[selectedFieldData.shadow_blur]}
                      onValueChange={([value]) => updateField(selectedFieldData.id, { shadow_blur: value })}
                      min={0}
                      max={50}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Shadow Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={selectedFieldData.shadow_color}
                        onChange={(e) => updateField(selectedFieldData.id, { shadow_color: e.target.value })}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={selectedFieldData.shadow_color}
                        onChange={(e) => updateField(selectedFieldData.id, { shadow_color: e.target.value })}
                        className="flex-1 h-10 font-mono text-xs"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-3 pt-3 border-t">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Layer Order
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={bringToFront}
                  className="text-xs h-10"
                >
                  Bring to Front
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={sendToBack}
                  className="text-xs h-10"
                >
                  Send to Back
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={duplicateField}
                className="flex-1 h-10"
              >
                <Copy className="w-4 h-4 mr-1" />
                Duplicate
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteField(selectedFieldData.id)}
                className="flex-1 h-10"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Mobile-Optimized Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-3 md:px-4 py-2 md:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Mobile Menu Button */}
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden p-2"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0 overflow-y-auto">
                  <SheetHeader className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                    <SheetTitle className="text-left flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      Controls
                    </SheetTitle>
                  </SheetHeader>
                  
                  <div className="p-4 space-y-4">
                    {/* Add Fields */}
                    <Card className="shadow-sm border">
                      <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50">
                        <CardTitle className="text-sm">Add Elements</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 pt-4">
                        <Button
                          onClick={() => {
                            addField('text');
                            setIsSidebarOpen(false);
                          }}
                          variant="outline"
                          className="w-full justify-start gap-2 h-11"
                        >
                          <Type className="w-4 h-4" />
                          Add Text Field
                        </Button>
                        <Button
                          onClick={() => {
                            addField('photo');
                            setIsSidebarOpen(false);
                          }}
                          variant="outline"
                          className="w-full justify-start gap-2 h-11"
                        >
                          <Image className="w-4 h-4" />
                          Add Photo Field
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Layers List */}
                    <Card className="shadow-sm border">
                      <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Layers className="w-4 h-4 text-blue-600" />
                          Layers ({fields.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        {fields.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No fields yet
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {[...fields].sort((a, b) => (b.z_index || 1) - (a.z_index || 1)).map((field) => (
                              <button
                                key={field.id}
                                onClick={() => {
                                  setSelectedField(field.id);
                                  setIsSidebarOpen(false);
                                  setIsPropertiesOpen(true);
                                }}
                                className={`w-full text-left px-3 py-3 rounded-lg text-sm flex items-center gap-2 transition-all ${
                                  selectedField === field.id 
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md' 
                                    : 'bg-muted hover:bg-muted/80 hover:shadow'
                                }`}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {field.field_type === 'photo' ? (
                                    <Image className="w-4 h-4 flex-shrink-0" />
                                  ) : (
                                    <Type className="w-4 h-4 flex-shrink-0" />
                                  )}
                                  <span className="truncate">{field.field_name}</span>
                                </div>
                                <GripVertical className="w-4 h-4 flex-shrink-0 opacity-50" />
                              </button>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Canvas Controls */}
                    <Card className="shadow-sm border">
                      <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Grid3x3 className="w-4 h-4 text-blue-600" />
                          Canvas
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Snap to Grid</Label>
                          <Switch
                            checked={snapToGrid}
                            onCheckedChange={setSnapToGrid}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Show Grid</Label>
                          <Switch
                            checked={showGrid}
                            onCheckedChange={setShowGrid}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Zoom</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                              className="h-9 w-9 p-0"
                            >
                              <ZoomOut className="w-4 h-4" />
                            </Button>
                            <Slider
                              value={[zoom]}
                              onValueChange={([value]) => setZoom(value)}
                              min={0.5}
                              max={2}
                              step={0.1}
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                              className="h-9 w-9 p-0"
                            >
                              <ZoomIn className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-center text-muted-foreground">{Math.round(zoom * 100)}%</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </SheetContent>
              </Sheet>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="hidden md:flex gap-2 p-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden md:inline">Back</span>
              </Button>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base md:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                    Cardlify Editor
                  </h1>
                  <Badge className="bg-gradient-to-r from-pink-500 to-rose-400 border-pink-300 text-white font-bold text-xs py-1 px-2 shadow-lg shadow-pink-200/50">
                    <Sparkles size={11} className="mr-1" />
                    BETA
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-2 hidden sm:flex"
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 hidden sm:flex"
              >
                <Redo className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyFormLink}
                className="gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3 h-8 md:h-9"
              >
                <Link2 className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Link</span>
              </Button>
              <Button
                onClick={saveFields}
                disabled={saving}
                size="sm"
                className="gap-1 md:gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs md:text-sm px-2 md:px-3 h-8 md:h-9"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                    <span className="hidden sm:inline">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Save</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-3 md:px-4 py-4 md:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 h-full">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-1 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
            {/* Add Fields */}
            <Card className="shadow-lg border-2">
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Add Elements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() => addField('text')}
                  variant="outline"
                  className="w-full justify-start gap-2 hover:bg-blue-50 transition-colors"
                >
                  <Type className="w-4 h-4" />
                  Add Text Field
                </Button>
                <Button
                  onClick={() => addField('photo')}
                  variant="outline"
                  className="w-full justify-start gap-2 hover:bg-purple-50 transition-colors"
                >
                  <Image className="w-4 h-4" />
                  Add Photo Field
                </Button>
              </CardContent>
            </Card>

            {/* Field Properties */}
            {selectedFieldData && (
              <Card className="shadow-lg border-2">
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Field Properties</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={duplicateField}
                        className="h-8 w-8 p-0"
                        title="Duplicate (Ctrl+D)"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteField(selectedFieldData.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete (Del)"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <PropertiesPanel />
                </CardContent>
              </Card>
            )}

            {/* Fields List */}
            <Card className="shadow-lg border-2">
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Layers ({fields.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No fields yet. Add some elements to get started!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {[...fields].sort((a, b) => (b.z_index || 1) - (a.z_index || 1)).map((field) => (
                      <button
                        key={field.id}
                        onClick={() => setSelectedField(field.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                          selectedField === field.id 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md scale-[1.02]' 
                            : 'bg-muted hover:bg-muted/80 hover:shadow'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {field.field_type === 'photo' ? (
                            <Image className="w-4 h-4 flex-shrink-0" />
                          ) : (
                            <Type className="w-4 h-4 flex-shrink-0" />
                          )}
                          <span className="truncate">{field.field_name}</span>
                        </div>
                        <GripVertical className="w-4 h-4 flex-shrink-0 opacity-50" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Canvas Controls */}
            <Card className="shadow-lg border-2">
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Grid3x3 className="w-4 h-4 text-blue-600" />
                  Canvas Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Snap to Grid</Label>
                  <Switch
                    checked={snapToGrid}
                    onCheckedChange={setSnapToGrid}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Show Grid</Label>
                  <Switch
                    checked={showGrid}
                    onCheckedChange={setShowGrid}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Zoom</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                      className="h-8 w-8 p-0"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Slider
                      value={[zoom]}
                      onValueChange={([value]) => setZoom(value)}
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                      className="h-8 w-8 p-0"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <span className="text-xs font-mono w-12 text-right">{Math.round(zoom * 100)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Canvas Area - Full width on mobile */}
          <div className="lg:col-span-3 flex flex-col h-full">
            <Card className="overflow-hidden shadow-2xl border-2 flex-1 flex flex-col">
              <CardContent className="p-3 md:p-6 flex-1 flex flex-col">
                <div 
                  ref={canvasRef}
                  className="relative bg-white rounded-lg overflow-hidden mx-auto shadow-inner flex-1"
                  style={{ 
                    maxWidth: '100%',
                    width: '100%',
                    aspectRatio: imageSize.width && imageSize.height 
                      ? `${imageSize.width}/${imageSize.height}` 
                      : '16/9',
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center',
                    transition: 'transform 0.2s ease-out',
                    touchAction: 'none',
                    userSelect: 'none'
                  }}
                  onMouseMove={handleMouseMove}
                  onTouchMove={handleTouchMove}
                  onMouseUp={handleMouseUp}
                  onTouchEnd={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setSelectedField(null);
                      setIsPropertiesOpen(false);
                    }
                  }}
                >
                  {/* Grid overlay */}
                  {(snapToGrid || showGrid) && (
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: `
                          repeating-linear-gradient(0deg, transparent, transparent ${gridSize - 0.5}%, rgba(59, 130, 246, ${showGrid ? '0.15' : '0.1'}) ${gridSize - 0.5}%, rgba(59, 130, 246, ${showGrid ? '0.15' : '0.1'}) ${gridSize}%),
                          repeating-linear-gradient(90deg, transparent, transparent ${gridSize - 0.5}%, rgba(59, 130, 246, ${showGrid ? '0.15' : '0.1'}) ${gridSize - 0.5}%, rgba(59, 130, 246, ${showGrid ? '0.15' : '0.1'}) ${gridSize}%)
                        `,
                        backgroundSize: `${gridSize}% ${gridSize}%`
                      }}
                    />
                  )}

                  {project?.template_image_url && (
                    <img
                      src={project.template_image_url}
                      alt="Template"
                      className="w-full h-full object-contain pointer-events-none"
                      onLoad={handleImageLoad}
                      draggable={false}
                    />
                  )}

                  {/* Field Overlays with touch support */}
                  {fields.map((field) => (
                    <FieldOverlay
                      key={field.id}
                      field={field}
                      isSelected={selectedField === field.id}
                      onMouseDown={handleMouseDown}
                      onTouchStart={handleTouchStart}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedField(field.id);
                        if (isMobile) {
                          setIsPropertiesOpen(true);
                        }
                      }}
                      scale={zoom}
                    />
                  ))}
                </div>

                <div className="mt-3 md:mt-6 pt-3 md:pt-4 border-t">
                  <p className="text-xs md:text-sm text-muted-foreground text-center">
                    💡 <span className="font-semibold">Tips:</span> Tap/drag to move • Drag corner to resize • {isMobile ? 'Tap' : 'Click'} for properties
                  </p>
                  {!isMobile && (
                    <div className="flex gap-2 text-xs text-muted-foreground justify-center mt-2">
                      <kbd className="px-2 py-1 bg-muted rounded">Ctrl+Z</kbd> Undo
                      <kbd className="px-2 py-1 bg-muted rounded">Ctrl+D</kbd> Duplicate
                      <kbd className="px-2 py-1 bg-muted rounded">Del</kbd> Delete
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Mobile Properties Drawer */}
      {isMobile && (
        <Drawer open={isPropertiesOpen} onOpenChange={setIsPropertiesOpen}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <DrawerTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                {selectedFieldData ? `Edit: ${selectedFieldData.field_name}` : 'Field Properties'}
              </DrawerTitle>
              <DrawerDescription>
                Customize your field appearance and behavior
              </DrawerDescription>
            </DrawerHeader>
            <div className="overflow-y-auto p-4">
              <PropertiesPanel />
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Mobile FAB for adding fields */}
      {isMobile && !selectedField && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-40">
          <Button
            onClick={() => addField('text')}
            size="lg"
            className="rounded-full w-14 h-14 shadow-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Type className="w-6 h-6" />
          </Button>
          <Button
            onClick={() => addField('photo')}
            size="lg"
            className="rounded-full w-14 h-14 shadow-2xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
          >
            <Image className="w-6 h-6" />
          </Button>
        </div>
      )}
    </div>
  );
}