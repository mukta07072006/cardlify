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
  CreditCard,
  Download,
  CheckCircle,
  AlertCircle,
  User,
  ArrowLeft
} from 'lucide-react';

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
  font_bold: boolean;
  font_italic: boolean;
  text_align: 'left' | 'center' | 'right';
  border_enabled: boolean;
  border_size: number;
  border_color: string;
  background_color: string;
  background_opacity: number;
  shape: 'rectangle' | 'rounded' | 'circle';
}

interface Project {
  id: string;
  project_name: string;
  template_image_url: string;
  status: string;
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
  
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const normalizeField = (f: any): Field => {
    const width = clamp(Number.isFinite(f.width) ? f.width : 20, 1, 100);
    const height = clamp(Number.isFinite(f.height) ? f.height : 5, 1, 100);
    const x_position = clamp(Number.isFinite(f.x_position) ? f.x_position : 0, 0, 100 - width);
    const y_position = clamp(Number.isFinite(f.y_position) ? f.y_position : 0, 0, 100 - height);
    const font_size_raw = Number.isFinite(f.font_size) && f.font_size > 0 ? f.font_size : 16;
    const font_size = clamp(font_size_raw, 8, 72);

    return {
      ...f,
      field_type: f.field_type as 'photo' | 'text',
      shape: (f.shape || 'rectangle') as 'rectangle' | 'rounded' | 'circle',
      font_family: f.font_family || 'Inter',
      font_bold: !!f.font_bold,
      font_italic: !!f.font_italic,
      text_align: (f.text_align || 'left') as 'left' | 'center' | 'right',
      font_color: f.font_color || '#000000',
      border_enabled: !!f.border_enabled,
      border_size: Number.isFinite(f.border_size) ? f.border_size : 0,
      border_color: f.border_color || '#000000',
      background_color: f.background_color || '#ffffff',
      background_opacity: Number.isFinite(f.background_opacity) ? f.background_opacity : 0,
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
            // For slug-based lookup, we'd need to query by slug
            // This would require a slug column in the database
            // For now, we'll redirect to the ID-based URL
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

        // Load fields
        const { data: fieldsData, error: fieldsError } = await supabase
          .from('fields')
          .select('*')
          .eq('project_id', actualProjectId)
          .order('created_at', { ascending: true });

        if (fieldsError) throw fieldsError;
        const normalizedFields = (fieldsData || []).map(normalizeField);
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

  const fetchProjectData = async () => {
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('status', 'active')
        .single();

      if (projectError) {
        if (projectError.code === 'PGRST116') {
          toast.error('This project is not available');
        } else {
          throw projectError;
        }
        return;
      }

      setProject(projectData);

      // Fetch the project owner's profile to check subscription tier
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('user_id', projectData.user_id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        // Default to free tier if profile fetch fails
        setIsProjectOwnerElite(false);
      } else {
        const isElite = profileData.subscription_tier === 'elite';
        setIsProjectOwnerElite(isElite);
      }

      const { data: fieldsData, error: fieldsError } = await supabase
        .from('fields')
        .select('*')
        .eq('project_id', projectId);

      if (fieldsError) throw fieldsError;
      
      // Convert fields - handle legacy pixel values by converting to percentages
      setFields(fieldsData?.map(f => {
        const isLegacyFormat = f.x_position > 100 || f.y_position > 100 || f.width > 100 || f.height > 100;
        
        if (isLegacyFormat) {
          return normalizeField({
            ...f,
            x_position: Math.min(90, (f.x_position / 800) * 100),
            y_position: Math.min(90, (f.y_position / 600) * 100),
            width: Math.max(5, Math.min(50, (f.width / 800) * 100)),
            height: Math.max(5, Math.min(50, (f.height / 600) * 100)),
          });
        }
        
        return normalizeField(f);
      }) || []);

      // Initialize form data
      const initialData: Record<string, string> = {};
      fieldsData?.forEach(field => {
        if (field.field_type === 'text') {
          initialData[field.field_name] = '';
        }
      });
      setFormData(initialData);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const [isProjectOwnerElite, setIsProjectOwnerElite] = useState(true); // Default to true to avoid watermark initially

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

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject('Context not available');
        return;
      }

      const templateImg = new Image();
      templateImg.crossOrigin = 'anonymous';
      
      templateImg.onload = async () => {
        canvas.width = templateImg.naturalWidth;
        canvas.height = templateImg.naturalHeight;
        
        // Draw template
        ctx.drawImage(templateImg, 0, 0);

        // Draw fields - positions are stored as percentages (0-100)
        for (const field of fields) {
          // Convert percentage positions to actual pixels on the canvas
          const x = (field.x_position / 100) * canvas.width;
          const y = (field.y_position / 100) * canvas.height;
          const width = (field.width / 100) * canvas.width;
          const height = (field.height / 100) * canvas.height;
          const borderSize = field.border_size || 0;
          const cornerRadius = field.shape === 'circle' 
            ? Math.min(width, height) / 2 
            : field.shape === 'rounded' 
              ? 12 
              : 0;

          // Helper to draw rounded rect path
          const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
            ctx.beginPath();
            if (r >= Math.min(w, h) / 2) {
              // Draw ellipse/circle for circular shape
              ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, Math.PI * 2);
            } else {
              ctx.moveTo(x + r, y);
              ctx.lineTo(x + w - r, y);
              ctx.quadraticCurveTo(x + w, y, x + w, y + r);
              ctx.lineTo(x + w, y + h - r);
              ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
              ctx.lineTo(x + r, y + h);
              ctx.quadraticCurveTo(x, y + h, x, y + h - r);
              ctx.lineTo(x, y + r);
              ctx.quadraticCurveTo(x, y, x + r, y);
            }
            ctx.closePath();
          };

          if (field.field_type === 'photo' && photoUrl) {
            try {
              const photoImg = new Image();
              photoImg.crossOrigin = 'anonymous';
              await new Promise<void>((res, rej) => {
                photoImg.onload = () => {
                  ctx.save();
                  
                  // Create clipping path for shape
                  drawRoundedRect(x, y, width, height, cornerRadius);
                  ctx.clip();
                  
                  // Fit image to field
                  const aspectRatio = photoImg.width / photoImg.height;
                  const fieldAspectRatio = width / height;
                  
                  let drawWidth, drawHeight, drawX, drawY;
                  
                  if (aspectRatio > fieldAspectRatio) {
                    drawHeight = height;
                    drawWidth = height * aspectRatio;
                    drawX = x - (drawWidth - width) / 2;
                    drawY = y;
                  } else {
                    drawWidth = width;
                    drawHeight = width / aspectRatio;
                    drawX = x;
                    drawY = y - (drawHeight - height) / 2;
                  }
                  
                  ctx.drawImage(photoImg, drawX, drawY, drawWidth, drawHeight);
                  ctx.restore();

                  // Draw border if enabled
                  if (field.border_enabled && borderSize > 0) {
                    ctx.save();
                    drawRoundedRect(x, y, width, height, cornerRadius);
                    ctx.strokeStyle = field.border_color;
                    ctx.lineWidth = borderSize;
                    ctx.stroke();
                    ctx.restore();
                  }

                  res();
                };
                photoImg.onerror = rej;
                photoImg.src = photoUrl;
              });
            } catch (e) {
              console.error('Error loading photo:', e);
            }
          } else if (field.field_type === 'text') {
            // Draw background if opacity > 0
            if (field.background_opacity > 0) {
              ctx.save();
              const bgColor = field.background_color || '#ffffff';
              ctx.fillStyle = bgColor;
              ctx.globalAlpha = field.background_opacity;
              drawRoundedRect(x, y, width, height, cornerRadius);
              ctx.fill();
              ctx.restore();
            }

            // Draw border if enabled
            if (field.border_enabled && borderSize > 0) {
              ctx.save();
              drawRoundedRect(x, y, width, height, cornerRadius);
              ctx.strokeStyle = field.border_color;
              ctx.lineWidth = borderSize;
              ctx.stroke();
              ctx.restore();
            }

            // Draw text - font_size is stored as actual pixel value, scale based on canvas resolution
            const text = formData[field.field_name] || '';
            // Scale font size proportionally - assume editor was ~600px height, scale to actual canvas
            const scaleFactor = canvas.height / 600;
            const scaledFontSize = Math.max(12, (Number.isFinite(field.font_size) ? field.font_size : 16) * scaleFactor);
            
            // Build font string with bold/italic
            const fontWeight = field.font_bold ? 'bold' : 'normal';
            const fontStyle = field.font_italic ? 'italic' : 'normal';
            const fontFamily = field.font_family || 'Inter';
            ctx.font = `${fontStyle} ${fontWeight} ${scaledFontSize}px ${fontFamily}, sans-serif`;
            ctx.fillStyle = field.font_color;
            ctx.textBaseline = 'middle';

            const paddingX = (field.border_enabled ? borderSize : 0) + 4;
            const maxTextWidth = Math.max(0, width - paddingX * 2);

            const fitTextToWidth = (raw: string, maxWidthPx: number) => {
              if (!raw) return '';
              if (maxWidthPx <= 0) return '';
              if (ctx.measureText(raw).width <= maxWidthPx) return raw;
              const ellipsis = '…';
              let lo = 0;
              let hi = raw.length;
              while (lo < hi) {
                const mid = Math.floor((lo + hi) / 2);
                const candidate = raw.slice(0, mid) + ellipsis;
                if (ctx.measureText(candidate).width <= maxWidthPx) lo = mid + 1;
                else hi = mid;
              }
              const len = Math.max(0, lo - 1);
              return raw.slice(0, len) + ellipsis;
            };

            // Clip to field bounds so text never renders outside the box.
            ctx.save();
            drawRoundedRect(x, y, width, height, cornerRadius);
            ctx.clip();

            const align = field.text_align || 'left';
            ctx.textAlign = align;
            const textX =
              align === 'center'
                ? x + width / 2
                : align === 'right'
                  ? x + width - paddingX
                  : x + paddingX;

            ctx.fillText(fitTextToWidth(text, maxTextWidth), textX, y + height / 2);
            ctx.restore();
          }
        }

        // Convert to blob and upload
        // Add watermark if the project owner is not elite
        if (!isProjectOwnerElite) {
          // Draw watermark in bottom right corner
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; // Semi-transparent
          ctx.font = 'bold 16px Inter, Arial, sans-serif';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText('cardlify', canvas.width - 10, canvas.height - 10);
        }

        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject('Failed to generate image');
            return;
          }

