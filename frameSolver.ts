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

  private computeBeamReactions(member: Beam) {
    const loads = member.getEquivalentPointLoads();
    const L = member.length;
    const moments = this.updatedGetFinalMoments();

    const Mstart =
      moments[`MOMENT${member.startNode.id}${member.endNode.id}`] ?? 0;
    const Mend =
      moments[`MOMENT${member.endNode.id}${member.startNode.id}`] ?? 0;

    // Standard beam vertical reaction (Shear) formula
    const loadMoments = loads.reduce((sum, load) => {
      const d = Math.abs(load.position - member.startNode.x);
      return sum + load.magnitude * d;
    }, 0);

    const RyEnd = (loadMoments - Mend - Mstart) / L;
    const totalLoad = loads.reduce((s, l) => s + l.magnitude, 0);
    const RyStart = totalLoad - RyEnd;

    return { RxStart: 0, RxEnd: 0, RyStart, RyEnd };
  }

  private computeColumnReactions(member: Column) {
    const loads = member.getEquivalentPointLoads();
    const L = member.length;
    const moments = this.updatedGetFinalMoments();

    const Mstart =
      moments[`MOMENT${member.startNode.id}${member.endNode.id}`] ?? 0;
    const Mend =
      moments[`MOMENT${member.endNode.id}${member.startNode.id}`] ?? 0;

    // Standard column horizontal reaction (Shear) formula
    const loadMoments = loads.reduce((sum, load) => {
      const d = Math.abs(load.position - member.startNode.y);
      return sum + load.magnitude * d;
    }, 0);

    const RxEnd = (loadMoments - Mend - Mstart) / L;
    const totalLoad = loads.reduce((s, l) => s + l.magnitude, 0);
    const RxStart = totalLoad - RxEnd;

    return { RxStart, RxEnd, RyStart: 0, RyEnd: 0 };
  }

  private applyMemberReactions(member: any, reactions: any) {
    member.startNode.xReaction += reactions.RxStart;
    member.endNode.xReaction += reactions.RxEnd;
    member.startNode.yReaction += reactions.RyStart;
    member.endNode.yReaction += reactions.RyEnd;
  }

  updatedSolveReactions() {
    // 1. Reset all nodes
    this.nodes.forEach((n) => {
      n.xReaction = 0;
      n.yReaction = 0;
    });

    // 2. Calculate Local Shears (Member-level reactions)
    for (const member of this.members) {
      let reactions;
      if (member instanceof Beam) {
        reactions = this.computeBeamReactions(member);
      } else if (member instanceof Column) {
        reactions = this.computeColumnReactions(member);
      } else {
        throw new Error("Unknown member type");
      }
      this.applyMemberReactions(member, reactions);
    }

    // 3. Snapshot Local Shears into the final results map
    // This ensures Node C starts with its correct local shear (~21.19)
    const results = new Map<string, { xReaction: number; yReaction: number }>();
    this.nodes.forEach((node) => {
      results.set(node.id, {
        xReaction: node.xReaction,
        yReaction: node.yReaction,
      });
    });

    // 4. AXIAL TRANSFER PASS
    // We sort nodes by X to ensure horizontal forces flow from Left to Right (A/C -> D -> E)
    const sortedNodes = [...this.nodes].sort((a, b) => a.x - b.x);

    for (const node of sortedNodes) {
      if (!node.support) {
        // --- VERTICAL TRANSFER (Joint -> Column -> Support) ---
        // If Node C or D has a vertical shear (from a beam), push it down the column
        if (Math.abs(node.yReaction) > 0.001) {
          const colConn = node.connectedMembers.find(
            (m) => m.member instanceof Column
          );
          if (colConn) {
            const targetNode = colConn.isStart
              ? colConn.member.endNode
              : colConn.member.startNode;
            const res = results.get(targetNode.id);
            if (res) res.yReaction += node.yReaction;
          }
        }

        // --- HORIZONTAL TRANSFER (Joint -> Beam -> Next Joint/Support) ---
        // If Node C or D has a horizontal shear (from a column), push it to the RIGHT
        if (Math.abs(node.xReaction) > 0.001) {
          // Look for a beam that connects to a node further to the right (higher X)
          const beamToRight = node.connectedMembers.find((m) => {
            const other = m.isStart ? m.member.endNode : m.member.startNode;
            return m.member instanceof Beam && other.x > node.x;
          });

          if (beamToRight) {
            const targetNode = beamToRight.isStart
              ? beamToRight.member.endNode
              : beamToRight.member.startNode;
            // IMPORTANT: We update the "node.xReaction" of the target so it can be
            // pushed further in the next iteration of the loop, AND update the result map.
            targetNode.xReaction += node.xReaction;

            const res = results.get(targetNode.id);
            if (res) res.xReaction = targetNode.xReaction;
          }
        }
      }
    }

    return results;
  }

  // updatedSolveReactions(member: Beam | Column | InclinedMember) {
  //   const loads = member.getEquivalentPointLoads();
  //   const L = member.length;
  //   const startNode = member.startNode;
  //   const endNode = member.endNode;
  //   const moments = this.updatedGetFinalMoments();
  //   const startMoment = moments[`MOMENT${startNode.id}${endNode.id}`];
  //   const endMoment = moments[`MOMENT${endNode.id}${startNode.id}`];

  //   // sum of moments
  //   if (member instanceof Column) {
  //     const loadMoments = loads.reduce((prev: number, curr: PointLoad) => {
  //       const distance = Math.abs(curr.position - startNode.y);
  //       return prev + curr.magnitude * distance;
  //     }, 0);

  //     const endReaction = (loadMoments - endMoment - startMoment) / L;
  //     member.endReactions.RxEnd = endReaction;
  //     // console.log(
  //     //   `MEMBER${member.startNode.id}${member.endNode.id}`,
  //     //   endNode.xReaction
  //     // );
  //     endNode.xReaction += endReaction;

  //     const sumOfLoads = loads.reduce(
  //       (prev: number, curr: PointLoad) => prev + curr.magnitude,
  //       0
  //     );
  //     const startReaction = sumOfLoads - endReaction;
  //     member.endReactions.RxStart = startReaction;
  //     startNode.xReaction += startReaction;

  //     // console.log(startReaction, endReaction);
  //     return { startReaction, endReaction };
  //   } else if (member instanceof Beam) {
  //     // console.log(
  //     //   `MEMBER${member.startNode.id}${member.endNode.id}`,
  //     //   startNode.xReaction
  //     // );
  //     member.endReactions.RxStart += -startNode.xReaction;
  //     member.endReactions.RxEnd += -member.endReactions.RxStart;
  //     endNode.xReaction += -member.endReactions.RxEnd;

  //     const loadMoments = loads.reduce((prev: number, curr: PointLoad) => {
  //       const distance = Math.abs(curr.position - startNode.x);
  //       return prev + curr.magnitude * distance;
  //     }, 0);

  //     const endReaction = (loadMoments - endMoment - startMoment) / L;
  //     member.endReactions.RyEnd = endReaction;
  //     endNode.yReaction += endReaction;

  //     const sumOfLoads = loads.reduce(
  //       (prev: number, curr: PointLoad) => prev + curr.magnitude,
  //       0
  //     );
  //     const startReaction = sumOfLoads - endReaction;
  //     member.endReactions.RyStart = startReaction;
  //     startNode.yReaction += startReaction;

  //     // console.log(startReaction, endReaction);
  //     return { startReaction, endReaction };
  //   }
  // }
}

const output = new FrameSolver([AC, CD, DE, BD]);
// output.isSideSway();

output.updatedGetFinalMoments();
// console.log(output.updatedGetFinalMoments());
console.log(output.updatedSolveReactions());

// console.log("NODE_A: ", nodeA.yReaction, nodeA.xReaction);
// console.log("NODE_C: ", nodeC.yReaction, nodeC.xReaction);
// console.log("NODE_D: ", nodeD.yReaction, nodeD.xReaction);
// console.log("NODE_B: ", nodeB.yReaction, nodeB.xReaction);
// console.log("NODE_E: ", nodeE.yReaction, nodeE.xReaction);

// console.log(output.updatedGetSupportReactions());
