// output.ts

import { Beam, Column, InclinedMember } from "./elements/member";
import { FixedSupport, PinnedSupport, RollerSupport } from "./elements/support";
import { FixedEndMoments } from "./logic/FEMs";
import { SlopeDeflection } from "./logic/slopeDeflectionEqn";
import { Equation } from "./logic/simultaneousEqn";
import { PointLoad, UDL, VDL } from "./elements/load";
import { Node } from "./elements/node";

// --- CREATE SUPPORTS ---
const supportA = new FixedSupport(0, 0);
const supportB = new FixedSupport(30, 0);
const supportE = new PinnedSupport(60, 20);

// --- CREATE NODES ---
const nodeA = new Node("A", supportA.x, supportA.y, supportA);
const nodeB = new Node("B", supportB.x, supportA.y, supportB);
const nodeC = new Node("C", supportA.x, 20);
const nodeD = new Node("D", supportB.x, 20);
const nodeE = new Node("E", supportE.x, supportE.y, supportE);

// --- CREATE BEAMS ---
const AC = new Column(nodeA, nodeC);
const BD = new Column(nodeB, nodeD);
const CD = new Beam(nodeC, nodeD, 1, 2);
const DE = new Beam(nodeD, nodeE, 1, 2);

// --- ADD LOADS ---
AC.addLoad(new PointLoad(10, 40));
CD.addLoad(new UDL(0, 30, 2));
DE.addLoad(new UDL(30, 30, 2));

// --- LINK BEAMS TO SUPPORTS ---

export class FrameSolver {
  members: (Beam | Column | InclinedMember)[];
  FEM: FixedEndMoments;
  slopeDeflection: SlopeDeflection;
  equation: Equation;

  constructor(members: (Beam | Column | InclinedMember)[] = []) {
    this.members = members;
    this.FEM = new FixedEndMoments();
    this.slopeDeflection = new SlopeDeflection();
    this.equation = new Equation();
  }

  get nodes(): Node[] {
    return [...new Set(this.members.flatMap((b) => [b.startNode, b.endNode]))];
  }

  get supports(): (PinnedSupport | RollerSupport | FixedSupport)[] {
    return this.nodes
      .map((node) => node.support)
      .filter(
        (support): support is PinnedSupport | RollerSupport | FixedSupport =>
          support !== undefined
      );
  }

  isSideSway(): boolean {
    const j = this.nodes.length;
    const f = this.supports.filter(
      (support): support is FixedSupport => support !== undefined
    ).length;
    const h = this.supports.filter(
      (support): support is PinnedSupport => support !== undefined
    ).length;
    const r = this.supports.filter(
      (support): support is RollerSupport => support !== undefined
    ).length;
    const m = this.members.length;

    const ss = 2 * j - (2 * (f + h) + r + m);

    if (ss == 0) return true;
    return false;
  }

  updatedGetSupportMoments() {
    return this.nodes.map((node) => {
      const a = this.slopeDeflection.updatedSupportEquation(node);

      return a;
    });
  }

  updatedGetEquations() {
    // const supports = this.getSupports();
    // return supports
    //   .filter((s) => s.type !== "fixed")
    //   .map((s) => this.slopeDeflection.updatedGetEquations(s));

    return this.nodes
      .filter((s) => s.support?.type !== "fixed")
      .map((s) => this.slopeDeflection.updatedGetEquations(s));
  }

  updatedGetFinalMoments() {
    const supportMoments = this.updatedGetSupportMoments();
    const equations = this.updatedGetEquations();
    const simulEqnSoln = this.equation.solveEquations(equations);
    // console.dir(supportMoments, { depth: Infinity });

    const result = supportMoments.reduce((acc, eqn) => {
      const clk = Object.fromEntries(
        Object.entries(eqn.clk).map(([momentKey, terms]) => {
          const sum = terms.reduce((a, { name, coefficient }) => {
            const value = simulEqnSoln[name] ?? 1;
            return a + coefficient * value;
          }, 0);

          return [momentKey, sum];
        })
      );

      const antiClk = Object.fromEntries(
        Object.entries(eqn.antiClk).map(([momentKey, terms]) => {
          const sum = terms.reduce((a, { name, coefficient }) => {
            const value = simulEqnSoln[name] ?? 1;
            return a + coefficient * value;
          }, 0);

          return [momentKey, sum];
        })
      );

      // merge into accumulator
      Object.entries({ ...clk, ...antiClk }).forEach(([key, value]) => {
        acc[key] = (acc[key] ?? 0) + value;
      });

      return acc;
    }, {} as Record<string, number>);

    return result;
  }

  // updatedSolveReactions(member: Beam | Column | InclinedMember) {
  //   const loads = member.getEquivalentPointLoads();
  //   const L = member.length;
  //   const startNode = member.startNode;
  //   const endNode = member.endNode;
  //   const leftMoment = startNode.support?.rightMoment ?? 0;
  //   const rightMoment = endNode.support?.leftMoment ?? 0;
  //   // const leftSupport = member.startNode.support || null;
  //   // const rightSupport = member.endNode.support || null;
  //   // const leftMoment = leftSupport?.rightMoment ?? 0;
  //   // const rightMoment = rightSupport?.leftMoment ?? 0;

  //   if (startNode.support && endNode.support) {
  //     const refPos = startNode.x;

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

  // updatedGetSupportReactions() {
  //   // const supports = this.getSupports();
  //   const nodes = this.nodes;

  //   const result: Record<string, number> = {};

  //   nodes
  //     .filter((node): node is Node => node.support !== null)
  //     .forEach((node) => {
  //       // LEFT
  //       let reaction = 0;

  //       for (const member of node.connectedMembers) {
  //         if (!member.isStart) {
  //           const result =
  //             this.updatedSolveReactions(member.member)?.rightReaction ?? 0;
  //           reaction += result;
  //         } else {
  //           const result =
  //             this.updatedSolveReactions(member.member)?.leftReaction ?? 0;
  //           reaction += result;
  //         }
  //       }

  //       result[`SUPPORT${node.support?.id}`] = reaction;
  //     });
  //   return result;
  // }
}

const output = new FrameSolver([AC, CD, DE, BD]);
// output.isSideSway();

// output.updatedGetFinalMoments();
console.log(output.updatedGetFinalMoments());
// console.log(output.updatedGetSupportReactions());
