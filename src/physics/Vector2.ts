export class Vector2 {
  constructor(public x: number = 0, public y: number = 0) {}

  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  sub(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  mul(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y;
  }

  normalized(): Vector2 {
    const len = this.length();
    return len > 0.0001 ? new Vector2(this.x / len, this.y / len) : new Vector2(0, 0);
  }

  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }

  distanceTo(v: Vector2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static fromAngle(radians: number, length: number = 1): Vector2 {
    return new Vector2(Math.cos(radians) * length, Math.sin(radians) * length);
  }
}
