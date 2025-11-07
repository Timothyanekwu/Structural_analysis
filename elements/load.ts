// --- Load Class ---
export class Load {
  position: number; // m
  magnitude: number; // kN (downward positive)

  constructor(position: number, magnitude: number) {
    this.position = position;
    this.magnitude = magnitude;
  }
}