          const fileName = `${projectId}/${Date.now()}.png`;
          const { error: uploadError } = await supabase.storage
            .from('cards')
            .upload(fileName, blob);

          if (uploadError) {
            reject(uploadError);
            return;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('cards')
            .getPublicUrl(fileName);

          resolve(publicUrl);
        }, 'image/png');
      };

      templateImg.onerror = () => reject('Failed to load template');
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
        const fileName = `${projectId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, photoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName);
        
        photoUrl = publicUrl;
      }

      // Generate card
      const cardUrl = await generateCard(photoUrl);

      // Save submission
      const { error: submissionError } = await supabase
        .from('submissions')
        .insert({
          project_id: projectId,
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
      link.download = 'my-card.png';
      link.target = '_blank';
      link.click();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Form Not Available</h2>
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
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-lg w-full animate-fade-in">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-success mb-4" />
            <h2 className="text-2xl font-bold mb-2">Card Generated!</h2>
            <p className="text-muted-foreground mb-6">
              Your personalized card is ready to download
            </p>
            
            {generatedCardUrl && (
              <div className="mb-6">
                <img 
                  src={generatedCardUrl} 
                  alt="Generated Card" 
                  className="max-w-full rounded-lg shadow-lg mx-auto"
                />
              </div>
            )}

            <Button onClick={downloadCard} size="lg" className="w-full">
              <Download className="w-5 h-5 mr-2" />
              Download Your Card
            </Button>
          </CardContent>
        </Card>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div  className="flex items-center gap-2 group cursor-pointer text-center justify-center mb-4">
                    <img 
                      src="/cardlify.png" 
                      alt="Cardlify Logo" 
                      className="h-10 object-contain"
                    />
                  </div>
          <h1 className="text-2xl font-bold text-foreground">{project.project_name}</h1>
          <p className="text-muted-foreground mt-1">Fill in your details to generate your card</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
            <CardDescription>Please provide the required details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo Upload */}
              {fields.some(f => f.field_type === 'photo') && (
                <div className="space-y-2">
                  <Label>Your Photo</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    {photoPreview ? (
                      <div className="space-y-4">
                        <img 
                          src={photoPreview} 
                          alt="Preview" 
                          className="w-32 h-32 rounded-full object-cover mx-auto"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPhotoFile(null);
                            setPhotoPreview(null);
                          }}
                        >
                          Change Photo
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Upload your photo</p>
                            <p className="text-sm text-muted-foreground">JPG or PNG, max 5MB</p>
                          </div>
                          <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 pointer-events-none">
                            <Upload className="w-4 h-4" />
                            Choose Photo
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={handlePhotoChange}
                          className="hidden"
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
                    <Label htmlFor={field.id}>{field.field_name}</Label>
                    <Input
                      id={field.id}
                      placeholder={`Enter your ${field.field_name.toLowerCase()}`}
                      value={formData[field.field_name] || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        [field.field_name]: e.target.value
                      })}
                      maxLength={100}
                    />
                  </div>
                ))}

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Your Card...
                  </>
                ) : (
                  <>
                    Generate My Card
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}