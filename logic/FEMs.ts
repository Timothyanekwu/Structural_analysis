import { PointLoad, UDL, VDL } from "../elements/load";
import { Beam } from "../elements/beam";
import {
  FixedSupport,
  PinnedSupport,
  RollerSupport,
  Support,
} from "../elements/support";

export class FixedEndMoments {
  // For a single support
  // getFixedEndMoment(
  //   loads: (PointLoad | UDL | VDL)[],
  //   length: number,
  //   position: "left" | "right",
  //   leftSupport: Support | FixedSupport | PinnedSupport | RollerSupport
  // ) {
  //   // FOR POINTLOADS | UDLs
  //   if (position === "right") {
  //     // Therefore, the Fixed End Support's moment is in the clockwise direction & i.e -ve

  //     const rightMoment = loads.reduce(
  //       (res: number, curr: PointLoad | UDL | VDL) => {
  //         if (curr.name === "PointLoad") {
  //           const a = curr.position - leftSupport.position;
  //           const b = length - a;
  //           const w = curr.magnitude;

  //           const result = (w * a ** 2 * b) / length ** 2;

  //           return res + result;
  //         }

  //         if (curr.name === "UDL") {
  //           const w = curr.magnitudePerMeter;
  //           const a = curr.startPosition - leftSupport.position;
  //           const b = curr.span + a;
  //           const l = length;

  //           const t1 = (l / 3) * (b ** 3 - a ** 3);
  //           const t2 = (1 / 4) * (b ** 4 - a ** 4);

  //           const generalEqn = (w / l ** 2) * (t1 - t2);

  //           return res + generalEqn;
  //         }

  //         if (curr.name === "VDL") {
  //           const a = curr.lowPosition - leftSupport.position;
  //           const b = curr.highPosition - leftSupport.position;
  //           const w = curr.highMagnitude;
  //           const l = length;

  //           if (b > a) {
  //             const tr1 = (l / 4) * (b ** 4 - a ** 4);
  //             const tr2 = (1 / 5) * (a ** 5 - b ** 5);

  //             const right = (w / l ** 3) * (tr1 + tr2);

  //             return res + right;
  //           } else if (b < a) {
  //             const tl1 = (l ** 2 / 3) * (b ** 3 - a ** 3);
  //             const tl2 = (1 / 5) * (b ** 5 - a ** 5);
  //             const tl3 = (l / 2) * (a ** 4 - b ** 4);

  //             const right = (w / l ** 3) * (tl1 + tl2 + tl3) * -1;
  //             // The -1 here is to make the value back to +ve since the loading is in the opposite direction

  //             return res + right;
  //           }

  //           throw Error(
  //             "The Highest Load position cannot be the same as the Lowest Load position for a VD Loading"
  //           );
  //         }

  //         return res;
  //       },
  //       0
  //     );

  //     return rightMoment * -1; // The -1 negates the moment since it is clockwise
  //   } else if (position === "left") {
  //     // else the Fixed End Support's moment is in the anticlockwise direction & i.e +ve

  //     const leftMoment = loads.reduce(
  //       (res: number, curr: PointLoad | UDL | VDL) => {
  //         if (curr.name === "PointLoad") {
  //           const a = curr.position - leftSupport.position;
  //           const b = length - a;
  //           const w = curr.magnitude;

  //           const result = (w * a * b ** 2) / length ** 2;

  //           return res + result;
  //         }

  //         if (curr.name === "UDL") {
  //           const w = curr.magnitudePerMeter;
  //           const a = curr.startPosition - leftSupport.position;
  //           const b = curr.span + a;
  //           const l = length;

  //           const t1 = (l ** 2 / 2) * (b ** 2 - a ** 2);
  //           const t2 = ((2 * l) / 3) * (b ** 3 - a ** 3);
  //           const t3 = (1 / 4) * (b ** 4 - a ** 4);

  //           const generalEqn = (w / l ** 2) * (t1 - t2 + t3);

  //           return res + generalEqn;
  //         }

  //         if (curr.name == "VDL") {
  //           const a = curr.lowPosition - leftSupport.position;
  //           const b = curr.highPosition - leftSupport.position;
  //           const w = curr.highMagnitude;
  //           const l = length;

  //           if (b > a) {
  //             // LEFT
  //             const tl1 = (l ** 2 / 3) * (b ** 3 - a ** 3);
  //             const tl2 = (1 / 5) * (b ** 5 - a ** 5);
  //             const tl3 = (l / 2) * (a ** 4 - b ** 4);

  //             const left = (w / l ** 3) * (tl1 + tl2 + tl3);

  //             return res + left;
  //           } else if (b < a) {
  //             const tr1 = (l / 4) * (b ** 4 - a ** 4);
  //             const tr2 = (1 / 5) * (a ** 5 - b ** 5);

  //             const left = (w / l ** 3) * (tr1 + tr2) * -1;
  //             // The -1 here is to make the value back to +ve since the loading is in the opposite direction

  //             return res + left;
  //           }

  //           throw Error(
  //             "The Highest Load position cannot be the same as the Lowest Load position for VD Loading"
  //           );
  //         }

  //         return res;
  //       },
  //       0
  //     );

  //     return leftMoment;
  //   }
  // }

