import { Support } from "./support";
import { PointLoad, UDL, VDL } from "./load";
import { Moment } from "../logic/moment";

export class Beam {
  length: number;
  supports: Support[];
  loads: (PointLoad | UDL | VDL)[];

  constructor(length: number) {
    this.length = length;
    this.supports = [];
    this.loads = [];
  }

  addSupport(support: Support) {
    this.supports.push(support);
  }

  addLoad(load: PointLoad | UDL | VDL) {
    this.loads.push(load);
  }

  degreeOfStaticIndeterminacy() {
    const totalReactions = this.supports.reduce(
      (sum, support) => sum + support["reaction"],
      0
    );
    return totalReactions - 3; // For planar beams, 3 equations of equilibrium
  }

  private getEquivalentPointLoads(): PointLoad[] {
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
  solveReactions() {
    if (this.supports.length !== 2) {
      throw new Error(
        "Only simply supported beams with 2 supports are supported."
      );
    }

    const L = this.length;
    const refPos = this.supports[0].position;
    const loads = this.getEquivalentPointLoads();

    const moment = new Moment();
    let sumOfMoments = 0;

    // iterate over each load on the beam
    for (let i = 0; i < this.loads.length; i++) {
      if (loads[i].position < refPos) {
        // if the current position of a load on the beam is less than the position of the reference position, then we perform the anticlockwise moment then update the sumOfMoments
        const distance = refPos - loads[i].position;
        sumOfMoments += moment.antiClockwiseMoment(
          loads[i].magnitude,
          distance
        );
      } else if (loads[i].position > refPos) {
        // if the current position of a load on the beam is greater than the position of the reference position, then we perform the clockwise moment then update the sumOfMoments
        const distance = loads[i].position - refPos;
        sumOfMoments += moment.clockwiseMoment(loads[i].magnitude, distance);
      } else {
        // else if the position is the same as that of the reference position, then moment is zero
        sumOfMoments += 0;
      }
    }

    // sum of downward force (loads)
    const totalLoad = loads.reduce((sum, load) => sum + load.magnitude, 0);
    console.log("Total Load on Beam:", totalLoad);

    const distBtwSupports =
      this.supports[1].position - this.supports[0].position; // distance between supports
    this.supports[1].reaction = sumOfMoments / distBtwSupports; // reaction at the second support gotten
    console.log("Distance between Supports:", distBtwSupports);

    this.supports[0].reaction = totalLoad - this.supports[1].reaction; // reaction at the first support

    const RA = this.supports[0].reaction;
    const RB = this.supports[1].reaction;

    return { RA, RB };
  }

  // Optionally, add more methods later:
  // getShearAt(x), getMomentAt(x), etc.
}
