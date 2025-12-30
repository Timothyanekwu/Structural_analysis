// output.ts

import { Beam, Column, InclinedMember } from "./elements/member";
import { FixedSupport, PinnedSupport, RollerSupport } from "./elements/support";
import { FixedEndMoments } from "./logic/FEMs";
import { SlopeDeflection } from "./logic/slopeDeflectionEqn";
import { Equation } from "./logic/simultaneousEqn";
import { PointLoad, UDL, VDL } from "./elements/load";
import { Node } from "./elements/node";

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
const nodeA = new Node("A", support1.x, 0, support1);
const nodeB = new Node("B", support2.x, 0, support2);
const nodeC = new Node("C", support3.x, 0, support3);

// --- CREATE BEAMS ---
// Updated to match Beam constructor: startNode, endNode, leftSupport, rightSupport
// const AB = new Beam(nodeA, nodeB, support1, support2);
// const BC = new Beam(nodeB, nodeC, support2, support3);
const AB = new Beam(nodeA, nodeB);
const BC = new Beam(nodeB, nodeC);

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

export class BeamSolver {
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
  get nodes(): Node[] {
    return [...new Set(this.beams.flatMap((b) => [b.startNode, b.endNode]))];
  }

  /** Get all unique supports in the system */
  getSupports() {
    const supports = this.beams.flatMap((beam) => [
      beam.startNode.support ?? null,
      beam.endNode.support ?? null,
    ]);
    return Array.from(new Set(supports.filter((s) => s !== null))) as (
      | FixedSupport
      | RollerSupport
      | PinnedSupport
    )[];
  }

  // getSupportMoments() {
  //   const supports = this.getSupports().filter(
  //     (s): s is FixedSupport | PinnedSupport | RollerSupport => s !== null
  //   );

  //   const supportMoments = supports.map((support) =>
  //     this.slopeDeflection.supportEquations(support)
  //   );

  //   return supportMoments;
  // }

  updatedGetSupportMoments() {
    return this.nodes.map((node) => {
      return this.slopeDeflection.updatedSupportEquation(node);
    });
  }

  /** Get slope-deflection support equations */
  // getSupportEquations() {
  //   return this.getSupports().map((support) =>
  //     this.slopeDeflection.supportEquations(support)
  //   );
  // }

  /** Solve simultaneous equations for non-fixed supports */
  // getEquations() {
  //   const supports = this.getSupports();
  //   return supports
  //     .filter((s) => s.type !== "fixed")
  //     .map((s) => this.slopeDeflection.getEquations(s));
  // }

  updatedGetEquations() {
    // const supports = this.getSupports();
    // return supports
    //   .filter((s) => s.type !== "fixed")
    //   .map((s) => this.slopeDeflection.updatedGetEquations(s));

    return this.nodes
      .filter((s) => s.support?.type !== "fixed")
      .map((s) => this.slopeDeflection.updatedGetEquations(s));
  }

  /** Solve for final moments at supports */
  // getFinalMoments() {
  //   const supportMoments = this.getSupportMoments();
  //   const equations = this.getEquations();
  //   const simulEqnSoln = this.equation.solveEquations(equations);

  //   const momentValues = supportMoments.map((supportEqn, index) => {
  //     // console.log(supportEqn.left, supportEqn.right);

  //     const leftMoment = Object.fromEntries(
  //       supportEqn.left.map((term) => [term.name, term.coefficient])
  //     );
  //     const rightMoment = Object.fromEntries(
  //       supportEqn.right.map((term) => [term.name, term.coefficient])
  //     );

  //     const leftMomentValue = Object.entries(leftMoment).reduce(
  //       (acc, [key, coeff]) => {
  //         const value = simulEqnSoln[key] || 1;
  //         return acc + coeff * value;
  //       },
  //       0
  //     );

  //     const rightMomentValue = Object.entries(rightMoment).reduce(
  //       (acc, [key, coeff]) => {
  //         const value = simulEqnSoln[key] || 1;
  //         return acc + coeff * value;
  //       },
  //       0
  //     );

  //     // assign the left and right moments for each supports here
  //     const supports = this.getSupports();
  //     const support = supports[index];
  //     if (support) {
  //       support.leftMoment = leftMomentValue;
  //       support.rightMoment = rightMomentValue;
  //     }

  //     console.log({
  //       leftMoment: leftMomentValue,
  //       rightMoment: rightMomentValue,
  //     });
  //     return { leftMoment: leftMomentValue, rightMoment: rightMomentValue };
  //   });

