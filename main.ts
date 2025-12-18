// output.ts

import { Beam } from "./elements/beam";
import { FixedSupport, PinnedSupport, RollerSupport } from "./elements/support";
import { FixedEndMoments } from "./logic/FEMs";
import { SlopeDeflection } from "./logic/slopeDeflectionEqn";
import { Equation } from "./logic/simultaneousEqn";
import { PointLoad, UDL, VDL } from "./elements/load";
import { Node } from "./elements/beam";

// // FIRST SPAN
// const support1 = new FixedSupport(0);
// const support2 = new RollerSupport(25, 0, support1);
// const AB = new Beam( support2.prev?.position || 0, support2.position - support1.position, [support1, support2] );
// //const load1 = new VDL(3, 18, 0, 0);
// const load1 = new PointLoad(10, 18);
// AB.addLoad(load1);
// support1.rightBeam = AB;
// support2.leftBeam = AB;

// // SECOND SPAN
// const support3 = new FixedSupport(55, 0, support2);
// const BC = new Beam( support3.prev?.position || 0, support3.position - support2.position, [support2, support3] );
// const load2 = new UDL(25, 30, 2); BC.addLoad(load2);
// support2.rightBeam = BC;
// support3.leftBeam = BC;

// --- CREATE SUPPORTS ---
const support1 = new FixedSupport(0);
const support2 = new RollerSupport(25, 0, support1);
const support3 = new FixedSupport(55, 0, support2);

// --- CREATE NODES ---
const nodeA = new Node("A", support1.position, 0, support1);
const nodeB = new Node("B", support2.position, 0, support2);
const nodeC = new Node("C", support3.position, 0, support3);

// --- EXTEND NODE TO TRACK CONNECTED MEMBERS ---
nodeA.connectedMembers = [];
nodeB.connectedMembers = [];
nodeC.connectedMembers = [];

// --- CREATE BEAMS ---
// Updated to match Beam constructor: startNode, endNode, leftSupport, rightSupport
const AB = new Beam(nodeA, nodeB, support1, support2);
const BC = new Beam(nodeB, nodeC, support2, support3);

// --- ADD LOADS ---
AB.addLoad(new PointLoad(10, 18));
BC.addLoad(new UDL(25, 30, 2));

// --- LINK BEAMS TO SUPPORTS ---
support1.rightBeam = AB;
support2.leftBeam = AB;
support2.rightBeam = BC;
support3.leftBeam = BC;

// --- LINK BEAMS TO NODES ---
// nodeA.connectedMembers.push(AB);
// nodeB.connectedMembers.push(AB, BC);
// nodeC.connectedMembers.push(BC);

console.log(AB, BC);

export class Output {
  beams: Beam[];
  FEM: FixedEndMoments;
  slopeDeflection: SlopeDeflection;
  equation: Equation;

  constructor(beams: Beam[] = []) {
    this.beams = beams;
    this.FEM = new FixedEndMoments();
    this.slopeDeflection = new SlopeDeflection();
    this.equation = new Equation();
  }

  /** Get all unique supports in the system */
  getSupports() {
    const supports = this.beams.flatMap((beam) => [
      beam.leftSupport,
      beam.rightSupport,
    ]);
    return Array.from(new Set(supports.filter((s) => s !== null))) as (
      | FixedSupport
      | RollerSupport
      | PinnedSupport
    )[];
  }

  getSupportMoments() {
    const supports = this.getSupports().filter(
      (s): s is FixedSupport | PinnedSupport | RollerSupport => s !== null
    );

    const supportMoments = supports.map((support) =>
      this.slopeDeflection.supportEquations(support)
    );

    return supportMoments;
  }

  /** Get slope-deflection support equations */
  getSupportEquations() {
    return this.getSupports().map((support) =>
      this.slopeDeflection.supportEquations(support)
    );
  }

  /** Solve simultaneous equations for non-fixed supports */
  getEquations() {
    const supports = this.getSupports();
    return supports
      .filter((s) => s.type !== "fixed")
      .map((s) => this.slopeDeflection.getEquations(s));
  }

  /** Solve for final moments at supports */
  getFinalMoments() {
    const supportMoments = this.getSupportMoments();
    const equations = this.getEquations();
    const simulEqnSoln = this.equation.solveEquations(equations);

    const momentValues = supportMoments.map((supportEqn, index) => {
      // console.log(supportEqn.left, supportEqn.right);

      const leftMoment = Object.fromEntries(
        supportEqn.left.map((term) => [term.name, term.coefficient])
      );
      const rightMoment = Object.fromEntries(
        supportEqn.right.map((term) => [term.name, term.coefficient])
      );

      const leftMomentValue = Object.entries(leftMoment).reduce(
        (acc, [key, coeff]) => {
          const value = simulEqnSoln[key] || 1;
          return acc + coeff * value;
        },
        0
      );

      const rightMomentValue = Object.entries(rightMoment).reduce(
        (acc, [key, coeff]) => {
          const value = simulEqnSoln[key] || 1;
          return acc + coeff * value;
        },
        0
      );

      // assign the left and right moments for each supports here
      const supports = this.getSupports();
      const support = supports[index];
      if (support) {
        support.leftMoment = leftMomentValue;
        support.rightMoment = rightMomentValue;
      }

      return { leftMoment: leftMomentValue, rightMoment: rightMomentValue };
    });

    return momentValues;
  }

  solveReactions(beam: Beam) {
    const loads = beam.getEquivalentPointLoads();
    const L = beam.length;
    const leftMoment = beam.leftSupport?.rightMoment ?? 0;
    const rightMoment = beam.rightSupport?.leftMoment ?? 0;

    if (beam.rightSupport && beam.leftSupport) {
      const refPos = beam.leftSupport.position;

      const loadMoments = loads.reduce((acc: number, curr: PointLoad) => {
        const distance = curr.position - refPos;
        const moment = curr.magnitude * distance;

        return acc + moment;
      }, 0);

      const rightReaction = (loadMoments - leftMoment - rightMoment) / L;

      const totalLoads = loads.reduce((acc: number, curr: PointLoad) => {
        return acc + curr.magnitude;
      }, 0);

      const leftReaction = totalLoads - rightReaction;

      return { leftReaction, rightReaction };
    } else {
      // when we are haveing overhanging write the logic here
    }
  }

  // Get the reaction for a single support

  getSupportReactions() {
    const supports = this.getSupports();

    const result: Record<string, number> = {};

    supports
      .filter(
        (support): support is PinnedSupport | RollerSupport | FixedSupport =>
          support !== null
      )
      .forEach((support) => {
        // LEFT

        const leftReaction = support.leftBeam
          ? this.solveReactions(support.leftBeam)?.rightReaction ?? 0
          : 0;

        // RIGHT

        const rightReaction = support.rightBeam
          ? this.solveReactions(support.rightBeam)?.leftReaction ?? 0
          : 0;

        result[`SUPPORT${support.id}`] = leftReaction + rightReaction;
      });
    return result;
  }
}

// const output = new Output([AB, BC]);
// output.getFinalMoments();
// console.log(output.getSupportReactions());
