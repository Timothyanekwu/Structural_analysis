export class Equation {
  simult2(
    x1: number,
    x2: number,
    x3: number,
    y1: number,
    y2: number,
    y3: number
  ) {
    const a1 = y1 * x1;
    const a2 = y1 * x2;
    const a3 = y1 * x3;

    const b1 = x1 * y1;
    const b2 = x1 * y2;
    const b3 = x1 * y3;

    // Simultaneous equn being:
    // a1X + a2Y = a3 -------> i
    // b1X + b2Y = b3 -------> ii

    const c2 = a2 - b2;
    const c3 = a3 - b3;
    console.log(c2, c3);

    const Y = c3 / c2;

    const X = (a3 - (a2 * Y)) / a1; // prettier-ignore

    return { X, Y };
  }
}
