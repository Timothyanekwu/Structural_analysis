// main.ts
import { Beam } from "./elements/beam";
import { PinnedSupport, RollerSupport, FixedSupport } from "./elements/support";
import { PointLoad, UDL, VDL } from "./elements/load";
import { FixedEndMoments } from "./logic/FEMs";
import { SlopeDeflection } from "./logic/slopeDeflectionEqn";

const beam = new Beam(14);

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

// const load1 = new PointLoad(20, 18);
const load2 = new PointLoad(2.5, 8);
const load3 = new UDL(0, 5, 2);
// const load3 = new VDL(3, 0, 0, 18);

const support1 = new FixedSupport(0);
const support2 = new RollerSupport(4, 0, support1);
const support3 = new RollerSupport(8, 0, support2);
const support4 = new PinnedSupport(14, 0, support3);

// console.log("LEFT FEM: ", fem.getFixedEndMoment([load2, load3], 5, support1));
// console.log("RIGHT FEM: ", fem.getFixedEndMoment([load2, load3], 5, support2));

console.log(slopeDeflection.getEquations(support2, beam));
