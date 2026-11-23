import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wordmark } from '@/components/studio';
import { toast } from 'sonner';
import { extractProjectId } from '@/lib/urlUtils';
import {
  ArrowRight,
  Camera,
  Loader2,
  Download,
  CheckCircle,
  AlertCircle,
  Lock,
  Sparkles,
} from 'lucide-react';
import {
  emptyAnswer,
  isAnswerEmpty,
  normalizeFormField,
  type FormAnswers,
  type FormField as FormQuestion,
  type ProjectMode,
} from '@/lib/forms';

// Premium Font Library - must match the editor
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
  template_image_url: string | null;
  status: string;
  user_id: string;
  project_mode?: string | null;
  form_title?: string | null;
  form_description?: string | null;
  form_header_image_url?: string | null;
}

export default function SubmissionForm() {
  const { projectId, projectSlug } = useParams<{ projectId?: string; projectSlug?: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [generatedCardUrl, setGeneratedCardUrl] = useState<string | null>(null);
  const [isProjectOwnerElite, setIsProjectOwnerElite] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [projectMode, setProjectMode] = useState<ProjectMode>('card');
  const [formQuestions, setFormQuestions] = useState<FormQuestion[]>([]);
  const [answers, setAnswers] = useState<FormAnswers>({});
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // A project delivers a card when it has artwork and is not form-only
  const needsCard = projectMode !== 'form' && Boolean(project?.template_image_url);

  // Load Google Fonts with canvas preloading
  useEffect(() => {
    const loadFonts = async () => {
      try {
        // Build Google Fonts URL
        const fontFamilies = PREMIUM_FONTS.map(font => {
          const weights = font.weights.join(';');
          return `${font.name.replace(' ', '+')}:wght@${weights}`;
        }).join('&family=');
        
        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`;
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        // Wait for fonts to load in DOM
        await document.fonts.ready;
        console.log('Document fonts ready');
        
        // Check each font individually to ensure it's available
        let allFontsLoaded = false;
        let attempts = 0;
        const maxAttempts = 20; // Max 4 seconds
        
        while (!allFontsLoaded && attempts < maxAttempts) {
          allFontsLoaded = true;
          
          for (const font of PREMIUM_FONTS) {
            for (const weight of font.weights) {
              const fontDescriptor = `${weight} 16px "${font.name}"`;
              if (!document.fonts.check(fontDescriptor)) {
                allFontsLoaded = false;
                console.log(`Waiting for font: ${fontDescriptor}`);
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
        
        console.log(`All fonts loaded after ${attempts} attempts`);

        // Preload fonts for canvas by rendering them in a hidden canvas
        const preloadCanvas = document.createElement('canvas');
        const preloadCtx = preloadCanvas.getContext('2d');
        
        if (preloadCtx) {
          // Render each font to ensure it's loaded for canvas
          PREMIUM_FONTS.forEach(font => {
            font.weights.forEach(weight => {
              const fontString = `${weight} 16px "${font.name}", sans-serif`;
              preloadCtx.font = fontString;
              // Use both Latin and Bangla characters for preloading
              preloadCtx.fillText('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 0, 0);
              // Bangla test characters (if it's a Bangla font, this triggers loading)
              preloadCtx.fillText('আমি বাংলা গান গাই', 0, 0);
            });
          });
        }

        // Final wait to ensure canvas has cached the fonts
        await new Promise(resolve => setTimeout(resolve, 300));
        
        console.log('All fonts loaded and ready for canvas rendering');
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        // Still set as loaded after timeout to prevent infinite blocking
        await new Promise(resolve => setTimeout(resolve, 2000));
        setFontsLoaded(true);
      }
    };

    loadFonts();
  }, []);

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const normalizeField = (f: any): Field => {
    const width = clamp(Number.isFinite(f.width) ? f.width : 20, 1, 100);
    const height = clamp(Number.isFinite(f.height) ? f.height : 5, 1, 100);
    const x_position = clamp(Number.isFinite(f.x_position) ? f.x_position : 0, 0, 100 - width);
    const y_position = clamp(Number.isFinite(f.y_position) ? f.y_position : 0, 0, 100 - height);
    const font_size = clamp(Number.isFinite(f.font_size) && f.font_size > 0 ? f.font_size : 16, 8, 120);

    return {
      ...f,
      field_type: f.field_type as 'photo' | 'text',
      shape: (f.shape || 'rectangle') as 'rectangle' | 'rounded' | 'circle',
      font_family: f.font_family || 'Inter',
      font_weight: f.font_weight || 400,
      font_bold: !!f.font_bold,
      font_italic: !!f.font_italic,
      text_align: (f.text_align || 'left') as 'left' | 'center' | 'right',
      font_color: f.font_color || '#000000',
      border_enabled: !!f.border_enabled,
      border_size: Number.isFinite(f.border_size) ? f.border_size : 0,
      border_color: f.border_color || '#000000',
      background_color: f.background_color || '#ffffff',
      background_opacity: Number.isFinite(f.background_opacity) ? f.background_opacity : 0,
      rotation: f.rotation || 0,
      opacity: f.opacity ?? 1,
      shadow_enabled: f.shadow_enabled ?? false,
      shadow_blur: f.shadow_blur || 4,
      shadow_color: f.shadow_color || '#000000',
      letter_spacing: f.letter_spacing ?? 0,
      line_height: f.line_height ?? 1.5,
      z_index: f.z_index ?? 1,
      width,
      height,
      x_position,
      y_position,
      font_size,
    } as Field;
  };

  useEffect(() => {
    const loadProject = async () => {
      try {
        // Determine the actual project ID to use
        let actualProjectId = projectId;
        
        // If we have a slug, try to extract ID or look it up
        if (projectSlug && !projectId) {
          const extractedId = extractProjectId(projectSlug);
          if (extractedId) {
            actualProjectId = extractedId;
          } else {
            toast.error('Invalid project link');
            navigate('/');
            return;
          }
        }

        if (!actualProjectId) {
          toast.error('Project not found');
          navigate('/');
          return;
        }

        // Load project details
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', actualProjectId)
          .eq('status', 'active')
          .single();

        if (projectError || !projectData) {
          toast.error('Project not found or inactive');
          navigate('/');
          return;
        }

        setProject(projectData);

        const mode = ((projectData as { project_mode?: ProjectMode }).project_mode ?? 'card') as ProjectMode;
        setProjectMode(mode);

        if (mode !== 'card') {
          const { data: questionRows, error: questionsError } = await supabase
            .from('form_fields')
            .select('*')
            .eq('project_id', actualProjectId)
            .order('position', { ascending: true })
            .order('created_at', { ascending: true });

          if (questionsError) throw questionsError;

          const questions = (questionRows || []).map((row) => normalizeFormField(row as never));
          setFormQuestions(questions);

          const initialAnswers: FormAnswers = {};
          questions.forEach((question) => {
            initialAnswers[question.label] = emptyAnswer(question);
          });
          setAnswers(initialAnswers);
        }

        // Check if project owner is elite
        const { data: profileData } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('user_id', projectData.user_id)
          .single();

        setIsProjectOwnerElite(profileData?.subscription_tier === 'elite');

        // Load fields
        const { data: fieldsData, error: fieldsError } = await supabase
          .from('fields')
          .select('*')
          .eq('project_id', actualProjectId)
          .order('created_at', { ascending: true });

        if (fieldsError) throw fieldsError;
        
        // Normalize and sort by z-index
        const normalizedFields = (fieldsData || [])
          .map(normalizeField)
          .sort((a, b) => (a.z_index || 1) - (b.z_index || 1));
        
        setFields(normalizedFields);

        // Initialize form data
        const initialData: Record<string, string> = {};
        normalizedFields.forEach(field => {
          if (field.field_type === 'text') {
            initialData[field.field_name] = '';
          }
        });
        setFormData(initialData);
      } catch (error) {
        console.error('Error loading project:', error);
        toast.error('Failed to load project');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId, projectSlug, navigate]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo must be less than 5MB');
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateCard = async (photoUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas || !project) {
        reject('Canvas not available');
        return;
      }

      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) {
        reject('Context not available');
        return;
      }

      const templateImg = new Image();
      templateImg.crossOrigin = 'anonymous';
      
      templateImg.onload = async () => {
        // Set canvas size to match template
        canvas.width = templateImg.naturalWidth;
        canvas.height = templateImg.naturalHeight;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Preload all fonts used in fields for canvas rendering
        const uniqueFonts = new Set<string>();
        fields.forEach(field => {
          if (field.field_type === 'text') {
            const fontFamily = field.font_family || 'Inter';
            const fontWeight = field.font_weight || 400;
            const fontStyle = field.font_italic ? 'italic' : 'normal';
            const fontKey = `${fontStyle} ${fontWeight} 16px "${fontFamily}", sans-serif`;
            uniqueFonts.add(fontKey);
          }
        });

        // Force canvas to load fonts by rendering them offscreen
        console.log('Preloading fonts for canvas:', Array.from(uniqueFonts));
        uniqueFonts.forEach(fontKey => {
          ctx.font = fontKey;
          ctx.fillText('ABCDEFGHIJKLMNOPQRSTUVWXYZ', -1000, -1000);
          // Also preload Bangla characters for Bangla fonts
          ctx.fillText('আমি বাংলা গান গাই', -1000, -1000);
        });

        // Wait a moment for fonts to be cached in canvas (longer for Bangla fonts)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Draw template background
        ctx.drawImage(templateImg, 0, 0);

        // Helper function to draw rounded rectangle path
        const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
          ctx.beginPath();
          if (r >= Math.min(w, h) / 2) {
            // Draw ellipse/circle for circular shape
            ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, Math.PI * 2);
          } else if (r > 0) {
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
          } else {
            ctx.rect(x, y, w, h);
          }
          ctx.closePath();
        };

        // Process fields in z-index order
        for (const field of fields) {
          // Convert percentage positions to pixels
          const x = (field.x_position / 100) * canvas.width;
          const y = (field.y_position / 100) * canvas.height;
          const width = (field.width / 100) * canvas.width;
          const height = (field.height / 100) * canvas.height;
          
          const cornerRadius = field.shape === 'circle' 
            ? Math.min(width, height) / 2 
            : field.shape === 'rounded' 
              ? Math.min(20, Math.min(width, height) / 4)
              : 0;

          // Save context for transformations
          ctx.save();

          // Apply rotation if needed
          if (field.rotation !== 0) {
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate((field.rotation * Math.PI) / 180);
            ctx.translate(-centerX, -centerY);
          }

          // Apply opacity
          ctx.globalAlpha = field.opacity;

          // Apply shadow if enabled
          if (field.shadow_enabled) {
            ctx.shadowColor = field.shadow_color;
            ctx.shadowBlur = field.shadow_blur;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
          }

          if (field.field_type === 'photo' && photoUrl) {
            try {
              const photoImg = new Image();
              photoImg.crossOrigin = 'anonymous';
              
              await new Promise<void>((res, rej) => {
                photoImg.onload = () => {
                  ctx.save();
                  
                  // Create clipping path
                  drawRoundedRect(x, y, width, height, cornerRadius);
                  ctx.clip();
                  
                  // Calculate aspect ratio fit
                  const imgAspect = photoImg.width / photoImg.height;
                  const fieldAspect = width / height;
                  
                  let drawWidth, drawHeight, drawX, drawY;
                  
                  if (imgAspect > fieldAspect) {
                    drawHeight = height;
                    drawWidth = height * imgAspect;
                    drawX = x - (drawWidth - width) / 2;
                    drawY = y;
                  } else {
                    drawWidth = width;
                    drawHeight = width / imgAspect;
                    drawX = x;
                    drawY = y - (drawHeight - height) / 2;
                  }
                  
                  ctx.drawImage(photoImg, drawX, drawY, drawWidth, drawHeight);
                  ctx.restore();

                  // Draw border if enabled
                  if (field.border_enabled && field.border_size > 0) {
                    ctx.save();
                    // Disable shadow for border
                    ctx.shadowColor = 'transparent';
                    drawRoundedRect(x, y, width, height, cornerRadius);
                    ctx.strokeStyle = field.border_color;
                    ctx.lineWidth = field.border_size;
                    ctx.stroke();
                    ctx.restore();
                  }

                  res();
                };
                photoImg.onerror = () => {
                  console.error('Failed to load photo');
                  rej();
                };
                photoImg.src = photoUrl;
              });
            } catch (error) {
              console.error('Error rendering photo:', error);
            }
          } else if (field.field_type === 'text') {
            // Draw background if opacity > 0
            if (field.background_opacity > 0) {
              ctx.save();
              // Disable shadow for background
              ctx.shadowColor = 'transparent';
              ctx.globalAlpha = field.opacity * field.background_opacity;
              ctx.fillStyle = field.background_color;
              drawRoundedRect(x, y, width, height, cornerRadius);
              ctx.fill();
              ctx.restore();
            }

            // Draw border if enabled
            if (field.border_enabled && field.border_size > 0) {
              ctx.save();
              // Disable shadow for border
              ctx.shadowColor = 'transparent';
              ctx.globalAlpha = field.opacity;
              drawRoundedRect(x, y, width, height, cornerRadius);
              ctx.strokeStyle = field.border_color;
              ctx.lineWidth = field.border_size;
              ctx.stroke();
              ctx.restore();
            }

            // Draw text
            const text = formData[field.field_name] || '';
            if (text) {
              ctx.save();
              // Disable shadow for text (or keep it if you want shadowed text)
              // For now, let's keep the shadow for text
              
              // Scale font size proportionally
              const scaleFactor = canvas.height / 600;
              const scaledFontSize = Math.max(12, field.font_size * scaleFactor);
              
              // Build proper font string with weight
              const fontStyle = field.font_italic ? 'italic' : 'normal';
              const fontWeight = field.font_weight || 400;
              const fontFamily = field.font_family || 'Inter';
              
              // Load the font into canvas - use proper font stack
              const fontString = `${fontStyle} ${fontWeight} ${scaledFontSize}px "${fontFamily}", sans-serif`;
              ctx.font = fontString;
              
              // Debug: Log font being used
              console.log(`Rendering text "${text}" with font: ${fontString}`);
              
              ctx.fillStyle = field.font_color;
              ctx.textBaseline = 'middle';
              ctx.textAlign = field.text_align || 'left';

              // Apply letter spacing if supported (canvas doesn't natively support it well)
              // We'll use a workaround for letter spacing
              const letterSpacing = field.letter_spacing * scaleFactor;

              // Calculate text position with padding
              const paddingX = (field.border_enabled ? field.border_size : 0) + 8;
              const paddingY = (field.border_enabled ? field.border_size : 0) + 4;
              const maxTextWidth = Math.max(0, width - paddingX * 2);

              // Clip to field bounds
              drawRoundedRect(x, y, width, height, cornerRadius);
              ctx.clip();

              // Calculate text X position based on alignment
              let textX;
              if (field.text_align === 'center') {
                textX = x + width / 2;
              } else if (field.text_align === 'right') {
                textX = x + width - paddingX;
              } else {
                textX = x + paddingX;
              }

              const textY = y + height / 2;

              // Handle letter spacing by drawing characters individually
              if (letterSpacing !== 0 && text.length > 1) {
                ctx.textAlign = 'left';
                let currentX = textX;
                
                // For center/right alignment, calculate total width first
                if (field.text_align === 'center' || field.text_align === 'right') {
                  let totalWidth = 0;
                  for (let i = 0; i < text.length; i++) {
                    totalWidth += ctx.measureText(text[i]).width;
                    if (i < text.length - 1) totalWidth += letterSpacing;
                  }
                  
                  if (field.text_align === 'center') {
                    currentX = textX - totalWidth / 2;
                  } else {
                    currentX = textX - totalWidth;
                  }
                }

                // Draw each character
                for (let i = 0; i < text.length; i++) {
                  const char = text[i];
                  const charWidth = ctx.measureText(char).width;
                  
                  // Check if we're still within bounds
                  if (currentX + charWidth > x + width - paddingX) break;
                  
                  ctx.fillText(char, currentX, textY);
                  currentX += charWidth + letterSpacing;
                }
              } else {
                // Standard text rendering
                const fitTextToWidth = (rawText: string, maxWidth: number): string => {
                  if (!rawText || maxWidth <= 0) return '';
                  
                  const measured = ctx.measureText(rawText);
                  if (measured.width <= maxWidth) return rawText;
                  
                  const ellipsis = '…';
                  let lo = 0;
                  let hi = rawText.length;
                  
                  while (lo < hi) {
                    const mid = Math.floor((lo + hi) / 2);
                    const candidate = rawText.slice(0, mid) + ellipsis;
                    if (ctx.measureText(candidate).width <= maxWidth) {
                      lo = mid + 1;
                    } else {
                      hi = mid;
                    }
                  }
                  
                  const len = Math.max(0, lo - 1);
                  return rawText.slice(0, len) + ellipsis;
                };

                const fittedText = fitTextToWidth(text, maxTextWidth);
                ctx.fillText(fittedText, textX, textY);
              }

              ctx.restore();
            }
          }

          // Restore context
          ctx.restore();
        }

        // Add watermark if not elite
        if (!isProjectOwnerElite) {
          ctx.save();
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 20px Inter, Arial, sans-serif';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText('cardlify', canvas.width - 15, canvas.height - 15);
          ctx.restore();
        }

        // Convert to blob and upload
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject('Failed to generate image');
            return;
          }

          try {
            const fileName = `${project.id}/${Date.now()}.png`;
            const { error: uploadError } = await supabase.storage
              .from('cards')
              .upload(fileName, blob, {
                contentType: 'image/png',
                cacheControl: '3600'
              });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('cards')
              .getPublicUrl(fileName);

            resolve(publicUrl);
          } catch (error) {
            reject(error);
          }
        }, 'image/png', 0.95);
      };

      templateImg.onerror = () => reject('Failed to load template image');
      templateImg.src = project.template_image_url;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasPhotoField = needsCard && fields.some(f => f.field_type === 'photo');
    if (hasPhotoField && !photoFile) {
      toast.error('Please upload a photo');
      return;
    }

    // Validate text fields
    const textFields = needsCard ? fields.filter(f => f.field_type === 'text') : [];
    for (const field of textFields) {
      if (!formData[field.field_name]?.trim()) {
        toast.error(`Please fill in ${field.field_name}`);
        return;
      }
    }

    for (const question of formQuestions) {
      if (question.required && isAnswerEmpty(answers[question.label])) {
        toast.error(`Please answer “${question.label}”`);
        return;
      }
    }

    setSubmitting(true);

    try {
      let photoUrl = '';
      
      // Upload photo if exists
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${project!.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, photoFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName);
        
        photoUrl = publicUrl;
      }

      // Wait to ensure fonts are fully loaded and cached for canvas
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate a card only when this project delivers one
      const cardUrl = needsCard ? await generateCard(photoUrl) : null;

      // Merge card layout answers with form answers into flat, export-friendly values
      const mergedAnswers: Record<string, string> = {};
      [formData, answers].forEach((source) => {
        Object.entries(source).forEach(([key, value]) => {
          mergedAnswers[key] = Array.isArray(value) ? value.join(', ') : value;
        });
      });

      const nameQuestion = formQuestions.find((question) => /name/i.test(question.label));
      const nameAnswer = nameQuestion ? mergedAnswers[nameQuestion.label] : '';
      const participantName =
        nameAnswer || mergedAnswers['Name'] || Object.values(mergedAnswers)[0] || 'Anonymous';

      const { error: submissionError } = await supabase
        .from('submissions')
        .insert({
          project_id: project!.id,
          participant_name: participantName,
          participant_id: mergedAnswers['ID'] || null,
          department: mergedAnswers['Department'] || null,
          role: mergedAnswers['Role'] || null,
          photo_url: photoUrl || null,
          generated_card_url: cardUrl,
          field_values: mergedAnswers
        });

      if (submissionError) throw submissionError;

      setGeneratedCardUrl(cardUrl);
      setSubmitted(true);
      toast.success(cardUrl ? 'Your card has been generated!' : 'Your response has been recorded!');
    } catch (error) {
      console.error('Error submitting:', error);
      toast.error(
        needsCard
          ? 'Failed to generate card. Please try again.'
          : 'Failed to send your response. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const downloadCard = () => {
    if (generatedCardUrl) {
      const link = document.createElement('a');
      link.href = generatedCardUrl;
      link.download = `${project?.project_name || 'card'}-${Date.now()}.png`;
      link.target = '_blank';
      link.click();
      toast.success('Download started!');
    }
  };

  const isFullyLoaded = !loading && (!needsCard || fontsLoaded);
  // The form title sits at the very top; the project name becomes the small label above it.
  const displayTitle = project?.form_title?.trim() || project?.project_name || '';
  const headerImageUrl = project?.form_header_image_url?.trim() || null;

  const cardTextFields = needsCard ? fields.filter((f) => f.field_type === 'text') : [];
  const needsPhoto = needsCard && fields.some((f) => f.field_type === 'photo');
  const questionCount = formQuestions.length + cardTextFields.length + (needsPhoto ? 1 : 0);
  const minutes = Math.max(1, Math.round(questionCount * 0.4));
  const cardFieldStart = needsPhoto ? 2 : 1;
  const questionStart = cardFieldStart + cardTextFields.length;

  // Card-only projects generate a card; anything that also collects answers is a submission.
  const isCardOnly = needsCard && formQuestions.length === 0;
  const submitLabel = isCardOnly ? 'Generate my card' : needsCard ? 'Submit' : 'Submit response';
  const submittingLabel = isCardOnly
    ? 'Generating your card…'
    : needsCard
      ? 'Submitting…'
      : 'Sending…';

  const topBar = (
    <div className="sticky top-0 z-40 border-b border-foreground/10 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link to="/" aria-label="Cardlify" className="transition hover:opacity-60">
          <Wordmark />
        </Link>
        <span className="mono-label flex items-center gap-2 text-[9px] text-foreground/40">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" />
          {project?.status === 'active' ? 'Accepting responses' : 'Closed'}
        </span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-7 bg-background">
        <Wordmark />
        <Loader2 className="h-6 w-6 animate-spin text-foreground/30" />
        <p className="mono-label text-[9px] text-foreground/35">Preparing your form…</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="surface max-w-md p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary">
            <AlertCircle className="h-6 w-6 text-foreground/40" />
          </div>
          <h2 className="display-md mt-5">This form is closed</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/50">
            The submission form is not active or no longer exists. Ask the organiser for a fresh
            link.
          </p>
          <a
            href="/"
            className="mono-label mt-6 inline-flex text-[9px] text-foreground/45 underline-offset-4 hover:text-foreground hover:underline"
          >
            Cardlify studio
          </a>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        {topBar}

        <div className="mx-auto flex max-w-3xl flex-col items-center px-5 py-14 sm:px-8 sm:py-20">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-lime shadow-[0_24px_60px_-28px_hsl(var(--lime))]">
            <CheckCircle className="h-9 w-9 text-foreground" strokeWidth={1.75} />
          </div>

          <span className="mono-label mt-7 inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-white/60 px-3 py-1.5 text-[9px] text-foreground/45">
            {generatedCardUrl ? 'Card ready' : 'Response recorded'}
          </span>

          <h2 className="display-lg mt-5 text-center">
            {generatedCardUrl ? (
              <>
                Looking <span className="serif text-[1.05em]">good.</span>
              </>
            ) : (
              <>
                Thank <span className="serif text-[1.05em]">you.</span>
              </>
            )}
          </h2>
          <p className="mt-4 max-w-md text-center text-sm leading-relaxed text-foreground/55">
            {generatedCardUrl
              ? `Your personalised card for ${project.project_name} is ready — download it, save it, share it.`
              : `Your answers are with the organiser of ${project.project_name}. You can close this tab.`}
          </p>

          {generatedCardUrl && (
            <>
              <div className="mt-9 w-full max-w-md overflow-hidden rounded-[1.75rem] border border-foreground/10 bg-white/70 p-3 shadow-[0_30px_80px_-50px_hsl(var(--ink))]">
                <img
                  src={generatedCardUrl}
                  alt="Generated card"
                  className="mx-auto max-w-full rounded-2xl"
                  style={{ maxHeight: '480px' }}
                />
              </div>

              <Button onClick={downloadCard} size="lg" className="mt-6 w-full max-w-md rounded-full">
                <Download className="h-4 w-4" />
                Download your card
              </Button>

              <p className="mono-label mt-4 text-[9px] text-foreground/35">
                Save it to your phone · share it anywhere
              </p>
            </>
          )}

          <Link
            to="/"
            className="mono-label mt-10 text-[9px] text-foreground/40 underline-offset-4 transition hover:text-foreground hover:underline"
          >
            Made with Cardlify
          </Link>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {topBar}

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        {headerImageUrl && (
          <div className="overflow-hidden rounded-[2rem] border border-foreground/10 bg-white/50 shadow-[0_24px_70px_-56px_hsl(var(--ink))]">
            <img
              src={headerImageUrl}
              alt={`${displayTitle} header`}
              className="h-44 w-full object-cover sm:h-64"
            />
          </div>
        )}

        <div
          className={`grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12 ${
            headerImageUrl ? 'mt-10' : ''
          }`}
        >
          <div className="lg:sticky lg:top-24 lg:self-start">
            <span className="mono-label inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-white/50 px-3 py-1.5 text-[9px] text-foreground/50">
              {project.project_name}
              <span className="h-1 w-1 rounded-full bg-foreground/25" />
              {needsCard ? (formQuestions.length ? 'form + card' : 'card pickup') : 'form'}
            </span>

            <h1 className="display-lg mt-6">{displayTitle}</h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-foreground/60">
              {project.form_description ||
                (needsCard
                  ? 'Add your details below and your personalised card is generated instantly. No account, no waiting.'
                  : 'Answer a few questions below. Your organiser sees the responses right away.')}
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              <span className="mono-label rounded-full bg-lilac/60 px-3 py-1.5 text-[9px] text-foreground/60">
                {questionCount} {questionCount === 1 ? 'question' : 'questions'}
              </span>
              <span className="mono-label rounded-full bg-secondary px-3 py-1.5 text-[9px] text-foreground/55">
                ~{minutes} min
              </span>
              <span className="mono-label rounded-full bg-lime/60 px-3 py-1.5 text-[9px] text-foreground/60">
                No account needed
              </span>
            </div>

            {!isFullyLoaded && (
              <div className="mt-7 flex max-w-md items-center gap-3 rounded-2xl border border-foreground/10 bg-lilac/30 p-4 text-left">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-foreground/50" />
                <div>
                  <p className="text-sm font-medium">
                    {loading ? 'Loading form properties' : 'Loading fonts for the card'}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground/45">
                    {loading
                      ? 'Fetching the template configuration…'
                      : 'Getting 22 premium fonts ready…'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="surface p-5 sm:p-8">
            <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
              <span className="mono-label text-[9px] text-foreground/40">Your answers</span>
              <span className="mono-label text-[9px] text-foreground/30">Step 1 of 1</span>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {needsPhoto && (
                <div className="rounded-2xl border border-foreground/10 bg-white/55 p-4 transition focus-within:border-foreground/25 focus-within:bg-white/80 sm:p-5">
                  <Label className="flex items-start gap-2.5 text-sm font-medium leading-snug tracking-tight text-foreground">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-foreground/[0.06] text-[10px] font-medium text-foreground/50">
                      01
                    </span>
                    <span>
                      Your photo <span className="text-coral">*</span>
                    </span>
                  </Label>

                  <div className="mt-3">
                    {photoPreview ? (
                      <div className="flex items-center gap-4 rounded-2xl border border-foreground/10 bg-white/70 p-3">
                        <img
                          src={photoPreview}
                          alt="Your photo preview"
                          className="h-20 w-20 rounded-full border border-foreground/10 object-cover"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground/70">Photo added</p>
                          <p className="mt-0.5 text-[11px] text-foreground/40">Looks good?</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2 rounded-full"
                            onClick={() => {
                              setPhotoFile(null);
                              setPhotoPreview(null);
                            }}
                            disabled={!isFullyLoaded}
                          >
                            Change photo
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <label
                        className={`flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed px-4 py-5 transition ${
                          isFullyLoaded
                            ? 'border-foreground/20 bg-background/40 hover:border-foreground/40 hover:bg-white/70'
                            : 'cursor-not-allowed border-foreground/10 bg-background/30 opacity-60'
                        }`}
                      >
                        <div
                          className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${
                            isFullyLoaded ? 'bg-lilac/70' : 'bg-secondary'
                          }`}
                        >
                          {isFullyLoaded ? (
                            <Camera className="h-5 w-5 text-foreground/50" />
                          ) : (
                            <Loader2 className="h-5 w-5 animate-spin text-foreground/40" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {isFullyLoaded ? 'Upload your photo' : 'Please wait…'}
                          </p>
                          <p className="mt-0.5 text-xs text-foreground/45">
                            {isFullyLoaded ? 'A clear face photo works best · JPG or PNG, max 5MB' : 'Loading properties'}
                          </p>
                        </div>
                        <span className="mono-label ml-auto hidden shrink-0 rounded-full border border-foreground/15 px-3 py-1.5 text-[9px] text-foreground/50 sm:block">
                          Browse
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={handlePhotoChange}
                          className="hidden"
                          disabled={!isFullyLoaded}
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {cardTextFields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-2xl border border-foreground/10 bg-white/55 p-4 transition focus-within:border-foreground/25 focus-within:bg-white/80 sm:p-5"
                >
                  <Label
                    htmlFor={field.id}
                    className="flex items-start gap-2.5 text-sm font-medium leading-snug tracking-tight text-foreground"
                  >
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-foreground/[0.06] text-[10px] font-medium text-foreground/50">
                      {String(index + cardFieldStart).padStart(2, '0')}
                    </span>
                    <span>
                      {field.field_name} <span className="text-coral">*</span>
                    </span>
                  </Label>
                  <Input
                    id={field.id}
                    placeholder={
                      isFullyLoaded ? `Enter your ${field.field_name.toLowerCase()}` : 'Please wait…'
                    }
                    value={formData[field.field_name] || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [field.field_name]: e.target.value,
                      })
                    }
                    maxLength={100}
                    className="mt-3 h-12 rounded-xl border-foreground/15 bg-white/80 transition placeholder:text-foreground/30 focus-visible:ring-4 focus-visible:ring-lilac/50"
                    disabled={!isFullyLoaded}
                  />
                </div>
              ))}

              {formQuestions.map((question, index) => {
                const value = answers[question.label];
                const update = (next: string | string[]) =>
                  setAnswers({ ...answers, [question.label]: next });

                return (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-foreground/10 bg-white/55 p-4 transition focus-within:border-foreground/25 focus-within:bg-white/80 sm:p-5"
                  >
                    <Label
                      htmlFor={`q-${question.id}`}
                      className="flex items-start gap-2.5 text-sm font-medium leading-snug tracking-tight text-foreground"
                    >
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-foreground/[0.06] text-[10px] font-medium text-foreground/50">
                        {String(index + questionStart).padStart(2, '0')}
                      </span>
                      <span>
                        {question.label}
                        {question.required && <span className="ml-1 text-coral">*</span>}
                      </span>
                    </Label>

                    {(question.field_type === 'short_text' ||
                      question.field_type === 'email' ||
                      question.field_type === 'number' ||
                      question.field_type === 'date') && (
                      <Input
                        id={`q-${question.id}`}
                        type={
                          question.field_type === 'email'
                            ? 'email'
                            : question.field_type === 'number'
                              ? 'number'
                              : question.field_type === 'date'
                                ? 'date'
                                : 'text'
                        }
                        placeholder={question.placeholder || undefined}
                        value={typeof value === 'string' ? value : ''}
                        onChange={(e) => update(e.target.value)}
                        className="mt-3 h-12 rounded-xl border-foreground/15 bg-white/80 transition placeholder:text-foreground/30 focus-visible:ring-4 focus-visible:ring-lilac/50"
                        disabled={!isFullyLoaded}
                      />
                    )}

                    {question.field_type === 'long_text' && (
                      <textarea
                        id={`q-${question.id}`}
                        rows={4}
                        placeholder={question.placeholder || undefined}
                        value={typeof value === 'string' ? value : ''}
                        onChange={(e) => update(e.target.value)}
                        className="mt-3 w-full rounded-2xl border border-foreground/15 bg-white/80 px-4 py-3 text-sm outline-none transition placeholder:text-foreground/30 focus:border-foreground/30 focus:ring-4 focus:ring-lilac/50"
                        disabled={!isFullyLoaded}
                      />
                    )}

                    {question.field_type === 'dropdown' && (
                      <select
                        id={`q-${question.id}`}
                        value={typeof value === 'string' ? value : ''}
                        onChange={(e) => update(e.target.value)}
                        className="mt-3 h-12 w-full rounded-xl border border-foreground/15 bg-white/80 px-3 text-sm outline-none transition focus:border-foreground/30 focus:ring-4 focus:ring-lilac/50"
                        disabled={!isFullyLoaded}
                      >
                        <option value="">Choose an option…</option>
                        {question.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}

                    {question.field_type === 'radio' && (
                      <div className="mt-3 space-y-2">
                        {question.options.map((option) => (
                          <label
                            key={option}
                            className="flex cursor-pointer items-center gap-3 rounded-xl border border-foreground/10 bg-white/60 px-4 py-3 text-sm transition hover:border-foreground/25 hover:bg-white has-[:checked]:border-foreground/40 has-[:checked]:bg-white has-[:checked]:shadow-sm"
                          >
                            <input
                              type="radio"
                              name={`q-${question.id}`}
                              checked={value === option}
                              onChange={() => update(option)}
                              className="h-4 w-4 accent-foreground"
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                    )}

                    {question.field_type === 'checkbox' && (
                      <div className="mt-3 space-y-2">
                        {question.options.map((option) => {
                          const selected = Array.isArray(value) ? value : [];
                          return (
                            <label
                              key={option}
                              className="flex cursor-pointer items-center gap-3 rounded-xl border border-foreground/10 bg-white/60 px-4 py-3 text-sm transition hover:border-foreground/25 hover:bg-white has-[:checked]:border-foreground/40 has-[:checked]:bg-white has-[:checked]:shadow-sm"
                            >
                              <input
                                type="checkbox"
                                checked={selected.includes(option)}
                                onChange={(e) =>
                                  update(
                                    e.target.checked
                                      ? [...selected, option]
                                      : selected.filter((item) => item !== option),
                                  )
                                }
                                className="h-4 w-4 rounded accent-foreground"
                              />
                              {option}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {question.help_text && (
                      <p className="mt-1.5 text-xs text-foreground/40">{question.help_text}</p>
                    )}
                  </div>
                );
              })}

              <div className="border-t border-foreground/10 pt-5">
                {!isFullyLoaded ? (
                  <div className="flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-foreground/15 text-sm text-foreground/50">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Preparing properties…
                  </div>
                ) : (
                  <Button type="submit" size="lg" className="group w-full rounded-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {submittingLabel}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        {submitLabel}
                        <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </Button>
                )}
                <p className="mono-label mt-4 flex items-center justify-center gap-1.5 text-[9px] text-foreground/35">
                  <Lock className="h-3 w-3" />
                  Your answers go straight to the organiser
                </p>
              </div>
            </form>
          </div>
        </div>

        <p className="mono-label mt-10 text-center text-[9px] text-foreground/30">
          Private by default · organised with Cardlify
        </p>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="hidden" aria-hidden="true">
        {PREMIUM_FONTS.map((font) =>
          font.weights.map((weight) => (
            <div
              key={`${font.name}-${weight}`}
              style={{
                fontFamily: font.name,
                fontWeight: weight,
                fontSize: '16px',
              }}
            >
              Font Preload: {font.name} {weight}
            </div>
          )),
        )}
      </div>
    </div>
  );
}
