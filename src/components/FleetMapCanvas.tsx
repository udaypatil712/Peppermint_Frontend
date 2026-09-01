import React, { useEffect, useRef, useState } from 'react';
import { RobotStatus, TelemetryEvent } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, MapPin } from 'lucide-react';

interface FleetMapCanvasProps {
  robots: Map<string, TelemetryEvent>;
  selectedRobotId: string | null;
  onSelectRobot: (id: string | null) => void;
  robotTrails: Map<string, { x: number; y: number }[]>;
}

const SITE_W = 900;
const SITE_H = 560;

// zones that are off-limits — grey walls on the site map
const WALLS = [
  { x: 150, y: 60, w: 200, h: 80, label: 'Zone A' },
  { x: 150, y: 200, w: 200, h: 80, label: 'Zone B' },
  { x: 150, y: 360, w: 200, h: 80, label: 'Zone C' },
  { x: 500, y: 60, w: 60, h: 400, label: 'Column' },
  { x: 650, y: 150, w: 200, h: 60, label: 'Zone D' },
  { x: 650, y: 340, w: 200, h: 60, label: 'Zone E' },
];

const STATUS_COLOR: Record<RobotStatus, string> = {
  active: '#10b981',
  on_mission: '#38bdf8',
  idle: '#94a3b8',
  blocked: '#f59e0b',
  error: '#f87171',
  charging: '#a78bfa',
  maintenance: '#f472b6',
  offline: '#475569',
};

interface Pos { x: number; y: number; tx: number; ty: number; }

