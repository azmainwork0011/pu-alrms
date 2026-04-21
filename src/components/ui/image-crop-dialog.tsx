'use client';

import React, { useState, useCallback } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  ZoomIn, ZoomOut, RotateCw, RotateCcw, Crop as CropIcon,
  FlipHorizontal2, FlipVertical2, Check, X, Maximize2,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Types & Constants
// ═══════════════════════════════════════════════════════════════

interface ImageCropDialogProps {
  open: boolean;
  onClose: () => void;
  onCrop: (blob: Blob, dataUrl: string) => void;
  imageSrc: string;
  type: 'avatar' | 'cover';
}

// ── Output sizes (match what sharp will enforce server-side) ──
const AVATAR_SIZE = 150;   // Square profile picture: 150×150
const COVER_W = 1500;      // Cover banner: 1500×500  (≈ 3:1)
const COVER_H = 500;

// ═══════════════════════════════════════════════════════════════
// Canvas crop helper (standard react-easy-crop approach)
// ═══════════════════════════════════════════════════════════════

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Standard crop function from react-easy-crop docs.
 * Handles rotation, flip, and crops to exact pixel area.
 */
async function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  flip = { horizontal: false, vertical: false },
  outputW: number,
  outputH: number,
): Promise<{ blob: Blob; dataUrl: string }> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const rotRad = getRadianAngle(rotation);

  // Calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation,
  );

  // Set canvas size to the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate canvas center to image center to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw rotated image
  ctx.drawImage(image, 0, 0);

  // Now extract the cropped portion using pixelCrop coordinates
  // pixelCrop is relative to the original unrotated image
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d')!;

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  // Scale to desired output size
  const outputCanvas = document.createElement('canvas');
  const outputCtx = outputCanvas.getContext('2d')!;
  outputCanvas.width = outputW;
  outputCanvas.height = outputH;

  outputCtx.drawImage(
    croppedCanvas,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputW,
    outputH,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    outputCanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/png',
      1,
    );
  });

  const dataUrl = outputCanvas.toDataURL('image/png', 1);
  return { blob, dataUrl };
}

// ═══════════════════════════════════════════════════════════════
// ImageCropDialog Component
// ═══════════════════════════════════════════════════════════════

export default function ImageCropDialog({
  open,
  onClose,
  onCrop,
  imageSrc,
  type,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);
  const [cropShape, setCropShape] = useState<'circle' | 'rounded' | 'rectangle'>(
    type === 'avatar' ? 'circle' : 'rectangle',
  );

  const handleOpenChange = useCallback(
    (v: boolean) => {
      if (!v) {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setCroppedAreaPixels(null);
        onClose();
      }
    },
    [onClose],
  );

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleApply = useCallback(async () => {
    if (!croppedAreaPixels) return;
    setApplying(true);
    try {
      const outputW = type === 'avatar' ? AVATAR_SIZE : COVER_W;
      const outputH = type === 'avatar' ? AVATAR_SIZE : COVER_H;
      const result = await getCroppedImage(
        imageSrc,
        croppedAreaPixels,
        rotation,
        { horizontal: flipH, vertical: flipV },
        outputW,
        outputH,
      );
      onCrop(result.blob, result.dataUrl);
    } catch (err) {
      console.error('Crop failed:', err);
    } finally {
      setApplying(false);
    }
  }, [croppedAreaPixels, imageSrc, rotation, flipH, flipV, type, onCrop]);

  const handleRotate = useCallback(
    (deg: number) => setRotation((r) => ((r + deg) % 360 + 360) % 360),
    [],
  );

  const handleReset = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  }, []);

  const isAvatar = type === 'avatar';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-0 gap-0 overflow-hidden dark:bg-gray-900 dark:border-gray-800">
        {/* ─── Header ─────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CropIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                Edit {isAvatar ? 'Profile Photo' : 'Cover Photo'}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-gray-400">
                Drag to reposition, scroll or pinch to zoom
              </DialogDescription>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* ─── Crop Area ──────────────────────────────── */}
        <div
          className="relative bg-[#1a1a2e] dark:bg-black"
          style={{ height: isAvatar ? 360 : 280 }}
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={isAvatar ? 1 : COVER_W / COVER_H}
            cropShape={cropShape === 'circle' ? 'circular' : 'rectangular'}
            showGrid
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            style={{
              containerStyle: { background: '#0f0f1a' },
              cropAreaStyle: {
                borderRadius:
                  cropShape === 'rounded'
                    ? '16px'
                    : cropShape === 'circle'
                      ? '50%'
                      : '4px',
              },
            }}
          />
        </div>

        {/* ─── Shape Selector (avatar only) ────────────── */}
        {isAvatar && (
          <div className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
              Shape:
            </span>
            {([
              { id: 'circle' as const, label: 'Circle', icon: '⬤' },
              { id: 'rounded' as const, label: 'Rounded', icon: '▢' },
              { id: 'rectangle' as const, label: 'Square', icon: '◻' },
            ]).map((s) => (
              <button
                key={s.id}
                onClick={() => setCropShape(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  cropShape === s.id
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
                }`}
              >
                <span className="text-sm">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* ─── Controls ──────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1">
            {/* Zoom */}
            <button
              onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}
              title="Zoom Out"
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="w-20 flex flex-col items-center gap-0.5">
              <input
                type="range"
                min={0.5}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[10px] text-gray-400 font-medium">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <button
              onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
              title="Zoom In"
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Rotation */}
            <button
              onClick={() => handleRotate(-90)}
              title="Rotate Left"
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleRotate(90)}
              title="Rotate Right"
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Flip */}
            <button
              onClick={() => setFlipH((v) => !v)}
              title="Flip Horizontal"
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                flipH
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}
            >
              <FlipHorizontal2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFlipV((v) => !v)}
              title="Flip Vertical"
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                flipV
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}
            >
              <FlipVertical2 className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Reset */}
            <button
              onClick={handleReset}
              title="Reset All"
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─── Info Bar ──────────────────────────────── */}
        <div className="px-5 py-2.5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
              Output
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
              {isAvatar ? `${AVATAR_SIZE}×${AVATAR_SIZE}` : `${COVER_W}×${COVER_H}`}px · PNG
            </span>
          </div>
        </div>

        {/* ─── Actions ───────────────────────────────── */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-gray-50/50 dark:bg-gray-800/30">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-9 px-4 text-gray-600 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700"
          >
            <X className="w-3.5 h-3.5 mr-1.5" />
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={applying || !croppedAreaPixels}
            className="h-9 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white font-semibold border-0 shadow-sm"
          >
            {applying ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Apply
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