  getFixedEndMoment(
    loads: (PointLoad | UDL | VDL)[],
    length: number,
    position: "left" | "right",
    leftSupport: Support | FixedSupport | PinnedSupport | RollerSupport
  ) {
    if (position === "right") {
      // Right end moment (clockwise = -ve)
      let rightMoment = 0;
      let c = 0; // Kahan compensation

      for (const curr of loads) {
        let term = 0;

        if (curr.name === "PointLoad") {
          const a = curr.position - leftSupport.position;
          const b = length - a;
          const w = curr.magnitude;
          term = (w * a ** 2 * b) / length ** 2;
        } else if (curr.name === "UDL") {
          const w = curr.magnitudePerMeter;
          const a = curr.startPosition - leftSupport.position;
          const b = curr.span + a;
          const l = length;
          const t1 = (l / 3) * (b ** 3 - a ** 3);
          const t2 = (1 / 4) * (b ** 4 - a ** 4);
          term = (w / l ** 2) * (t1 - t2);
        } else if (curr.name === "VDL") {
          const a = curr.lowPosition - leftSupport.position;
          const b = curr.highPosition - leftSupport.position;
          const w = curr.highMagnitude;
          const l = length;

          if (b > a) {
            const tr1 = (l / 4) * (b ** 4 - a ** 4);
            const tr2 = (1 / 5) * (a ** 5 - b ** 5);
            term = (w / l ** 3) * (tr1 + tr2);
          } else if (b < a) {
            const tl1 = (l ** 2 / 3) * (b ** 3 - a ** 3);
            const tl2 = (1 / 5) * (b ** 5 - a ** 5);
            const tl3 = (l / 2) * (a ** 4 - b ** 4);
            term = (w / l ** 3) * (tl1 + tl2 + tl3) * -1;
          } else {
            throw new Error(
              "The Highest Load position cannot be the same as the Lowest Load position for a VD Loading"
            );
          }
        }

        // Kahan summation
        const y = term - c;
        const t = rightMoment + y;
        c = t - rightMoment - y;
        rightMoment = t;
      }

      return rightMoment * -1; // clockwise
    } else if (position === "left") {
      // Left end moment (anticlockwise = +ve)
      let leftMoment = 0;
      let c = 0; // Kahan compensation

      for (const curr of loads) {
        let term = 0;

        if (curr.name === "PointLoad") {
          const a = curr.position - leftSupport.position;
          const b = length - a;
          const w = curr.magnitude;
          term = (w * a * b ** 2) / length ** 2;
        } else if (curr.name === "UDL") {
          const w = curr.magnitudePerMeter;
          const a = curr.startPosition - leftSupport.position;
          const b = curr.span + a;
          const l = length;
          const t1 = (l ** 2 / 2) * (b ** 2 - a ** 2);
          const t2 = ((2 * l) / 3) * (b ** 3 - a ** 3);
          const t3 = (1 / 4) * (b ** 4 - a ** 4);
          term = (w / l ** 2) * (t1 - t2 + t3);
        } else if (curr.name === "VDL") {
          const a = curr.lowPosition - leftSupport.position;
          const b = curr.highPosition - leftSupport.position;
          const w = curr.highMagnitude;
          const l = length;

          if (b > a) {
            const tl1 = (l ** 2 / 3) * (b ** 3 - a ** 3);
            const tl2 = (1 / 5) * (b ** 5 - a ** 5);
            const tl3 = (l / 2) * (a ** 4 - b ** 4);
            term = (w / l ** 3) * (tl1 + tl2 + tl3);
          } else if (b < a) {
            const tr1 = (l / 4) * (b ** 4 - a ** 4);
            const tr2 = (1 / 5) * (a ** 5 - b ** 5);
            term = (w / l ** 3) * (tr1 + tr2) * -1;
          } else {
            throw new Error(
              "The Highest Load position cannot be the same as the Lowest Load position for a VD Loading"
            );
          }
        }

        // Kahan summation
        const y = term - c;
        const t = leftMoment + y;
        c = t - leftMoment - y;
        leftMoment = t;
      }

      return leftMoment; // anticlockwise
    }
  }

  getAllFEMs(support: Support) {
    const fems: { supportId: number; left: number; right: number }[] = [];

    let curr: Support | null = support;

    while (curr) {
      let leftFEM = 0;
      let rightFEM = 0;

      // Compute FEM to the left if it exists
      if (curr.prev && curr.leftBeam) {
        const leftSpan = curr.position - curr.prev.position;

        leftFEM =
          this.getFixedEndMoment(
            curr.leftBeam.loads,
            leftSpan,
            "right",
            curr.prev
          ) || 0;
      }

      // Compute FEM to the right if it exists
      if (curr.next && curr.rightBeam) {
        const rightSpan = curr.next.position - curr.position;

        rightFEM =
          this.getFixedEndMoment(
            curr.rightBeam.loads,
            rightSpan,
            "left",
            curr
          ) || 0;
      }

      fems.push({
        supportId: curr.id,
        left: leftFEM,
        right: rightFEM,
      });

      curr = curr.next; // advance
    }

    return fems;
  }

  // getFixedEndMomentVDL(load: VDL, length: number) {
  //   const a = load.lowPosition;
  //   const b = load.highPosition;
  //   const w = load.highMagnitude;
  //   const l = length;

  //   // LEFT
  //   const tl1 = (l ** 2 / 3) * (b ** 3 - a ** 3);
  //   const tl2 = (1 / 5) * (b ** 5 - a ** 5);
  //   const tl3 = (l / 2) * (a ** 4 - b ** 4);

  //   const left = (w / l ** 3) * (tl1 + tl2 + tl3);

  //   // RIGHT
  //   const tr1 = (l / 4) * (b ** 4 - a ** 4);
  //   const tr2 = (1 / 5) * (a ** 5 - b ** 5);

  //   const right = (w / l ** 3) * (tr1 + tr2);

  //   const result = { left, right };

  //   return result;
  // }
}