export const FleetMapCanvas: React.FC<FleetMapCanvasProps> = ({
  robots,
  selectedRobotId,
  onSelectRobot,
  robotTrails,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<Map<string, Pos>>(new Map());

  const [zoom, setZoom] = useState(1);
  const panRef = useRef({ x: 0, y: 0 });
  const [panSnapshot, setPanSnapshot] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragOrigin = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  // update target positions on telemetry change
  useEffect(() => {
    robots.forEach((r, id) => {
      const cur = posRef.current.get(id);
      if (cur) {
        cur.tx = r.x; cur.ty = r.y;
      } else {
        posRef.current.set(id, { x: r.x, y: r.y, tx: r.x, ty: r.y });
      }
    });
    posRef.current.forEach((_, id) => { if (!robots.has(id)) posRef.current.delete(id); });
  }, [robots]);

  // rAF render loop — depends on zoom + panSnapshot so re-registers when those change
  useEffect(() => {
    let rafId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const px = panRef.current.x;
      const py = panRef.current.y;

      ctx.clearRect(0, 0, SITE_W, SITE_H);
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(zoom, zoom);

      // background grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 0.5;
      for (let gx = 0; gx < SITE_W; gx += 45) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, SITE_H); ctx.stroke();
      }
      for (let gy = 0; gy < SITE_H; gy += 45) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(SITE_W, gy); ctx.stroke();
      }

      // site boundary
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, 0, SITE_W, SITE_H);

      // walls
      WALLS.forEach((wall) => {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = 'rgba(100,116,139,0.3)';
        ctx.lineWidth = 1;
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
        ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
        if (zoom >= 0.75) {
          ctx.fillStyle = 'rgba(148,163,184,0.35)';
          ctx.font = '9px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(wall.label, wall.x + wall.w / 2, wall.y + wall.h / 2 + 3);
        }
      });

      const n = robots.size;

      // trail for selected robot only
      if (selectedRobotId && robotTrails.has(selectedRobotId)) {
        const pts = robotTrails.get(selectedRobotId)!;
        if (pts.length > 1) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(20,184,166,0.5)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.moveTo(pts[0].x, pts[0].y);
          pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // interpolate & draw robots
      robots.forEach((robot, id) => {
        const p = posRef.current.get(id);
        if (!p) return;
        p.x += (p.tx - p.x) * 0.18;
        p.y += (p.ty - p.y) * 0.18;

        const sel = id === selectedRobotId;
        const col = STATUS_COLOR[robot.status] || '#94a3b8';

        ctx.save();
        ctx.translate(p.x, p.y);

        // large fleet — just a dot
        if (n > 120 && !sel && zoom < 1.3) {
          ctx.beginPath();
          ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = col;
          ctx.fill();
          ctx.restore();
          return;
        }

        if (sel) {
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(20,184,166,0.15)';
          ctx.fill();
          ctx.strokeStyle = '#14b8a6';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fillStyle = col + '22';
        ctx.fill();
        ctx.strokeStyle = col;
        ctx.lineWidth = sel ? 2 : 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();

        if (n <= 60 || sel || zoom >= 1.6) {
          ctx.fillStyle = sel ? '#fff' : '#cbd5e1';
          ctx.font = sel ? 'bold 10px JetBrains Mono' : '9px JetBrains Mono';
          ctx.textAlign = 'center';
          ctx.fillText(robot.robot_id, 0, -13);
        }

        ctx.restore();
      });

      ctx.restore();
      rafId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  // re-register loop when zoom/panSnapshot changes so translate picks up new values
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, panSnapshot, robots, selectedRobotId, robotTrails]);

  // compute the CSS-to-canvas pixel ratio for accurate click mapping
  const getCanvasScale = () => {
    const canvas = canvasRef.current;
    if (!canvas) return 1;
    return SITE_W / canvas.getBoundingClientRect().width;
  };

  const toCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scale = getCanvasScale();
    return {
      cx: (clientX - rect.left) * scale,
      cy: (clientY - rect.top) * scale,
    };
  };

  const toSiteCoords = (clientX: number, clientY: number) => {
    const { cx, cy } = toCanvasCoords(clientX, clientY);
    return {
      sx: (cx - panRef.current.x) / zoom,
      sy: (cy - panRef.current.y) / zoom,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragging.current = true;
    dragOrigin.current = {
      mx: e.clientX,
      my: e.clientY,
      px: panRef.current.x,
      py: panRef.current.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const scale = getCanvasScale();
    panRef.current = {
      x: dragOrigin.current.px + (e.clientX - dragOrigin.current.mx) * scale,
      y: dragOrigin.current.py + (e.clientY - dragOrigin.current.my) * scale,
    };
    // snapshot for re-render
    setPanSnapshot({ ...panRef.current });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    dragging.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (Math.abs(e.clientX - dragOrigin.current.mx) > 3) return; // was a drag
    const { sx, sy } = toSiteCoords(e.clientX, e.clientY);
    let best: string | null = null;
    let bestD = 20;
    posRef.current.forEach((p, id) => {
      const d = Math.hypot(p.x - sx, p.y - sy);
      if (d < bestD) { bestD = d; best = id; }
    });
    onSelectRobot(best);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.9;
    setZoom((z) => Math.max(0.4, Math.min(5, z * factor)));
  };

  const reset = () => {
    panRef.current = { x: 0, y: 0 };
    setPanSnapshot({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-[#080c14]">
      {/* top info bar */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded-md border border-slate-700/60 text-xs text-slate-300">
        <MapPin className="w-3 h-3 text-teal-400" />
        <span className="font-medium">900 × 560 site</span>
        <span className="text-slate-500">·</span>
        <span className="font-mono text-slate-400">{robots.size} robots</span>
      </div>

      {/* zoom controls */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-slate-900/80 backdrop-blur p-1 rounded-md border border-slate-700/60">
        <button onClick={() => setZoom((z) => Math.min(5, z * 1.2))} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="Zoom in">
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setZoom((z) => Math.max(0.4, z / 1.2))} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="Zoom out">
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-3 bg-slate-700 mx-0.5" />
        <button onClick={reset} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="Reset view">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* the canvas */}
      <div ref={wrapperRef}>
        <canvas
          ref={canvasRef}
          width={SITE_W}
          height={SITE_H}
          className="block w-full h-auto cursor-crosshair select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
          onWheel={handleWheel}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {/* legend bar */}
      <div className="bg-slate-900/90 border-t border-slate-800 px-3 py-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
        <span className="text-slate-500 font-medium">Legend:</span>
        {(Object.entries(STATUS_COLOR) as [RobotStatus, string][]).map(([s, c]) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c }} />
            <span className="text-slate-400 capitalize">{s.replace('_', ' ')}</span>
          </div>
        ))}
        <span className="ml-auto text-slate-600 font-mono">{(zoom * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
};
