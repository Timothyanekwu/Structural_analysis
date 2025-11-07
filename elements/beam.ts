import { Support } from "./support";
import { Load } from "./load";
import { Moment } from "../logic/moment";

export class Beam {
  length: number;
  supports: Support[];
  loads: Load[];

  constructor(length: number) {
    this.length = length;
    this.supports = [];
    this.loads = [];
  }

  addSupport(support: Support) {
    this.supports.push(support);
  }

  addLoad(load: Load) {
    this.loads.push(load);
  }

  degreeOfStaticIndeterminacy() {
    const totalReactions = this.supports.reduce(
      (sum, support) => sum + support["reaction"],
      0
    );
    return totalReactions - 3; // For planar beams, 3 equations of equilibrium
  }

  // --- Solver for simply supported beam ---
  solveReactions() {
    if (this.supports.length !== 2) {
      throw new Error(
        "Only simply supported beams with 2 supports are supported."
      );
    }

    const L = this.length;
    const refPos = this.supports[0].position;

    const moment = new Moment();
    let sumOfMoments = 0;

    // iterate over each load on the beam
    for (let i = 0; i < this.loads.length; i++) {
      if (this.loads[i].position < refPos) {
        // if the current position of a load on the beam is less than the position of the reference position, then we perform the anticlockwise moment then update the sumOfMoments
        const distance = refPos - this.loads[i].position;
        sumOfMoments += moment.antiClockwiseMoment(
          this.loads[i].magnitude,
          distance
        );
      } else if (this.loads[i].position > refPos) {
        // if the current position of a load on the beam is greater than the position of the reference position, then we perform the clockwise moment then update the sumOfMoments
        const distance = this.loads[i].position - refPos;
        sumOfMoments += moment.clockwiseMoment(
          this.loads[i].magnitude,
          distance
        );
      } else {
        // else if the position is the same as that of the reference position, then moment is zero
        sumOfMoments += 0;
      }
    }

    // sum of downward force (loads)
    const totalLoad = this.loads.reduce((sum, load) => sum + load.magnitude, 0);

    const distBtwSupports =
      this.supports[1].position - this.supports[0].position; // distance between supports
    this.supports[1].reaction = sumOfMoments / distBtwSupports; // reaction at the second support gotten

    this.supports[0].reaction = totalLoad - this.supports[1].reaction; // reaction at the first support

    const RA = this.supports[0].reaction;
    const RB = this.supports[1].reaction;

    return { RA, RB };
  }

  // Optionally, add more methods later:
  // getShearAt(x), getMomentAt(x), etc.
}
