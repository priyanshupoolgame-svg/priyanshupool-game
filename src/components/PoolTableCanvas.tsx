import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Ball, AimGuideData } from '../types';
import { PoolPhysics } from '../physics/PoolPhysics';

interface PoolTableCanvasProps {
  balls: Ball[];
  aimAngle: number;
  cuePower: number;
  aimGuide: AimGuideData | null;
  isHumanTurn: boolean;
  isBallInHand: boolean;
  onAimChange: (angle: number) => void;
  onRepositionCueBall: (x: number, y: number) => void;
}

export const PoolTableCanvas: React.FC<PoolTableCanvasProps> = ({
  balls,
  aimAngle,
  cuePower,
  aimGuide,
  isHumanTurn,
  isBallInHand,
  onAimChange,
  onRepositionCueBall
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const scale = width / PoolPhysics.TABLE_WIDTH;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.scale(scale, scale);

    // 1. Wooden Outer Rails
    const woodGrad = ctx.createLinearGradient(0, 0, PoolPhysics.TABLE_WIDTH, PoolPhysics.TABLE_HEIGHT);
    woodGrad.addColorStop(0, '#3F1A08');
    woodGrad.addColorStop(0.5, '#5B2912');
    woodGrad.addColorStop(1, '#270F05');
    ctx.fillStyle = woodGrad;
    ctx.beginPath();
    ctx.roundRect(0, 0, PoolPhysics.TABLE_WIDTH, PoolPhysics.TABLE_HEIGHT, 24);
    ctx.fill();

    // Wooden Border Bevel
    ctx.strokeStyle = '#220B04';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Rail Inset Diamonds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    const topBottomDiamonds = [160, 270, 380, 620, 730, 840];
    topBottomDiamonds.forEach(x => {
      ctx.beginPath();
      ctx.arc(x, 22, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, 478, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    const leftRightDiamonds = [150, 250, 350];
    leftRightDiamonds.forEach(y => {
      ctx.beginPath();
      ctx.arc(22, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(978, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Playable Green Felt
    const feltGrad = ctx.createRadialGradient(500, 250, 50, 500, 250, 550);
    feltGrad.addColorStop(0, '#0F764C');
    feltGrad.addColorStop(0.7, '#084B2E');
    feltGrad.addColorStop(1, '#063B24');
    ctx.fillStyle = feltGrad;
    ctx.beginPath();
    ctx.roundRect(PoolPhysics.MIN_X, PoolPhysics.MIN_Y, PoolPhysics.MAX_X - PoolPhysics.MIN_X, PoolPhysics.MAX_Y - PoolPhysics.MIN_Y, 14);
    ctx.fill();

    // Subtle markings (Break Line & Spot)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(280, PoolPhysics.MIN_Y);
    ctx.lineTo(280, PoolPhysics.MAX_Y);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(680, 250, 3, 0, Math.PI * 2);
    ctx.fill();

    // 3. Six Pockets
    PoolPhysics.POCKETS.forEach(pocket => {
      const isMiddle = pocket.x === 500;
      const radius = isMiddle ? PoolPhysics.POCKET_RADIUS_MIDDLE : PoolPhysics.POCKET_RADIUS_CORNER;

      // Brass/Gold rim bracket
      const rimGrad = ctx.createRadialGradient(pocket.x, pocket.y, radius * 0.7, pocket.x, pocket.y, radius + 6);
      rimGrad.addColorStop(0, '#E5B558');
      rimGrad.addColorStop(1, '#92631C');
      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, radius + 5, 0, Math.PI * 2);
      ctx.fill();

      // Deep dark pocket hole
      const holeGrad = ctx.createRadialGradient(pocket.x, pocket.y, 2, pocket.x, pocket.y, radius);
      holeGrad.addColorStop(0, '#020408');
      holeGrad.addColorStop(1, '#0F172A');
      ctx.fillStyle = holeGrad;
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Aim Guide Line & Ghost Cue Ball
    if (isHumanTurn && !isBallInHand && aimGuide) {
      // Dotted aim line
      ctx.save();
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(aimGuide.rayStartX, aimGuide.rayStartY);
      ctx.lineTo(aimGuide.impactX, aimGuide.impactY);
      ctx.stroke();
      ctx.restore();

      // Ghost Ball
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(aimGuide.ghostCueX, aimGuide.ghostCueY, PoolPhysics.BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Deflections
      if (aimGuide.hasBallHit && aimGuide.targetBallX !== undefined && aimGuide.targetBallY !== undefined) {
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(aimGuide.impactX, aimGuide.impactY);
        ctx.lineTo(aimGuide.targetBallX, aimGuide.targetBallY);
        ctx.stroke();
      }

      if (aimGuide.cueDeflectX !== undefined && aimGuide.cueDeflectY !== undefined) {
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(aimGuide.ghostCueX, aimGuide.ghostCueY);
        ctx.lineTo(aimGuide.cueDeflectX, aimGuide.cueDeflectY);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 5. Balls
    balls.forEach(ball => {
      if (ball.isPotted) return;
      const scaleFactor = ball.isSinking ? Math.max(0.1, 1 - ball.pocketProgress) : 1;
      const alpha = ball.isSinking ? Math.max(0, 1 - ball.pocketProgress) : 1;
      const r = ball.radius * scaleFactor;

      ctx.save();
      ctx.globalAlpha = alpha;

      // Ball shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.arc(ball.x + 2.5 * scaleFactor, ball.y + 2.5 * scaleFactor, r * 1.05, 0, Math.PI * 2);
      ctx.fill();

      if (ball.type === 'CUE') {
        // Cue ball
        const cueGrad = ctx.createRadialGradient(ball.x - r * 0.3, ball.y - r * 0.3, 1, ball.x, ball.y, r * 1.2);
        cueGrad.addColorStop(0, '#FFFFFF');
        cueGrad.addColorStop(0.7, '#F1F5F9');
        cueGrad.addColorStop(1, '#CBD5E1');
        ctx.fillStyle = cueGrad;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Red dot
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 1.5 * scaleFactor, 0, Math.PI * 2);
        ctx.fill();
      } else if (ball.type === 'EIGHT') {
        // 8-ball (black)
        const eightGrad = ctx.createRadialGradient(ball.x - r * 0.3, ball.y - r * 0.3, 1, ball.x, ball.y, r * 1.2);
        eightGrad.addColorStop(0, '#334155');
        eightGrad.addColorStop(0.6, '#0F172A');
        eightGrad.addColorStop(1, '#020617');
        ctx.fillStyle = eightGrad;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Center white circle
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, r * 0.45, 0, Math.PI * 2);
        ctx.fill();

        if (scaleFactor > 0.6) {
          ctx.fillStyle = '#000000';
          ctx.font = `bold ${Math.round(8 * scaleFactor)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('8', ball.x, ball.y);
        }
      } else if (ball.type === 'STRIPE') {
        // Stripe ball: White base
        const baseGrad = ctx.createRadialGradient(ball.x - r * 0.3, ball.y - r * 0.3, 1, ball.x, ball.y, r * 1.2);
        baseGrad.addColorStop(0, '#FFFFFF');
        baseGrad.addColorStop(1, '#E2E8F0');
        ctx.fillStyle = baseGrad;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Color band
        ctx.save();
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = ball.baseColor;
        ctx.fillRect(ball.x - r, ball.y - r * 0.5, r * 2, r);
        ctx.restore();

        // Center circle & number
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, r * 0.45, 0, Math.PI * 2);
        ctx.fill();

        if (scaleFactor > 0.6) {
          ctx.fillStyle = '#000000';
          ctx.font = `bold ${Math.round(7.5 * scaleFactor)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(ball.number.toString(), ball.x, ball.y);
        }
      } else {
        // Solid ball
        const solidGrad = ctx.createRadialGradient(ball.x - r * 0.3, ball.y - r * 0.3, 1, ball.x, ball.y, r * 1.2);
        solidGrad.addColorStop(0, ball.baseColor);
        solidGrad.addColorStop(1, '#1E293B');
        ctx.fillStyle = solidGrad;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Center circle & number
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, r * 0.45, 0, Math.PI * 2);
        ctx.fill();

        if (scaleFactor > 0.6) {
          ctx.fillStyle = '#000000';
          ctx.font = `bold ${Math.round(7.5 * scaleFactor)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(ball.number.toString(), ball.x, ball.y);
        }
      }

      // Top-left specular shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(ball.x - r * 0.32, ball.y - r * 0.32, r * 0.25, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    // 6. Cue Stick
    const cue = balls.find(b => b.type === 'CUE');
    if (isHumanTurn && !isBallInHand && cue && !cue.isPotted && !cue.isSinking) {
      const backAngle = aimAngle + Math.PI;
      const pullback = 18 + cuePower * 70;

      const tipX = cue.x + Math.cos(backAngle) * pullback;
      const tipY = cue.y + Math.sin(backAngle) * pullback;

      const shaftEndX = cue.x + Math.cos(backAngle) * (pullback + 140);
      const shaftEndY = cue.y + Math.sin(backAngle) * (pullback + 140);

      const buttEndX = cue.x + Math.cos(backAngle) * (pullback + 240);
      const buttEndY = cue.y + Math.sin(backAngle) * (pullback + 240);

      // Cue chalk tip
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX + Math.cos(backAngle) * 8, tipY + Math.sin(backAngle) * 8);
      ctx.stroke();

      // Maple shaft
      const shaftGrad = ctx.createLinearGradient(tipX, tipY, shaftEndX, shaftEndY);
      shaftGrad.addColorStop(0, '#FDE68A');
      shaftGrad.addColorStop(1, '#D97706');
      ctx.strokeStyle = shaftGrad;
      ctx.lineWidth = 5.5;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(tipX + Math.cos(backAngle) * 8, tipY + Math.sin(backAngle) * 8);
      ctx.lineTo(shaftEndX, shaftEndY);
      ctx.stroke();

      // Brass joint ring
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 6.5;
      ctx.beginPath();
      ctx.moveTo(shaftEndX, shaftEndY);
      ctx.lineTo(shaftEndX + Math.cos(backAngle) * 6, shaftEndY + Math.sin(backAngle) * 6);
      ctx.stroke();

      // Butt handle
      const buttGrad = ctx.createLinearGradient(shaftEndX, shaftEndY, buttEndX, buttEndY);
      buttGrad.addColorStop(0, '#1E1B4B');
      buttGrad.addColorStop(1, '#0F172A');
      ctx.strokeStyle = buttGrad;
      ctx.lineWidth = 7.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(shaftEndX + Math.cos(backAngle) * 6, shaftEndY + Math.sin(backAngle) * 6);
      ctx.lineTo(buttEndX, buttEndY);
      ctx.stroke();
    }

    // 7. Ball-in-Hand visual feedback
    if (isHumanTurn && isBallInHand && cue) {
      ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.beginPath();
      ctx.arc(cue.x, cue.y, cue.radius * 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }, [balls, aimAngle, cuePower, aimGuide, isHumanTurn, isBallInHand]);

  useEffect(() => {
    render();
  }, [render]);

  // Canvas Resize observer
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const availWidth = container.clientWidth;
      const targetAspect = 2; // 1000 / 500
      let w = availWidth;
      let h = w / targetAspect;

      const maxH = window.innerHeight * 0.55;
      if (h > maxH) {
        h = maxH;
        w = h * targetAspect;
      }

      canvas.width = w;
      canvas.height = h;
      render();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  // Pointer Interaction
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isHumanTurn) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = PoolPhysics.TABLE_WIDTH / canvas.width;
    const clickX = (e.clientX - rect.left) * scale;
    const clickY = (e.clientY - rect.top) * scale;

    setIsDragging(true);

    if (isBallInHand) {
      onRepositionCueBall(clickX, clickY);
    } else {
      const cue = balls.find(b => b.type === 'CUE');
      if (cue) {
        const dx = clickX - cue.x;
        const dy = clickY - cue.y;
        onAimChange(Math.atan2(dy, dx));
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging || !isHumanTurn) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = PoolPhysics.TABLE_WIDTH / canvas.width;
    const moveX = (e.clientX - rect.left) * scale;
    const moveY = (e.clientY - rect.top) * scale;

    if (isBallInHand) {
      onRepositionCueBall(moveX, moveY);
    } else {
      const cue = balls.find(b => b.type === 'CUE');
      if (cue) {
        const dx = moveX - cue.x;
        const dy = moveY - cue.y;
        onAimChange(Math.atan2(dy, dx));
      }
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div ref={containerRef} className="w-full flex items-center justify-center p-2">
      <canvas
        ref={canvasRef}
        className="rounded-2xl shadow-2xl touch-none border border-slate-700/50 cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
};
