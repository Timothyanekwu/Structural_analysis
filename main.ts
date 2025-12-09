// main.ts
import { Beam } from "./elements/beam";
import {
  PinnedSupport,
  RollerSupport,
  FixedSupport,
  Support,
} from "./elements/support";
import { PointLoad, UDL, VDL } from "./elements/load";
import { FixedEndMoments } from "./logic/FEMs";
import { SlopeDeflection } from "./logic/slopeDeflectionEqn";
import { Equation } from "./logic/simultaneousEqn";

/*

// Add supports
beam.addSupport(new Support(0, "roller"));
beam.addSupport(new Support(8, "roller"));

// Add loads
beam.addLoad(new PointLoad(2, 1000));
beam.addLoad(new PointLoad(6, 800));
beam.addLoad(new UDL(2, 4, 200)); // 20 kN @ 4 m

// Solve for reactions
const { RA, RB } = beam.solveReactions();

console.log("=== Simply Supported Beam Analysis ===");
console.log(`RA (Left Support): ${RA.toFixed(2)} kN`);
console.log(`RB (Right Support): ${RB.toFixed(2)} kN`);

*/

// const fem = new FixedEndMoments();

// const slopeDeflection = new SlopeDeflection();
// const equation = new Equation();

// FIRST SPAN
const support1 = new FixedSupport(0);
const support2 = new RollerSupport(18, 0, support1);
const AB = new Beam(
  support2.prev?.position || 0,
  support2.position - support1.position,
  [support1, support2]
);

const load1 = new VDL(3, 18, 0, 0);
AB.addLoad(load1);

support1.rightBeam = AB;
support2.leftBeam = AB;

// SECOND SPAN
const support3 = new RollerSupport(36, 0, support2);
const BC = new Beam(
  support3.prev?.position || 0,
  support3.position - support2.position,
  [support2, support3]
);

const load2 = new UDL(18, 18, 3);
BC.addLoad(load2);

support2.rightBeam = BC;
support3.leftBeam = BC;

// THIRD SPAN
const support4 = new FixedSupport(54, 0, support3);
const CD = new Beam(
  support4.prev?.position || 0,
  support3.position - support2.position,
  [support3, support4]
);
const load3 = new VDL(3, 36, 0, 54);
CD.addLoad(load3);

support3.rightBeam = CD;
support4.leftBeam = CD;

// This is to get the combined left and right equations of each support
// const equations = [
//   // slopeDeflection.getEquations(support1),
//   slopeDeflection.getEquations(support2),
//   slopeDeflection.getEquations(support3),
//   // slopeDeflection.getEquations(support4),
// ];

// // this is to contain the left and right moments of each support

// const supportMoments = [
//   slopeDeflection.supportEquations(support1),
//   slopeDeflection.supportEquations(support2),
//   slopeDeflection.supportEquations(support3),
//   slopeDeflection.supportEquations(support4),
// ];

// const simulEqnSoln = equation.solveEquations(equations);

class Output {
  beams: Beam[];
  FEM: FixedEndMoments;
  slopeDeflection: SlopeDeflection;
  equation: Equation;

  constructor(beams: Beam[] = []) {
    this.beams = beams;
    this.slopeDeflection = new SlopeDeflection();
    this.equation = new Equation();
    this.FEM = new FixedEndMoments();
  }

  getSupports() {
    const supports = this.beams.flatMap((beam) => beam.supports);
    return Array.from(new Set(supports));
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

  getEquations() {
    const supports = this.getSupports();

    const equations = supports
      .filter(
        (support): support is PinnedSupport | RollerSupport =>
          support !== null && support.type !== "fixed"
      )
      .map((support) => this.slopeDeflection.getEquations(support));

    return equations;
  }

  getFEMs() {
    const firstSupport = this.beams[0].supports[0] ?? this.beams[0].supports[1];

    if (!firstSupport) {
      console.warn("No valid support found.");
      return [];
    }

    const allFEMs = this.FEM.getAllFEMs(firstSupport);

    return allFEMs;
  }

  getFinalMoments() {
    const supportMoments = this.getSupportMoments();
    const equations = this.getEquations();
    const simulEqnSoln = this.equation.solveEquations(equations);

    const momentValues = supportMoments.map((supportEqn) => {
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

      return { leftMoment: leftMomentValue, rightMoment: rightMomentValue };
    });

    return momentValues;
  }
}

const output = new Output([AB, BC, CD]);

console.log("<=== Analysis Output ===>");
console.log("<-- Fixed End Moments -->");
console.log(output.getFEMs());
console.log(" ");
console.log("<-- Support Equations -->");
console.log(output.getEquations());
console.log(" ");
console.log("<-- Final Support Moments -->");
console.log(output.getFinalMoments());

// console.log("Support Moments:");
// momentValues.forEach((moment, index) => {
//   console.log(
//     `Support ${index + 1}: M_L = ${moment.leftMoment.toFixed(
//       2
//     )} kNm, M_R = ${moment.rightMoment.toFixed(2)} kNm`
//   );
// });
