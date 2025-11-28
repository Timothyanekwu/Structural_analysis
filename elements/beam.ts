import { PinnedSupport, RollerSupport, FixedSupport } from "./support";
import { Support } from "./support";
import { PointLoad, UDL, VDL } from "./load";
import { Moment } from "../logic/moment";
import { StaticVariable } from "../logic/slopeDeflectionEqn";

export class Beam {
  startPosition: number;
  length: number;
  supports: [Support, Support];
  loads: (PointLoad | UDL | VDL)[];
  Icoef: number;
  Ecoef: number;

  constructor(
    startPosition: number,
    length: number,
    supports: [Support, Support],
    Icoef: number = 1,
    Ecoef: number = 1
  ) {
    this.startPosition = startPosition;
    this.length = length;
    this.supports = supports;
    this.loads = [];
    this.Icoef = Icoef;
    this.Ecoef = Ecoef;
  }

  addSupport(support: FixedSupport | PinnedSupport | RollerSupport) {
    this.supports.push(support);
  }

  addLoad(load: PointLoad | UDL | VDL) {
    if (load.name === "PointLoad") {
      if (
        load.position < this.startPosition ||
        load.position > this.startPosition + this.length
      ) {
        throw new Error(
          "Invalid position of PointLoad: The load should be within the length of the beam"
        );
      }
    }

    if (load.name === "UDL") {
      const start = load.startPosition;
      const end = load.startPosition + load.span;

      if (
        start < this.startPosition ||
        end > this.startPosition + this.length
      ) {
        throw new Error(
          "Invalid position of UDL: The load's span should be within the length of the beam"
        );
      }
    }

    if (load.name === "VDL") {
      const low = load.lowPosition;
      const high = load.highPosition;

      if (
        low < this.startPosition ||
        high < this.startPosition ||
        low > this.startPosition + this.length ||
        high > this.startPosition + this.length
      ) {
        throw new Error(
          "Invalid position of VDL: Both positions must lie within the length of the beam"
        );
      }
    }

    this.loads.push(load);
  }

  // degreeOfStaticIndeterminacy() {
  //   const totalReactions = this.supports.reduce(
  //     (sum, support) => sum + support.YReaction,
  //     0
  //   );
  //   return totalReactions - 3; // For planar beams, 3 equations of equilibrium
  // }

  getEquivalentPointLoads() {
    // did this is for determinate beams
    const pointLoads: PointLoad[] = [];

    for (const load of this.loads) {
      if (load instanceof PointLoad) {
        pointLoads.push(load);
      } else if (load instanceof UDL) {
        pointLoads.push(load.getResultantLoad());
      } else if (load instanceof VDL) {
        pointLoads.push(load.getResultantLoad());
      }
    }

    return pointLoads;
  }

  // --- Solver for simply supported beam ---
  // solveReactions() {
  //   if (this.supports.length !== 2) {
  //     throw new Error(
  //       "Only simply supported beams with 2 supports are supported."
  //     );
  //   }

  //   const L = this.length;
  //   const refPos = this.supports[0].position;
  //   const loads = this.getEquivalentPointLoads();

  //   const moment = new Moment();
  //   let sumOfMoments = 0;

  //   // iterate over each load on the beam
  //   for (let i = 0; i < this.loads.length; i++) {
  //     if (loads[i].position < refPos) {
  //       // if the current position of a load on the beam is less than the position of the reference position, then we perform the anticlockwise moment then update the sumOfMoments
  //       const distance = refPos - loads[i].position;
  //       sumOfMoments += moment.antiClockwiseMoment(
  //         loads[i].magnitude,
  //         distance
  //       );
  //     } else if (loads[i].position > refPos) {
  //       // if the current position of a load on the beam is greater than the position of the reference position, then we perform the clockwise moment then update the sumOfMoments
  //       const distance = loads[i].position - refPos;
  //       sumOfMoments += moment.clockwiseMoment(loads[i].magnitude, distance);
  //     } else {
  //       // else if the position is the same as that of the reference position, then moment is zero
  //       sumOfMoments += 0;
  //     }
  //   }

  //   // sum of downward force (loads)
  //   const totalLoad = loads.reduce((sum, load) => sum + load.magnitude, 0);
  //   console.log("Total Load on Beam:", totalLoad);

  //   const distBtwSupports =
  //     this.supports[1].position - this.supports[0].position; // distance between supports
  //   this.supports[1].YReaction = sumOfMoments / distBtwSupports; // reaction at the second support gotten
  //   console.log("Distance between Supports:", distBtwSupports);

  //   this.supports[0].YReaction = totalLoad - this.supports[1].YReaction; // reaction at the first support

  //   const RA = this.supports[0].YReaction;
  //   const RB = this.supports[1].YReaction;

  //   return { RA, RB };
  // }

  // Optionally, add more methods later:
  // getShearAt(x), getMomentAt(x), etc.
  // come back to this
}
