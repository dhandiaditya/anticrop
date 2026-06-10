"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

export interface Layer {
  id: string;
  name: string;
  image: HTMLImageElement;
  x: number;
  y: number;
  scale: number;
  rotation: number; // in degrees
  flipH: boolean;
  flipV: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  hueRotate: number;
  blur: number;
  sepia: number;
  maskShape: string;
}

export default function ImageEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Global Settings (Anticrop Base)
  const [baseWidth, setBaseWidth] = useState(1080);
  const [baseHeight, setBaseHeight] = useState(1080);
  
  // Padding states (The "Anticrop" feature)
  const [paddingTop, setPaddingTop] = useState(0);
  const [paddingRight, setPaddingRight] = useState(0);
  const [paddingBottom, setPaddingBottom] = useState(0);
  const [paddingLeft, setPaddingLeft] = useState(0);
  const [linkPadding, setLinkPadding] = useState(true);

  const [bgColor, setBgColor] = useState("#000000");
  const [isGradient, setIsGradient] = useState(false);
  const [bgColor2, setBgColor2] = useState("#ffffff");
  const [gradientDir, setGradientDir] = useState("vertical");
  const [transparentBg, setTransparentBg] = useState(false);
  const [circularMode, setCircularMode] = useState(false);

  // Layer State
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const activeLayer = layers.find(l => l.id === activeLayerId);

  // Helper to update a specific layer
  const updateLayer = (id: string, updates: Partial<Layer>) => {
    setLayers(prev => prev.map(layer => layer.id === id ? { ...layer, ...updates } : layer));
  };

  const handlePaddingChange = (value: number, side: 'top' | 'right' | 'bottom' | 'left') => {
    if (linkPadding) {
      setPaddingTop(value);
      setPaddingRight(value);
      setPaddingBottom(value);
      setPaddingLeft(value);
    } else {
      if (side === 'top') setPaddingTop(value);
      if (side === 'right') setPaddingRight(value);
      if (side === 'bottom') setPaddingBottom(value);
      if (side === 'left') setPaddingLeft(value);
    }
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const actualWidth = baseWidth + paddingLeft + paddingRight;
    const actualHeight = baseHeight + paddingTop + paddingBottom;

    canvas.width = actualWidth;
    canvas.height = actualHeight;

    // Clear and setup
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();

    // Circular crop (Global)
    if (circularMode) {
      ctx.beginPath();
      const radius = Math.min(canvas.width, canvas.height) / 2;
      ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
      ctx.clip();
    }

    // Global Background
    if (!transparentBg) {
      if (isGradient) {
        let gradient;
        if (gradientDir === 'vertical') {
          gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        } else if (gradientDir === 'horizontal') {
          gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        } else {
          // Diagonal
          gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        }
        gradient.addColorStop(0, bgColor);
        gradient.addColorStop(1, bgColor2);
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = bgColor;
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw all layers from bottom to top (0 to length-1)
    layers.forEach(layer => {
      ctx.save();
      
      // Move to layer's center position, accounting for padding
      ctx.translate(layer.x + paddingLeft, layer.y + paddingTop);
      
      // Apply transforms
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.scale((layer.flipH ? -1 : 1) * layer.scale, (layer.flipV ? -1 : 1) * layer.scale);

      if (layer.maskShape && layer.maskShape !== 'none') {
        ctx.beginPath();
        const w = layer.image.width;
        const h = layer.image.height;
        const r = Math.min(w, h) / 2;
        
        if (layer.maskShape === 'circle') {
          ctx.arc(0, 0, r, 0, Math.PI * 2);
        } else if (layer.maskShape === 'triangle') {
          ctx.moveTo(0, -r);
          ctx.lineTo(r, r);
          ctx.lineTo(-r, r);
          ctx.closePath();
        } else if (layer.maskShape === 'star') {
          const spikes = 5;
          const outerRadius = r;
          const innerRadius = r / 2;
          let rot = Math.PI / 2 * 3;
          const step = Math.PI / spikes;
          ctx.moveTo(0, -outerRadius);
          for (let i = 0; i < spikes; i++) {
            ctx.lineTo(Math.cos(rot) * outerRadius, Math.sin(rot) * outerRadius);
            rot += step;
            ctx.lineTo(Math.cos(rot) * innerRadius, Math.sin(rot) * innerRadius);
            rot += step;
          }
          ctx.lineTo(0, -outerRadius);
          ctx.closePath();
        } else if (layer.maskShape === 'heart') {
          ctx.moveTo(0, -r * 0.3);
          ctx.bezierCurveTo(0, -r, -r, -r, -r, -r * 0.3);
          ctx.bezierCurveTo(-r, r * 0.3, 0, r * 0.8, 0, r);
          ctx.bezierCurveTo(0, r * 0.8, r, r * 0.3, r, -r * 0.3);
          ctx.bezierCurveTo(r, -r, 0, -r, 0, -r * 0.3);
          ctx.closePath();
        } else if (layer.maskShape === 'hexagon') {
          const a = Math.PI * 2 / 6;
          ctx.moveTo(0, -r);
          for (let i = 1; i < 6; i++) {
            ctx.lineTo(r * Math.sin(a * i), -r * Math.cos(a * i));
          }
          ctx.closePath();
        } else if (layer.maskShape === 'diamond') {
          ctx.moveTo(0, -r);
          ctx.lineTo(r, 0);
          ctx.lineTo(0, r);
          ctx.lineTo(-r, 0);
          ctx.closePath();
        } else if (layer.maskShape === 'cross') {
          const w3 = r / 3;
          ctx.moveTo(-w3, -r);
          ctx.lineTo(w3, -r);
          ctx.lineTo(w3, -w3);
          ctx.lineTo(r, -w3);
          ctx.lineTo(r, w3);
          ctx.lineTo(w3, w3);
          ctx.lineTo(w3, r);
          ctx.lineTo(-w3, r);
          ctx.lineTo(-w3, w3);
          ctx.lineTo(-r, w3);
          ctx.lineTo(-r, -w3);
          ctx.lineTo(-w3, -w3);
          ctx.closePath();
        } else if (layer.maskShape === 'octagon') {
          const a = Math.PI * 2 / 8;
          ctx.moveTo(r * Math.sin(a/2), -r * Math.cos(a/2));
          for (let i = 1; i < 8; i++) {
            ctx.lineTo(r * Math.sin(a * i + a/2), -r * Math.cos(a * i + a/2));
          }
          ctx.closePath();
        }
        ctx.clip();
      }

      // Apply advanced CSS filters
      ctx.filter = `
        brightness(${layer.brightness}%) 
        contrast(${layer.contrast}%) 
        saturate(${layer.saturation}%) 
        hue-rotate(${layer.hueRotate}deg) 
        blur(${layer.blur}px) 
        sepia(${layer.sepia}%)
      `.trim();

      // Draw image centered at (0,0)
      ctx.drawImage(layer.image, -layer.image.width / 2, -layer.image.height / 2);
      
      ctx.restore();
    });

    ctx.restore();
  }, [layers, baseWidth, baseHeight, paddingTop, paddingRight, paddingBottom, paddingLeft, bgColor, isGradient, bgColor2, gradientDir, transparentBg, circularMode]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // If this is the first layer, set the base canvas size to match the image
        if (layers.length === 0) {
          setBaseWidth(img.width);
          setBaseHeight(img.height);
          setPaddingTop(0);
          setPaddingRight(0);
          setPaddingBottom(0);
          setPaddingLeft(0);
        }

        const newLayer: Layer = {
          id: Math.random().toString(36).substring(7),
          name: file.name || 'New Layer',
          image: img,
          x: layers.length === 0 ? img.width / 2 : baseWidth / 2,
          y: layers.length === 0 ? img.height / 2 : baseHeight / 2,
          scale: 1,
          rotation: 0,
          flipH: false,
          flipV: false,
          brightness: 100,
          contrast: 100,
          saturation: 100,
          hueRotate: 0,
          blur: 0,
          sepia: 0,
          maskShape: 'none'
        };
        setLayers(prev => [...prev, newLayer]);
        setActiveLayerId(newLayer.id);
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset input
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "anticrop-composition.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Mouse drag functionality for active layer
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeLayerId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    setIsDragging(true);
    setDragStart({ 
      x: (e.clientX - rect.left) * scaleX, 
      y: (e.clientY - rect.top) * scaleY 
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !activeLayer || !activeLayerId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    const dx = currentX - dragStart.x;
    const dy = currentY - dragStart.y;
    
    updateLayer(activeLayerId, {
      x: activeLayer.x + dx,
      y: activeLayer.y + dy
    });
    
    setDragStart({ x: currentX, y: currentY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const deleteLayer = (id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (activeLayerId === id) setActiveLayerId(null);
  };

  const moveLayerUp = (index: number) => {
    if (index === layers.length - 1) return;
    const newLayers = [...layers];
    [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
    setLayers(newLayers);
  };

  const moveLayerDown = (index: number) => {
    if (index === 0) return;
    const newLayers = [...layers];
    [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
    setLayers(newLayers);
  };

  return (
    <div className="main-layout">
      {/* Left Sidebar: Layers & Global Settings */}
      <aside className="sidebar">
        <div className="sidebar-section">
          <div className="d-flex justify-between align-center mb-4">
            <h3 style={{ marginBottom: 0 }}>Anticrop (Padding)</h3>
            <label className="d-flex align-center gap-2" style={{ fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={linkPadding} onChange={(e) => setLinkPadding(e.target.checked)} />
              Link Sides
            </label>
          </div>
          
          <div className="form-group">
            <div className="d-flex justify-between">
              <label className="form-label">{linkPadding ? 'All Sides' : 'Top'}</label>
              <span className="text-secondary" style={{fontSize: '0.8rem'}}>{paddingTop}px</span>
            </div>
            <input type="range" className="form-range" min="0" max="2000" value={paddingTop} onChange={(e) => handlePaddingChange(Number(e.target.value), 'top')} />
          </div>
          
          {!linkPadding && (
            <>
              <div className="form-group">
                <div className="d-flex justify-between">
                  <label className="form-label">Right</label>
                  <span className="text-secondary" style={{fontSize: '0.8rem'}}>{paddingRight}px</span>
                </div>
                <input type="range" className="form-range" min="0" max="2000" value={paddingRight} onChange={(e) => handlePaddingChange(Number(e.target.value), 'right')} />
              </div>
              
              <div className="form-group">
                <div className="d-flex justify-between">
                  <label className="form-label">Bottom</label>
                  <span className="text-secondary" style={{fontSize: '0.8rem'}}>{paddingBottom}px</span>
                </div>
                <input type="range" className="form-range" min="0" max="2000" value={paddingBottom} onChange={(e) => handlePaddingChange(Number(e.target.value), 'bottom')} />
              </div>
              
              <div className="form-group">
                <div className="d-flex justify-between">
                  <label className="form-label">Left</label>
                  <span className="text-secondary" style={{fontSize: '0.8rem'}}>{paddingLeft}px</span>
                </div>
                <input type="range" className="form-range" min="0" max="2000" value={paddingLeft} onChange={(e) => handlePaddingChange(Number(e.target.value), 'left')} />
              </div>
            </>
          )}

          <div className="form-group mt-1">
            <label className="form-label">Background Color</label>
            <div className="d-flex align-center gap-2">
              <input type="color" className="color-picker-input" value={bgColor} onChange={(e) => setBgColor(e.target.value)} disabled={transparentBg} style={{ opacity: transparentBg ? 0.5 : 1 }} />
              <label className="d-flex align-center gap-2" style={{ cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={transparentBg} onChange={(e) => setTransparentBg(e.target.checked)} />
                Transparent
              </label>
            </div>
          </div>
          
          {!transparentBg && (
            <>
              <label className="d-flex align-center gap-2 mt-2 mb-2" style={{ cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={isGradient} onChange={(e) => setIsGradient(e.target.checked)} />
                Use Gradient
              </label>
              
              {isGradient && (
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', marginBottom: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Gradient Color 2</label>
                    <input type="color" className="color-picker-input" value={bgColor2} onChange={(e) => setBgColor2(e.target.value)} />
                  </div>
                  <div className="form-group mt-2">
                    <label className="form-label">Direction</label>
                    <select className="form-input" value={gradientDir} onChange={(e) => setGradientDir(e.target.value)}>
                      <option value="vertical">Vertical</option>
                      <option value="horizontal">Horizontal</option>
                      <option value="diagonal">Diagonal</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}
          <label className="d-flex align-center gap-2 mt-2" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
            <input type="checkbox" checked={circularMode} onChange={(e) => setCircularMode(e.target.checked)} />
            Circular Crop
          </label>
        </div>

        <div className="sidebar-section" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="d-flex justify-between align-center mb-4">
            <h3 style={{ marginBottom: 0 }}>Layers</h3>
            <label className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
              + Add
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            </label>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {layers.length === 0 ? (
              <p className="text-secondary text-center mt-4" style={{ fontSize: '0.9rem' }}>No layers yet. Add an image!</p>
            ) : (
              [...layers].reverse().map((layer, reverseIndex) => {
                const index = layers.length - 1 - reverseIndex;
                return (
                  <div 
                    key={layer.id} 
                    className={`layer-item ${activeLayerId === layer.id ? 'active' : ''}`}
                    onClick={() => setActiveLayerId(layer.id)}
                  >
                    <img src={layer.image.src} className="layer-thumb" alt={layer.name} />
                    <div className="layer-info">
                      <div className="layer-name">{layer.name}</div>
                    </div>
                    <div className="d-flex" style={{ flexDirection: 'column', gap: '4px' }}>
                      <button className="btn" style={{ padding: '2px 4px', fontSize: '10px' }} onClick={(e) => { e.stopPropagation(); moveLayerUp(index); }}>▲</button>
                      <button className="btn" style={{ padding: '2px 4px', fontSize: '10px' }} onClick={(e) => { e.stopPropagation(); moveLayerDown(index); }}>▼</button>
                    </div>
                    <button 
                      className="btn" 
                      style={{ 
                        padding: '4px', 
                        marginLeft: '4px', 
                        backgroundColor: layer.maskShape !== 'none' ? 'var(--accent-color)' : 'var(--bg-surface-hover)', 
                        color: layer.maskShape !== 'none' ? '#fff' : 'var(--text-secondary)' 
                      }} 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const shapes = ['none', 'circle', 'triangle', 'star', 'heart', 'hexagon', 'diamond', 'cross', 'octagon'];
                        const nextShape = shapes[(shapes.indexOf(layer.maskShape) + 1) % shapes.length];
                        updateLayer(layer.id, { maskShape: nextShape }); 
                      }} 
                      title="Toggle Mask Shape"
                    >
                      {layer.maskShape === 'circle' ? '⭕' : layer.maskShape === 'triangle' ? '△' : layer.maskShape === 'star' ? '⭐' : layer.maskShape === 'heart' ? '❤️' : layer.maskShape === 'hexagon' ? '⬡' : layer.maskShape === 'diamond' ? '♦️' : layer.maskShape === 'cross' ? '➕' : layer.maskShape === 'octagon' ? '🛑' : '⬜'}
                    </button>
                    <button className="btn btn-danger" style={{ padding: '4px', marginLeft: '4px' }} onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}>✕</button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="sidebar-section" style={{ border: 'none', paddingTop: '0' }}>
          <button className="btn btn-primary w-100" onClick={handleDownload}>
            Download Composition
          </button>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="canvas-container">
        <canvas 
          ref={canvasRef} 
          width={baseWidth + paddingLeft + paddingRight}
          height={baseHeight + paddingTop + paddingBottom}
          className="editor-canvas" 
          style={{ borderRadius: circularMode ? '50%' : '0' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </main>

      {/* Right Sidebar: Active Layer Properties */}
      <aside className="sidebar sidebar-right">
        <div className="sidebar-section">
          <h3 className="mb-4">Layer Properties</h3>
          {!activeLayer ? (
            <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Select a layer to edit its properties.</p>
          ) : (
            <>
              <div className="d-flex gap-2 mb-2">
                <div className="form-group w-100">
                  <label className="form-label">X Pos</label>
                  <input type="number" className="form-input" value={Math.round(activeLayer.x)} onChange={e => updateLayer(activeLayer.id, { x: Number(e.target.value) })} />
                </div>
                <div className="form-group w-100">
                  <label className="form-label">Y Pos</label>
                  <input type="number" className="form-input" value={Math.round(activeLayer.y)} onChange={e => updateLayer(activeLayer.id, { y: Number(e.target.value) })} />
                </div>
              </div>

              <div className="form-group mb-4">
                <div className="d-flex justify-between">
                  <label className="form-label">Scale</label>
                  <span className="text-secondary" style={{fontSize: '0.8rem'}}>{activeLayer.scale.toFixed(2)}x</span>
                </div>
                <input type="range" className="form-range" min="0.1" max="5" step="0.05" value={activeLayer.scale} onChange={(e) => updateLayer(activeLayer.id, { scale: Number(e.target.value) })} />
              </div>

              <div className="d-flex gap-2 mb-2">
                <button className="btn w-100" onClick={() => updateLayer(activeLayer.id, { rotation: (activeLayer.rotation - 90) % 360 })}>↶ Rot</button>
                <button className="btn w-100" onClick={() => updateLayer(activeLayer.id, { rotation: (activeLayer.rotation + 90) % 360 })}>Rot ↷</button>
              </div>
              
              <div className="d-flex gap-2 mb-4">
                <button className="btn w-100" onClick={() => updateLayer(activeLayer.id, { flipH: !activeLayer.flipH })}>Flip H</button>
                <button className="btn w-100" onClick={() => updateLayer(activeLayer.id, { flipV: !activeLayer.flipV })}>Flip V</button>
              </div>
              
              <div className="form-group mb-4">
                <label className="form-label">Mask Shape</label>
                <select className="form-input" value={activeLayer.maskShape} onChange={(e) => updateLayer(activeLayer.id, { maskShape: e.target.value })}>
                  <option value="none">None</option>
                  <option value="circle">Circle</option>
                  <option value="triangle">Triangle</option>
                  <option value="star">Star</option>
                  <option value="heart">Heart</option>
                  <option value="hexagon">Hexagon</option>
                  <option value="diamond">Diamond</option>
                  <option value="cross">Cross</option>
                  <option value="octagon">Octagon</option>
                </select>
              </div>
              
              <h4 className="mb-2" style={{ fontSize: '0.9rem' }}>Filters</h4>
              
              <div className="form-group">
                <div className="d-flex justify-between">
                  <label className="form-label">Brightness</label>
                  <span className="text-secondary" style={{fontSize: '0.8rem'}}>{activeLayer.brightness}%</span>
                </div>
                <input type="range" className="form-range" min="0" max="200" value={activeLayer.brightness} onChange={(e) => updateLayer(activeLayer.id, { brightness: Number(e.target.value) })} />
              </div>
              
              <div className="form-group">
                <div className="d-flex justify-between">
                  <label className="form-label">Contrast</label>
                  <span className="text-secondary" style={{fontSize: '0.8rem'}}>{activeLayer.contrast}%</span>
                </div>
                <input type="range" className="form-range" min="0" max="200" value={activeLayer.contrast} onChange={(e) => updateLayer(activeLayer.id, { contrast: Number(e.target.value) })} />
              </div>
              
              <div className="form-group">
                <div className="d-flex justify-between">
                  <label className="form-label">Saturation</label>
                  <span className="text-secondary" style={{fontSize: '0.8rem'}}>{activeLayer.saturation}%</span>
                </div>
                <input type="range" className="form-range" min="0" max="200" value={activeLayer.saturation} onChange={(e) => updateLayer(activeLayer.id, { saturation: Number(e.target.value) })} />
              </div>

              <div className="form-group">
                <div className="d-flex justify-between">
                  <label className="form-label">Hue Rotate</label>
                  <span className="text-secondary" style={{fontSize: '0.8rem'}}>{activeLayer.hueRotate}°</span>
                </div>
                <input type="range" className="form-range" min="0" max="360" value={activeLayer.hueRotate} onChange={(e) => updateLayer(activeLayer.id, { hueRotate: Number(e.target.value) })} />
              </div>

              <div className="form-group">
                <div className="d-flex justify-between">
                  <label className="form-label">Blur</label>
                  <span className="text-secondary" style={{fontSize: '0.8rem'}}>{activeLayer.blur}px</span>
                </div>
                <input type="range" className="form-range" min="0" max="50" value={activeLayer.blur} onChange={(e) => updateLayer(activeLayer.id, { blur: Number(e.target.value) })} />
              </div>

              <div className="form-group">
                <div className="d-flex justify-between">
                  <label className="form-label">Sepia</label>
                  <span className="text-secondary" style={{fontSize: '0.8rem'}}>{activeLayer.sepia}%</span>
                </div>
                <input type="range" className="form-range" min="0" max="100" value={activeLayer.sepia} onChange={(e) => updateLayer(activeLayer.id, { sepia: Number(e.target.value) })} />
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
