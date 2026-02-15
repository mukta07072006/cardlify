import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { extractProjectId } from '@/lib/urlUtils';
import { 
  Upload, 
  Loader2, 
  Download,
  CheckCircle,
  AlertCircle,
  User,
  Sparkles
} from 'lucide-react';

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
  template_image_url: string;
  status: string;
  user_id: string;
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
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    
    const hasPhotoField = fields.some(f => f.field_type === 'photo');
    if (hasPhotoField && !photoFile) {
      toast.error('Please upload a photo');
      return;
    }

    // Validate text fields
    const textFields = fields.filter(f => f.field_type === 'text');
    for (const field of textFields) {
      if (!formData[field.field_name]?.trim()) {
        toast.error(`Please fill in ${field.field_name}`);
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

      // Generate card
      const cardUrl = await generateCard(photoUrl);

      // Save submission
      const { error: submissionError } = await supabase
        .from('submissions')
        .insert({
          project_id: project!.id,
          participant_name: formData['Name'] || formData[Object.keys(formData)[0]] || 'Unknown',
          participant_id: formData['ID'] || null,
          department: formData['Department'] || null,
          role: formData['Role'] || null,
          photo_url: photoUrl || null,
          generated_card_url: cardUrl,
          field_values: formData
        });

      if (submissionError) throw submissionError;

      setGeneratedCardUrl(cardUrl);
      setSubmitted(true);
      toast.success('Your card has been generated!');
    } catch (error) {
      console.error('Error submitting:', error);
      toast.error('Failed to generate card. Please try again.');
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

  const isFullyLoaded = !loading && fontsLoaded;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <p className="text-muted-foreground text-lg">Loading form properties...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Form Not Available</h2>
            <p className="text-muted-foreground">
              This submission form is currently not active or doesn't exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="max-w-2xl w-full shadow-2xl animate-fade-in">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Card Generated Successfully!
              </h2>
              <p className="text-muted-foreground text-lg">
                Your personalized card is ready to download
              </p>
            </div>
            
            {generatedCardUrl && (
              <div className="mb-8">
                <img 
                  src={generatedCardUrl} 
                  alt="Generated Card" 
                  className="max-w-full rounded-xl shadow-2xl mx-auto border-4 border-white"
                  style={{ maxHeight: '500px' }}
                />
              </div>
            )}

            <Button 
              onClick={downloadCard} 
              size="lg" 
              className="w-full max-w-md bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-6"
            >
              <Download className="w-6 h-6 mr-2" />
              Download Your Card
            </Button>
          </CardContent>
        </Card>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="relative">
              <img 
                src="/cardlify.png" 
                alt="Cardlify Logo" 
                className="h-12 object-contain"
              />
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-500 animate-pulse" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            {project.project_name}
          </h1>
          <p className="text-muted-foreground text-lg">
            Fill in your details to generate your personalized card
          </p>
          
          {/* Loading Banner */}
          {!isFullyLoaded && (
            <div className="mt-6 mx-auto max-w-md bg-amber-50 border-2 border-amber-200 rounded-lg p-4 flex items-center gap-3 animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin text-amber-600 flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-amber-900 text-sm">
                  {loading ? 'Loading Form Properties' : 'Loading Fonts for Canvas'}
                </p>
                <p className="text-xs text-amber-700">
                  {loading 
                    ? 'Fetching template configuration...' 
                    : 'Loading 22 premium fonts, please wait...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Form Card */}
        <Card className="shadow-2xl border-2">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="text-2xl">Your Information</CardTitle>
            <CardDescription className="text-base">
              Please provide the required details below
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo Upload */}
              {fields.some(f => f.field_type === 'photo') && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Your Photo *</Label>
                  <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    isFullyLoaded 
                      ? 'border-blue-300 bg-blue-50/50 hover:bg-blue-50' 
                      : 'border-gray-300 bg-gray-50 opacity-60 cursor-not-allowed'
                  }`}>
                    {photoPreview ? (
                      <div className="space-y-4">
                        <img 
                          src={photoPreview} 
                          alt="Preview" 
                          className="w-40 h-40 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPhotoFile(null);
                            setPhotoPreview(null);
                          }}
                          disabled={!isFullyLoaded}
                          className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                        >
                          Change Photo
                        </Button>
                      </div>
                    ) : (
                      <label className={`block ${isFullyLoaded ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                        <div className="flex flex-col items-center gap-4">
                          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                            isFullyLoaded 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                              : 'bg-gray-300'
                          }`}>
                            <User className={`w-10 h-10 ${isFullyLoaded ? 'text-white' : 'text-gray-500'}`} />
                          </div>
                          <div>
                            <p className={`font-semibold text-lg ${isFullyLoaded ? 'text-foreground' : 'text-gray-400'}`}>
                              {isFullyLoaded ? 'Upload your photo' : 'Please wait...'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {isFullyLoaded ? 'JPG or PNG, max 5MB' : 'Loading properties'}
                            </p>
                          </div>
                          <span className={`inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-10 px-6 ${
                            isFullyLoaded 
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white pointer-events-none' 
                              : 'bg-gray-300 text-gray-500 pointer-events-none'
                          }`}>
                            {isFullyLoaded ? (
                              <>
                                <Upload className="w-4 h-4" />
                                Choose Photo
                              </>
                            ) : (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading...
                              </>
                            )}
                          </span>
                        </div>
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

              {/* Text Fields */}
              {fields
                .filter(f => f.field_type === 'text')
                .map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id} className="text-base font-semibold">
                      {field.field_name} *
                    </Label>
                    <Input
                      id={field.id}
                      placeholder={isFullyLoaded ? `Enter your ${field.field_name.toLowerCase()}` : 'Please wait...'}
                      value={formData[field.field_name] || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        [field.field_name]: e.target.value
                      })}
                      maxLength={100}
                      className="h-12 text-base"
                      disabled={!isFullyLoaded}
                    />
                  </div>
                ))}

              {/* Submit Button / Loading Message */}
              {!isFullyLoaded ? (
                <div className="w-full bg-gradient-to-r from-gray-400 to-gray-500 text-white text-lg py-6 rounded-lg flex items-center justify-center gap-3 cursor-not-allowed">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Please wait, properties loading...</span>
                </div>
              ) : (
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-6" 
                  size="lg" 
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Your Card...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate My Card
                    </>
                  )}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Font Preloader - renders all fonts in DOM to ensure they're cached */}
        <div className="hidden" aria-hidden="true">
          {PREMIUM_FONTS.map(font => 
            font.weights.map(weight => (
              <div 
                key={`${font.name}-${weight}`}
                style={{ 
                  fontFamily: font.name, 
                  fontWeight: weight,
                  fontSize: '16px'
                }}
              >
                Font Preload: {font.name} {weight}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}