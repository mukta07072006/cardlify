import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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
  CreditCard,
  GripVertical,
  Circle,
  Square,
  RectangleHorizontal,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  // Keep fields inside the canvas + prevent invalid numeric defaults.
  const normalizeField = (field: Field): Field => {
    const width = clamp(Number.isFinite(field.width) ? field.width : 20, 1, 100);
    const height = clamp(Number.isFinite(field.height) ? field.height : 5, 1, 100);
    const x_position = clamp(Number.isFinite(field.x_position) ? field.x_position : 0, 0, 100 - width);
    const y_position = clamp(Number.isFinite(field.y_position) ? field.y_position : 0, 0, 100 - height);
    const font_size_raw = Number.isFinite(field.font_size) && field.font_size > 0 ? field.font_size : 16;
    const font_size = clamp(font_size_raw, 8, 72);

    return {
      ...field,
      width,
      height,
      x_position,
      y_position,
      font_size,
      text_align: (field.text_align || 'left') as Field['text_align'],
    };
  };

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
      
      // Convert fields - handle legacy pixel values by converting to percentages
      // If values are > 100, they're likely old pixel values and need conversion
      // We'll assume a reference canvas of ~800px width for migration
      setFields(fieldsData?.map(f => {
        const isLegacyFormat = f.x_position > 100 || f.y_position > 100 || f.width > 100 || f.height > 100;
        
        const fontSize = (typeof f.font_size === 'number' && f.font_size > 0) ? f.font_size : 16;

        if (isLegacyFormat) {
          // Convert from pixels (assuming ~800px reference) to percentages
          return normalizeField({
            ...f,
            field_type: f.field_type as 'photo' | 'text',
            shape: (f.shape || 'rectangle') as 'rectangle' | 'rounded' | 'circle',
            font_family: f.font_family || 'Inter',
            font_bold: f.font_bold || false,
            font_italic: f.font_italic || false,
            text_align: (f.text_align || 'left') as 'left' | 'center' | 'right',
            font_size: fontSize,
            x_position: Math.min(90, (f.x_position / 800) * 100),
            y_position: Math.min(90, (f.y_position / 600) * 100),
            width: Math.max(5, Math.min(50, (f.width / 800) * 100)),
            height: Math.max(5, Math.min(50, (f.height / 600) * 100)),
          } as Field);
        }

        return normalizeField({
          ...f,
          field_type: f.field_type as 'photo' | 'text',
          shape: (f.shape || 'rectangle') as 'rectangle' | 'rounded' | 'circle',
          font_family: f.font_family || 'Inter',
          font_bold: f.font_bold || false,
          font_italic: f.font_italic || false,
          text_align: (f.text_align || 'left') as 'left' | 'center' | 'right',
          font_size: fontSize,
        } as Field);
      }) || []);
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

  const addField = (type: 'photo' | 'text') => {
    // Default values as percentages (0-100)
    const newField: Field = {
      id: `temp-${Date.now()}`,
      field_type: type,
      field_name: type === 'photo' ? 'Photo' : 'Name',
      x_position: 10, // 10% from left
      y_position: 10, // 10% from top
      width: type === 'photo' ? 15 : 20, // percentage of canvas width
      height: type === 'photo' ? 20 : 5, // percentage of canvas height
      font_size: 16,
      font_color: '#000000',
      font_family: 'Inter',
      font_bold: false,
      font_italic: false,
      text_align: 'left',
      border_enabled: false,
      border_size: 2,
      border_color: '#000000',
      background_color: '#ffffff',
      background_opacity: 0,
      shape: type === 'photo' ? 'rectangle' : 'rectangle'
    };
    setFields([...fields, newField]);
    setSelectedField(newField.id);
  };

  const updateField = (id: string, updates: Partial<Field>) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        return normalizeField({ ...f, ...updates } as Field);
      })
    );
  };

  const deleteField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    if (selectedField === id) setSelectedField(null);
  };

  const handleMouseDown = (e: React.MouseEvent, fieldId: string, isResize = false) => {
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    if (isResize) {
      setResizing(fieldId);
    } else {
      setDragging(fieldId);
      // Convert stored percentage to pixels for drag offset
      const xPx = (field.x_position / 100) * rect.width;
      const yPx = (field.y_position / 100) * rect.height;
      setDragOffset({
        x: e.clientX - rect.left - xPx,
        y: e.clientY - rect.top - yPx
      });
    }
    setSelectedField(fieldId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging && !resizing) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const fieldId = dragging || resizing;
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    if (dragging) {
      // Calculate position as percentage of canvas
      const xPx = Math.max(0, Math.min(rect.width - field.width * rect.width / 100, e.clientX - rect.left - dragOffset.x));
      const yPx = Math.max(0, Math.min(rect.height - field.height * rect.height / 100, e.clientY - rect.top - dragOffset.y));
      // Store as percentage (0-100)
      const xPercent = (xPx / rect.width) * 100;
      const yPercent = (yPx / rect.height) * 100;
      updateField(fieldId!, { x_position: xPercent, y_position: yPercent });
    } else if (resizing) {
      // Calculate size as percentage of canvas
      const maxWidthPx = rect.width - (field.x_position * rect.width / 100);
      const maxHeightPx = rect.height - (field.y_position * rect.height / 100);
      const widthPx = Math.max(
        30,
        Math.min(maxWidthPx, e.clientX - rect.left - (field.x_position * rect.width / 100))
      );
      const heightPx = Math.max(
        20,
        Math.min(maxHeightPx, e.clientY - rect.top - (field.y_position * rect.height / 100))
      );
      // Store as percentage (0-100)
      const widthPercent = (widthPx / rect.width) * 100;
      const heightPercent = (heightPx / rect.height) * 100;
      updateField(fieldId!, { width: widthPercent, height: heightPercent });
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setResizing(null);
  };

  const saveFields = async () => {
    setSaving(true);
    try {
      // Delete existing fields
      await supabase.from('fields').delete().eq('project_id', projectId);

      // Insert new fields
      const fieldsToInsert = fields.map(({ id, ...field }) => ({
        ...field,
        project_id: projectId
      }));

      if (fieldsToInsert.length > 0) {
        const { error } = await supabase.from('fields').insert(fieldsToInsert);
        if (error) throw error;
      }

      toast.success('Template saved successfully!');
      
      // Refresh fields to get actual IDs
      const { data } = await supabase.from('fields').select('*').eq('project_id', projectId);
      setFields(
        data?.map((f) => {
          const fontSize = (typeof f.font_size === 'number' && f.font_size > 0) ? f.font_size : 16;
          return normalizeField({
            ...f,
            field_type: f.field_type as 'photo' | 'text',
            shape: (f.shape || 'rectangle') as 'rectangle' | 'rounded' | 'circle',
            font_family: f.font_family || 'Inter',
            font_bold: f.font_bold || false,
            font_italic: f.font_italic || false,
            text_align: (f.text_align || 'left') as 'left' | 'center' | 'right',
            font_size: fontSize,
          } as Field);
        }) || []
      );
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

  const selectedFieldData = fields.find(f => f.id === selectedField);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/project/${projectId}`)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 group cursor-pointer">
                        <img 
                          src="/cardlify.png" 
                          alt="Cardlify Logo" 
                          className="h-10 object-contain"
                        />
                      </div>
              <div>
                <h1 className="font-semibold text-foreground">{project?.project_name}</h1>
                <p className="text-sm text-muted-foreground">Template Editor</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={copyFormLink}>
              <Link2 className="w-4 h-4 mr-2" />
              Copy Form Link
            </Button>
            <Button onClick={saveFields} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Template
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tools Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Add Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => addField('photo')}>
                  <Image className="w-4 h-4 mr-2" />
                  Photo Field
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => addField('text')}>
                  <Type className="w-4 h-4 mr-2" />
                  Text Field
                </Button>
              </CardContent>
            </Card>

            {/* Field Properties */}
            {selectedFieldData && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    Field Properties
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => deleteField(selectedFieldData.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Field Name</Label>
                    <Select
                      value={selectedFieldData.field_name}
                      onValueChange={(value) => updateField(selectedFieldData.id, { field_name: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Photo">Photo</SelectItem>
                        <SelectItem value="Name">Name</SelectItem>
                        <SelectItem value="ID">ID</SelectItem>
                        <SelectItem value="Department">Department</SelectItem>
                        <SelectItem value="Role">Role</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Shape selector for photo fields */}
                  {selectedFieldData.field_type === 'photo' && (
                    <div className="space-y-2">
                      <Label className="text-xs">Shape</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={selectedFieldData.shape === 'rectangle' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => updateField(selectedFieldData.id, { shape: 'rectangle' })}
                        >
                          <Square className="w-4 h-4 mr-1" />
                          Square
                        </Button>
                        <Button
                          type="button"
                          variant={selectedFieldData.shape === 'rounded' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => updateField(selectedFieldData.id, { shape: 'rounded' })}
                        >
                          <RectangleHorizontal className="w-4 h-4 mr-1" />
                          Rounded
                        </Button>
                        <Button
                          type="button"
                          variant={selectedFieldData.shape === 'circle' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => updateField(selectedFieldData.id, { shape: 'circle' })}
                        >
                          <Circle className="w-4 h-4 mr-1" />
                          Circle
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedFieldData.field_type === 'text' && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs">Font Family</Label>
                        <Select
                          value={selectedFieldData.font_family}
                          onValueChange={(value) => updateField(selectedFieldData.id, { font_family: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter">Inter</SelectItem>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Courier New">Courier New</SelectItem>
                            <SelectItem value="Verdana">Verdana</SelectItem>
                            <SelectItem value="Trebuchet MS">Trebuchet MS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs">Font Style</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={selectedFieldData.font_bold ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => updateField(selectedFieldData.id, { font_bold: !selectedFieldData.font_bold })}
                          >
                            <Bold className="w-4 h-4 mr-1" />
                            Bold
                          </Button>
                          <Button
                            type="button"
                            variant={selectedFieldData.font_italic ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => updateField(selectedFieldData.id, { font_italic: !selectedFieldData.font_italic })}
                          >
                            <Italic className="w-4 h-4 mr-1" />
                            Italic
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs">Text Alignment</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={selectedFieldData.text_align === 'left' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => updateField(selectedFieldData.id, { text_align: 'left' })}
                          >
                            <AlignLeft className="w-4 h-4 mr-1" />
                            Left
                          </Button>
                          <Button
                            type="button"
                            variant={selectedFieldData.text_align === 'center' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => updateField(selectedFieldData.id, { text_align: 'center' })}
                          >
                            <AlignCenter className="w-4 h-4 mr-1" />
                            Center
                          </Button>
                          <Button
                            type="button"
                            variant={selectedFieldData.text_align === 'right' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => updateField(selectedFieldData.id, { text_align: 'right' })}
                          >
                            <AlignRight className="w-4 h-4 mr-1" />
                            Right
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs">Font Size</Label>
                        <CommitNumberInput
                          value={selectedFieldData.font_size}
                          min={8}
                          max={72}
                          onCommit={(next) => updateField(selectedFieldData.id, { font_size: next })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Font Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={selectedFieldData.font_color}
                            onChange={(e) => updateField(selectedFieldData.id, { font_color: e.target.value })}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            type="text"
                            value={selectedFieldData.font_color}
                            onChange={(e) => updateField(selectedFieldData.id, { font_color: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      {/* Background for text fields */}
                      <div className="space-y-2">
                        <Label className="text-xs">Background Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={selectedFieldData.background_color}
                            onChange={(e) => updateField(selectedFieldData.id, { background_color: e.target.value })}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            type="text"
                            value={selectedFieldData.background_color}
                            onChange={(e) => updateField(selectedFieldData.id, { background_color: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Background Opacity</Label>
                          <span className="text-xs text-muted-foreground">{Math.round(selectedFieldData.background_opacity * 100)}%</span>
                        </div>
                        <Slider
                          value={[selectedFieldData.background_opacity * 100]}
                          onValueChange={([value]) => updateField(selectedFieldData.id, { background_opacity: value / 100 })}
                          max={100}
                          step={5}
                        />
                      </div>
                    </>
                  )}

                  {/* Border controls for all field types */}
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Enable Border</Label>
                      <Switch
                        checked={selectedFieldData.border_enabled}
                        onCheckedChange={(checked) => updateField(selectedFieldData.id, { border_enabled: checked })}
                      />
                    </div>
                    
                    {selectedFieldData.border_enabled && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-xs">Border Size</Label>
                          <Input
                            type="number"
                            value={selectedFieldData.border_size}
                            onChange={(e) => updateField(selectedFieldData.id, { border_size: parseInt(e.target.value) || 1 })}
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
                              className="w-12 h-10 p-1"
                            />
                            <Input
                              type="text"
                              value={selectedFieldData.border_color}
                              onChange={(e) => updateField(selectedFieldData.id, { border_color: e.target.value })}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div className="space-y-1">
                      <Label className="text-xs">Width</Label>
                      <CommitNumberInput
                        value={Math.round(selectedFieldData.width)}
                        min={1}
                        max={100}
                        onCommit={(next) => updateField(selectedFieldData.id, { width: next })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Height</Label>
                      <CommitNumberInput
                        value={Math.round(selectedFieldData.height)}
                        min={1}
                        max={100}
                        onCommit={(next) => updateField(selectedFieldData.id, { height: next })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fields List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Fields ({fields.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Add fields to define your template layout
                  </p>
                ) : (
                  <div className="space-y-2">
                    {fields.map((field) => (
                      <button
                        key={field.id}
                        onClick={() => setSelectedField(field.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                          selectedField === field.id 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {field.field_type === 'photo' ? (
                          <Image className="w-4 h-4" />
                        ) : (
                          <Type className="w-4 h-4" />
                        )}
                        {field.field_name}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Canvas Area */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div 
                  ref={canvasRef}
                  className="relative bg-muted rounded-lg overflow-hidden mx-auto"
                  style={{ 
                    maxWidth: '100%',
                    aspectRatio: imageSize.width && imageSize.height 
                      ? `${imageSize.width}/${imageSize.height}` 
                      : '16/9'
                  }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onClick={() => setSelectedField(null)}
                >
                  {project?.template_image_url && (
                    <img
                      src={project.template_image_url}
                      alt="Template"
                      className="w-full h-full object-contain"
                      onLoad={handleImageLoad}
                      draggable={false}
                    />
                  )}

                  {/* Field Overlays */}
                  {fields.map((field) => {
                    const shapeClass = field.shape === 'circle' 
                      ? 'rounded-full' 
                      : field.shape === 'rounded' 
                        ? 'rounded-xl' 
                        : 'rounded-none';
                    
                      return (
                      <div
                        key={field.id}
                        className={`absolute cursor-move overflow-hidden ${shapeClass} ${
                          selectedField === field.id 
                            ? 'ring-2 ring-primary ring-offset-2' 
                            : ''
                        }`}
                        style={{
                          left: `${field.x_position}%`,
                          top: `${field.y_position}%`,
                          width: `${field.width}%`,
                          height: `${field.height}%`,
                          border: field.border_enabled 
                            ? `${field.border_size}px solid ${field.border_color}` 
                            : selectedField === field.id 
                              ? '2px solid hsl(var(--primary))' 
                              : '2px dashed hsl(var(--muted-foreground) / 0.5)',
                          backgroundColor: field.field_type === 'text' && field.background_opacity > 0
                            ? `${field.background_color}${Math.round(field.background_opacity * 255).toString(16).padStart(2, '0')}`
                            : selectedField === field.id 
                              ? 'hsl(var(--primary) / 0.2)' 
                              : 'hsl(var(--background) / 0.5)',
                        }}
                        onMouseDown={(e) => handleMouseDown(e, field.id)}
                      >
                        <div className="absolute inset-0 overflow-hidden flex items-center px-1">
                          {field.field_type === 'photo' ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-full min-w-0" style={{ textAlign: field.text_align || 'left' }}>
                              <span className="inline-flex max-w-full items-center gap-1 rounded bg-background/90 px-2 py-1 text-xs font-medium overflow-hidden">
                                <Type className="w-3 h-3 flex-shrink-0" />
                                <span className="min-w-0 truncate">{field.field_name}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      
                      {/* Resize Handle */}
                      {selectedField === field.id && (
                        <div
                          className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-primary rounded-sm border-2 border-background cursor-se-resize shadow-md hover:scale-110 transition-transform"
                          onMouseDown={(e) => handleMouseDown(e, field.id, true)}
                        />
                      )}

                      {/* Selection indicators */}
                      {selectedField === field.id && (
                        <>
                          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-primary rounded-sm border-2 border-background" />
                          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-primary rounded-sm border-2 border-background" />
                          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-primary rounded-sm border-2 border-background" />
                        </>
                      )}
                    </div>
                    );
                  })}
                </div>

                <p className="text-sm text-muted-foreground text-center mt-4">
                  Drag fields to position them • Click and drag corners to resize
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}