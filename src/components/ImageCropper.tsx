import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';

const OUTPUT_SIZE = 1000;
const MAX_ZOOM = 3;

export interface CropResult {
  file: File;
  dataUrl: string;
  blob: Blob;
}

interface ImageCropperProps {
  /** The original file the visitor picked. */
  file: File | null;
  open: boolean;
  onCancel: () => void;
  onConfirm: (result: CropResult) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * A 1:1 crop dialog with no third-party dependency: the visitor drags the photo
 * behind a square window, zooms if needed, and we export a square JPEG from a canvas.
 */
export function ImageCropper({ file, open, onCancel, onConfirm }: ImageCropperProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [frameSize, setFrameSize] = useState(320);
  const [saving, setSaving] = useState(false);

  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );

  // Fresh object URL for each picked file, plus a reset of the crop framing.
  useEffect(() => {
    if (!file) {
      setImageUrl(null);
      setNatural({ width: 0, height: 0 });
      return;
    }

    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setZoom(1);
    setOffset({ x: 0, y: 0 });

    const image = new Image();
    image.onload = () => {
      setNatural({ width: image.naturalWidth, height: image.naturalHeight });
      imageRef.current = image;
    };
    image.src = url;

    return () => {
      URL.revokeObjectURL(url);
      imageRef.current = null;
    };
  }, [file]);

  // Keep the crop maths in real pixels, whatever width the dialog ends up with.
  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;

    const measure = () => setFrameSize(node.clientWidth || 320);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [open, imageUrl]);

  const coverScale = natural.width
    ? Math.max(frameSize / natural.width, frameSize / natural.height)
    : 1;
  const scale = coverScale * zoom;
  const drawnWidth = natural.width * scale;
  const drawnHeight = natural.height * scale;

  const maxX = Math.max(0, (drawnWidth - frameSize) / 2);
  const maxY = Math.max(0, (drawnHeight - frameSize) / 2);
  const offsetX = clamp(offset.x, -maxX, maxX);
  const offsetY = clamp(offset.y, -maxY, maxY);

  const left = (frameSize - drawnWidth) / 2 + offsetX;
  const top = (frameSize - drawnHeight) / 2 + offsetY;

  const applyZoom = (next: number) => {
    const nextZoom = clamp(next, 1, MAX_ZOOM);
    const nextScale = coverScale * nextZoom;
    const nextMaxX = Math.max(0, (natural.width * nextScale - frameSize) / 2);
    const nextMaxY = Math.max(0, (natural.height * nextScale - frameSize) / 2);

    setZoom(nextZoom);
    setOffset((prev) => ({
      x: clamp(prev.x, -nextMaxX, nextMaxX),
      y: clamp(prev.y, -nextMaxY, nextMaxY),
    }));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: offsetX,
      originY: offsetY,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;

    setOffset({
      x: clamp(drag.originX + event.clientX - drag.startX, -maxX, maxX),
      y: clamp(drag.originY + event.clientY - drag.startY, -maxY, maxY),
    });
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleConfirm = async () => {
    const image = imageRef.current;
    if (!image || !file) return;

    setSaving(true);
    try {
      // Convert the visible square back into source-image pixels.
      const side = frameSize / scale;
      const sourceX = clamp(-left / scale, 0, Math.max(0, natural.width - side));
      const sourceY = clamp(-top / scale, 0, Math.max(0, natural.height - side));

      const outputSize = Math.max(320, Math.min(OUTPUT_SIZE, Math.round(side)));
      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');

      // JPEG has no alpha, so transparent PNGs get white instead of black.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, outputSize, outputSize);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(image, sourceX, sourceY, side, side, 0, 0, outputSize, outputSize);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.92),
      );
      if (!blob) throw new Error('Crop failed');

      const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
      onConfirm({
        blob,
        dataUrl: canvas.toDataURL('image/jpeg', 0.92),
        file: new File([blob], `${baseName}-square.jpg`, { type: 'image/jpeg' }),
      });
    } catch {
      toast.error('Could not crop that image. Try another file.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-tight">Square your photo</DialogTitle>
          <DialogDescription className="text-sm text-foreground/50">
            Drag to reposition and zoom until your face sits inside the square. This is the 1:1 crop
            that appears on your card.
          </DialogDescription>
        </DialogHeader>

        <div className="mx-auto w-full max-w-[340px]">
          <div
            ref={frameRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative aspect-square w-full cursor-grab touch-none select-none overflow-hidden rounded-2xl border border-foreground/15 bg-foreground/90 active:cursor-grabbing"
          >
            {imageUrl && natural.width > 0 ? (
              <img
                src={imageUrl}
                alt="Crop preview"
                draggable={false}
                className="pointer-events-none absolute max-w-none"
                style={{
                  width: drawnWidth,
                  height: drawnHeight,
                  left,
                  top,
                }}
              />
            ) : (
              <div className="grid h-full place-items-center">
                <Loader2 className="h-5 w-5 animate-spin text-paper/60" />
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 opacity-40">
              <div className="absolute inset-y-0 left-1/3 w-px bg-white/70" />
              <div className="absolute inset-y-0 left-2/3 w-px bg-white/70" />
              <div className="absolute inset-x-0 top-1/3 h-px bg-white/70" />
              <div className="absolute inset-x-0 top-2/3 h-px bg-white/70" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              aria-label="Zoom out"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-foreground/15 bg-white/70 transition hover:bg-white disabled:opacity-40"
              onClick={() => applyZoom(zoom - 0.1)}
              disabled={zoom <= 1}
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="range"
              min={1}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              aria-label="Zoom"
              onChange={(event) => applyZoom(Number(event.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-foreground/15 accent-foreground"
            />
            <button
              type="button"
              aria-label="Zoom in"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-foreground/15 bg-white/70 transition hover:bg-white disabled:opacity-40"
              onClick={() => applyZoom(zoom + 0.1)}
              disabled={zoom >= MAX_ZOOM}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <p className="mono-label mt-3 text-center text-[9px] text-foreground/35">
            1:1 crop · {zoom.toFixed(1)}×
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleConfirm} disabled={saving || !natural.width}>
            {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Use this crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
