import { Vector2 } from './Vector2';
import { Ball, AimGuideData } from '../types';

export class PoolPhysics {
  static readonly TABLE_WIDTH = 1000;
  static readonly TABLE_HEIGHT = 500;

  static readonly MIN_X = 54;
  static readonly MAX_X = 946;
  static readonly MIN_Y = 54;
  static readonly MAX_Y = 446;

  static readonly BALL_RADIUS = 11.5;
  static readonly POCKET_RADIUS_CORNER = 22;
  static readonly POCKET_RADIUS_MIDDLE = 20;

  static readonly FRICTION = 0.988;
  static readonly CUSHION_RESTITUTION = 0.82;
  static readonly BALL_RESTITUTION = 0.92;
  static readonly VELOCITY_THRESHOLD = 0.08;

  static readonly POCKETS = [
    new Vector2(54, 54),       // Top-Left
    new Vector2(500, 48),      // Top-Middle
    new Vector2(946, 54),      // Top-Right
    new Vector2(54, 446),      // Bottom-Left
    new Vector2(500, 452),     // Bottom-Middle
    new Vector2(946, 446),     // Bottom-Right
  ];

  static readonly BALL_COLORS: Record<number, string> = {
    1: '#FBBF24', // Yellow
    2: '#3B82F6', // Blue
    3: '#EF4444', // Red
    4: '#8B5CF6', // Purple
    5: '#F97316', // Orange
    6: '#10B981', // Green
    7: '#991B1B', // Maroon / Dark Red
    8: '#0F172A', // Black (8-ball)
    9: '#FBBF24', // Stripe Yellow
    10: '#3B82F6', // Stripe Blue
    11: '#EF4444', // Stripe Red
    12: '#8B5CF6', // Stripe Purple
    13: '#F97316', // Stripe Orange
    14: '#10B981', // Stripe Green
    15: '#991B1B', // Stripe Maroon
  };

  static createInitialRack(): Ball[] {
    const balls: Ball[] = [];
    const r = PoolPhysics.BALL_RADIUS;

    // Cue Ball at head string
    balls.push({
      id: 0,
      number: 0,
      type: 'CUE',
      x: 280,
      y: 250,
      vx: 0,
      vy: 0,
      radius: r,
      baseColor: '#FFFFFF',
      isPotted: false,
      isSinking: false,
      pocketProgress: 0
    });

    // Standard 15-ball triangle rack at apex (x=700, y=250)
    const apexX = 680;
    const apexY = 250;
    const dx = r * 1.732; // cos(30 deg) * 2r
    const dy = r * 2.02;

    const rackNumbers = [
      1,
      2, 9,
      3, 8, 10,
      4, 14, 7, 11,
      5, 13, 15, 6, 12
    ];

    let index = 0;
    for (let row = 0; row < 5; row++) {
      const rowStartX = apexX + row * dx;
      const rowStartY = apexY - (row * dy) / 2;

      for (let col = 0; col <= row; col++) {
        const num = rackNumbers[index++];
        const type = num === 8 ? 'EIGHT' : (num <= 7 ? 'SOLID' : 'STRIPE');

        balls.push({
          id: num,
          number: num,
          type,
          x: rowStartX,
          y: rowStartY + col * dy,
          vx: 0,
          vy: 0,
          radius: r,
          baseColor: PoolPhysics.BALL_COLORS[num] || '#FFFFFF',
          isPotted: false,
          isSinking: false,
          pocketProgress: 0
        });
      }
    }

    return balls;
  }

