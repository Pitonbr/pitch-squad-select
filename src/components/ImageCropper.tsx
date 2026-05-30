import React, { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Card, CardContent } from "./ui/card";
import { RotateCw, Move, ZoomIn, Crop } from "lucide-react";

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageCropper({ isOpen, onClose, imageSrc, onCropComplete }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [zoom, setZoom] = useState([1]);
  const [rotation, setRotation] = useState(0);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleImageLoad = useCallback(() => {
    setIsImageLoaded(true);
    if (imageRef.current) {
      const img = imageRef.current;
      // Center the crop area
      setCropArea({
        x: (img.naturalWidth - 200) / 2,
        y: (img.naturalHeight - 200) / 2,
        width: 200,
        height: 200
      });
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setCropArea(prev => ({
      ...prev,
      x: Math.max(0, Math.min(prev.x + deltaX, (imageRef.current?.naturalWidth || 0) - prev.width)),
      y: Math.max(0, Math.min(prev.y + deltaY, (imageRef.current?.naturalHeight || 0) - prev.height))
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !isImageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = Math.min(300 / img.naturalWidth, 300 / img.naturalHeight) * zoom[0];
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save context
    ctx.save();
    
    // Apply transformations
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    
    // Draw image
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    
    // Restore context
    ctx.restore();

    // Draw crop overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clear crop area
    ctx.globalCompositeOperation = 'destination-out';
    const cropX = (canvas.width - cropArea.width * scale) / 2;
    const cropY = (canvas.height - cropArea.height * scale) / 2;
    ctx.fillRect(cropX, cropY, cropArea.width * scale, cropArea.height * scale);
    
    // Draw crop border
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropX, cropY, cropArea.width * scale, cropArea.height * scale);
  }, [cropArea, zoom, rotation, isImageLoaded]);

  const handleCrop = async () => {
    const img = imageRef.current;
    if (!img) return;

    // Create a temporary canvas for cropping
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Set canvas size to crop area
    tempCanvas.width = cropArea.width;
    tempCanvas.height = cropArea.height;

    // Apply transformations and draw cropped area
    tempCtx.save();
    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    tempCtx.rotate((rotation * Math.PI) / 180);
    tempCtx.scale(zoom[0], zoom[0]);
    
    // Draw the cropped portion
    tempCtx.drawImage(
      img,
      cropArea.x - tempCanvas.width / (2 * zoom[0]),
      cropArea.y - tempCanvas.height / (2 * zoom[0])
    );
    
    tempCtx.restore();

    // Convert to blob
    tempCanvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
        onClose();
      }
    }, 'image/jpeg', 0.9);
  };

  const resetCrop = () => {
    setZoom([1]);
    setRotation(0);
    if (imageRef.current) {
      setCropArea({
        x: (imageRef.current.naturalWidth - 200) / 2,
        y: (imageRef.current.naturalHeight - 200) / 2,
        width: 200,
        height: 200
      });
    }
  };

  // Redraw preview when parameters change
  React.useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Editar Imagem
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Hidden image for reference */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Imagem original para recorte"
            className="hidden"
            onLoad={handleImageLoad}
          />

          {/* Preview Canvas */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={400}
                  className="border border-border rounded cursor-move"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4" />
                <span className="text-sm font-medium">Zoom: {zoom[0].toFixed(1)}x</span>
              </div>
              <Slider
                value={zoom}
                onValueChange={setZoom}
                min={0.5}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RotateCw className="h-4 w-4" />
                <span className="text-sm font-medium">Rotação: {rotation}°</span>
              </div>
              <Slider
                value={[rotation]}
                onValueChange={(value) => setRotation(value[0])}
                min={0}
                max={360}
                step={15}
                className="w-full"
              />
            </div>
          </div>

          {/* Instructions */}
          <Card>
            <CardContent className="p-3">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Move className="h-4 w-4" />
                Clique e arraste na imagem para posicionar a área de corte
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetCrop} className="flex-1">
              Resetar
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleCrop} className="flex-1" disabled={!isImageLoaded}>
              Aplicar Corte
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}