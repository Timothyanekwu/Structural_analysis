// main.ts
import { Beam } from "./elements/beam";
import { PinnedSupport, RollerSupport, FixedSupport } from "./elements/support";
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

const fem = new FixedEndMoments();
const slopeDeflection = new SlopeDeflection();
const equation = new Equation();

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
  support4.position - support3.position,
  [support3, support4]
);
const load3 = new VDL(3, 36, 0, 54);
CD.addLoad(load3);

support3.rightBeam = CD;
support4.leftBeam = CD;

const equations = [
  // slopeDeflection.getEquations(support1),
  slopeDeflection.getEquations(support2),
  slopeDeflection.getEquations(support3),
  // slopeDeflection.getEquations(support4),
];

// console.log(equations);

console.log(equation.solveEquations(equations));
// equation.solveEquations(equations);