  static stepSimulation(balls: Ball[], substeps: number = 4): boolean {
    let anyMoving = false;
    const dt = 1.0 / substeps;

    for (let step = 0; step < substeps; step++) {
      for (const ball of balls) {
        if (ball.isPotted) continue;

        if (ball.isSinking) {
          ball.pocketProgress += 0.08 * dt;
          if (ball.pocketProgress >= 1.0) {
            ball.isPotted = true;
            ball.isSinking = false;
            ball.vx = 0;
            ball.vy = 0;
          }
          anyMoving = true;
          continue;
        }

        const speedSq = ball.vx * ball.vx + ball.vy * ball.vy;
        if (speedSq > PoolPhysics.VELOCITY_THRESHOLD * PoolPhysics.VELOCITY_THRESHOLD) {
          anyMoving = true;
          ball.x += ball.vx * dt;
          ball.y += ball.vy * dt;

          const frictionCoeff = Math.pow(PoolPhysics.FRICTION, dt);
          ball.vx *= frictionCoeff;
          ball.vy *= frictionCoeff;
        } else {
          ball.vx = 0;
          ball.vy = 0;
        }

        // Pocket check
        for (const pocket of PoolPhysics.POCKETS) {
          const pdx = ball.x - pocket.x;
          const pdy = ball.y - pocket.y;
          const distSq = pdx * pdx + pdy * pdy;
          const pocketR = (pocket.x === 500 ? PoolPhysics.POCKET_RADIUS_MIDDLE : PoolPhysics.POCKET_RADIUS_CORNER) + 2;

          if (distSq < pocketR * pocketR) {
            ball.isSinking = true;
            ball.pocketProgress = 0;
            ball.vx *= 0.3;
            ball.vy *= 0.3;
            anyMoving = true;
            break;
          }
        }

        if (ball.isSinking) continue;

        // Cushion bounce
        const r = ball.radius;
        if (ball.x - r < PoolPhysics.MIN_X) {
          ball.x = PoolPhysics.MIN_X + r;
          ball.vx = -ball.vx * PoolPhysics.CUSHION_RESTITUTION;
        } else if (ball.x + r > PoolPhysics.MAX_X) {
          ball.x = PoolPhysics.MAX_X - r;
          ball.vx = -ball.vx * PoolPhysics.CUSHION_RESTITUTION;
        }

        if (ball.y - r < PoolPhysics.MIN_Y) {
          ball.y = PoolPhysics.MIN_Y + r;
          ball.vy = -ball.vy * PoolPhysics.CUSHION_RESTITUTION;
        } else if (ball.y + r > PoolPhysics.MAX_Y) {
          ball.y = PoolPhysics.MAX_Y - r;
          ball.vy = -ball.vy * PoolPhysics.CUSHION_RESTITUTION;
        }
      }

      // Ball-to-ball collisions
      for (let i = 0; i < balls.length; i++) {
        const b1 = balls[i];
        if (b1.isPotted || b1.isSinking) continue;

        for (let j = i + 1; j < balls.length; j++) {
          const b2 = balls[j];
          if (b2.isPotted || b2.isSinking) continue;

          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const distSq = dx * dx + dy * dy;
          const minDist = b1.radius + b2.radius;

          if (distSq < minDist * minDist && distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            const nx = dx / dist;
            const ny = dy / dist;

            // Separate overlapping balls
            const overlap = (minDist - dist) * 0.5;
            b1.x -= nx * overlap;
            b1.y -= ny * overlap;
            b2.x += nx * overlap;
            b2.y += ny * overlap;

            // Elastic impulse
            const kx = b1.vx - b2.vx;
            const ky = b1.vy - b2.vy;
            const p = 2 * (nx * kx + ny * ky) / 2; // equal masses

            if (p > 0) {
              const impulse = p * PoolPhysics.BALL_RESTITUTION;
              b1.vx -= impulse * nx;
              b1.vy -= impulse * ny;
              b2.vx += impulse * nx;
              b2.vy += impulse * ny;
              anyMoving = true;
            }
          }
        }
      }
    }

    return anyMoving;
  }

  static calculateAimGuide(cueBall: Ball, balls: Ball[], aimAngle: Float64Array | number): AimGuideData {
    const angle = typeof aimAngle === 'number' ? aimAngle : aimAngle[0];
    const dir = Vector2.fromAngle(angle);
    const start = new Vector2(cueBall.x, cueBall.y);

    let closestDist = 1200;
    let hitBall: Ball | null = null;
    const r = PoolPhysics.BALL_RADIUS;

    for (const target of balls) {
      if (target.id === cueBall.id || target.isPotted || target.isSinking) continue;

      const toTarget = new Vector2(target.x - start.x, target.y - start.y);
      const proj = toTarget.dot(dir);
      if (proj <= 0) continue;

      const perpSq = toTarget.lengthSq() - proj * proj;
      const combinedR = r * 2;
      if (perpSq < combinedR * combinedR) {
        const d = proj - Math.sqrt(Math.max(0, combinedR * combinedR - perpSq));
        if (d < closestDist && d > 0) {
          closestDist = d;
          hitBall = target;
        }
      }
    }

    if (hitBall) {
      const ghostPos = start.add(dir.mul(closestDist));
      const targetPos = new Vector2(hitBall.x, hitBall.y);
      const normal = targetPos.sub(ghostPos).normalized();
      const targetTrajectory = normal.mul(70);
      const cueDeflection = dir.sub(normal.mul(dir.dot(normal))).normalized().mul(45);

      return {
        rayStartX: start.x,
        rayStartY: start.y,
        impactX: ghostPos.x,
        impactY: ghostPos.y,
        ghostCueX: ghostPos.x,
        ghostCueY: ghostPos.y,
        hasBallHit: true,
        targetBallX: targetPos.x + targetTrajectory.x,
        targetBallY: targetPos.y + targetTrajectory.y,
        cueDeflectX: ghostPos.x + cueDeflection.x,
        cueDeflectY: ghostPos.y + cueDeflection.y
      };
    }

    // Cushion raycast
    let rayLen = 900;
    if (dir.x > 0.001) rayLen = Math.min(rayLen, (PoolPhysics.MAX_X - r - start.x) / dir.x);
    else if (dir.x < -0.001) rayLen = Math.min(rayLen, (PoolPhysics.MIN_X + r - start.x) / dir.x);

    if (dir.y > 0.001) rayLen = Math.min(rayLen, (PoolPhysics.MAX_Y - r - start.y) / dir.y);
    else if (dir.y < -0.001) rayLen = Math.min(rayLen, (PoolPhysics.MIN_Y + r - start.y) / dir.y);

    const impact = start.add(dir.mul(Math.max(0, rayLen)));
    return {
      rayStartX: start.x,
      rayStartY: start.y,
      impactX: impact.x,
      impactY: impact.y,
      ghostCueX: impact.x,
      ghostCueY: impact.y,
      hasBallHit: false
    };
  }
}
