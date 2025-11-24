// main.ts
import { Beam } from "./elements/beam";
import { PinnedSupport, RollerSupport, FixedSupport } from "./elements/support";
import { PointLoad, UDL, VDL } from "./elements/load";
import { FixedEndMoments } from "./logic/FEMs";
import { SlopeDeflection } from "./logic/slopeDeflectionEqn";

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

// FIRST SPAN
const support1 = new FixedSupport(0);
const support2 = new PinnedSupport(5, 0, support1);
const AB = new Beam(
  support2.prev?.position || 0,
  support2.position - support1.position,
  [support1, support2]
);
support1.rightBeam = AB;
support2.leftBeam = AB;

const load1 = new PointLoad(20, 18);

// SECOND SPAN
const support3 = new PinnedSupport(11, 0, support2);
const BC = new Beam(
  support3.prev?.position || 0,
  support3.position - support2.position,
  [support2, support3],
  3
);
support2.rightBeam = BC;
support3.leftBeam = BC;

const load2 = new PointLoad(2.5, 8);

// THIRD SPAN
// const support4 = new PinnedSupport(14, 0, support3);
// const CD = new Beam(
//   support4.prev?.position || 0,
//   support4.position - support3.position,
//   [support3, support4]
// );
// const load3 = new UDL(0, 5, 2);

// const load4 = new VDL(3, 0, 0, 18);

// console.log("LEFT FEM: ", fem.getFixedEndMoment([load2, load3], 5, support1));
// console.log("RIGHT FEM: ", fem.getFixedEndMoment([load2, load3], 5, support2));

console.log(slopeDeflection.getEquations(support2));