  //   return momentValues;
  // }

  updatedGetFinalMoments() {
    const supportMoments = this.updatedGetSupportMoments();
    const equations = this.updatedGetEquations();
    const simulEqnSoln = this.equation.solveEquations(equations);

    const momentValues = supportMoments.map((supportEqn, index) => {
      // const leftMoment = Object.values(
      // Object.values(supportEqn.clk).map((term) => [term.name, term.coefficient])

      // );

      const leftMoment = Object.fromEntries(
        Object.values(supportEqn.clk)
          .flat()
          .map((term) => [term.name, term.coefficient])
      );

      const rightMoment = Object.fromEntries(
        Object.values(supportEqn.antiClk)
          .flat()
          .map((term) => [term.name, term.coefficient])
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

      // console.log({
      //   leftMoment: leftMomentValue,
      //   rightMoment: rightMomentValue,
      // });
      return { leftMoment: leftMomentValue, rightMoment: rightMomentValue };
    });

    return momentValues;
  }

  // solveReactions(beam: Beam) {
  //   const loads = beam.getEquivalentPointLoads();
  //   const L = beam.length;
  //   const leftSupport = beam.startNode.support || null;
  //   const rightSupport = beam.endNode.support || null;
  //   const leftMoment = leftSupport.rightMoment ?? 0;
  //   const rightMoment = rightSupport.leftMoment ?? 0;

  //   if (leftSupport && rightSupport) {
  //     const refPos = leftSupport.x;

  //     const loadMoments = loads.reduce((acc: number, curr: PointLoad) => {
  //       const distance = curr.position - refPos;
  //       const moment = curr.magnitude * distance;

  //       return acc + moment;
  //     }, 0);

  //     const rightReaction = (loadMoments - leftMoment - rightMoment) / L;

  //     const totalLoads = loads.reduce((acc: number, curr: PointLoad) => {
  //       return acc + curr.magnitude;
  //     }, 0);

  //     const leftReaction = totalLoads - rightReaction;

  //     return { leftReaction, rightReaction };
  //   } else {
  //     // when we are haveing overhanging write the logic here
  //   }
  // }

  // Get the reaction for a single support

  updatedSolveReactions(member: Beam | Column | InclinedMember) {
    const loads = member.getEquivalentPointLoads();
    const L = member.length;
    const startNode = member.startNode;
    const endNode = member.endNode;
    const leftMoment = startNode.support?.rightMoment ?? 0;
    const rightMoment = endNode.support?.leftMoment ?? 0;
    // const leftSupport = member.startNode.support || null;
    // const rightSupport = member.endNode.support || null;
    // const leftMoment = leftSupport?.rightMoment ?? 0;
    // const rightMoment = rightSupport?.leftMoment ?? 0;

    if (startNode.support && endNode.support) {
      const refPos = startNode.x;

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

  // getSupportReactions() {
  //   const supports = this.getSupports();

  //   const result: Record<string, number> = {};

  //   supports
  //     .filter(
  //       (support): support is PinnedSupport | RollerSupport | FixedSupport =>
  //         support !== null
  //     )
  //     .forEach((support) => {
  //       // LEFT

  //       const leftReaction = support.leftBeam
  //         ? this.solveReactions(support.leftBeam)?.rightReaction ?? 0
  //         : 0;

  //       // RIGHT

  //       const rightReaction = support.rightBeam
  //         ? this.solveReactions(support.rightBeam)?.leftReaction ?? 0
  //         : 0;

  //       result[`SUPPORT${support.id}`] = leftReaction + rightReaction;
  //     });
  //   return result;
  // }

  updatedGetSupportReactions() {
    // const supports = this.getSupports();
    const nodes = this.nodes;

    const result: Record<string, number> = {};

    nodes
      .filter((node): node is Node => node.support !== null)
      .forEach((node) => {
        // LEFT
        let reaction = 0;

        for (const member of node.connectedMembers) {
          if (!member.isStart) {
            const result =
              this.updatedSolveReactions(member.member)?.rightReaction ?? 0;
            reaction += result;
          } else {
            const result =
              this.updatedSolveReactions(member.member)?.leftReaction ?? 0;
            reaction += result;
          }
        }

        result[`SUPPORT${node.support?.id}`] = reaction;
      });
    return result;
  }
}

const output = new BeamSolver([AB, BC]);
console.log(output.updatedGetFinalMoments());

console.log(output.updatedGetSupportReactions());
