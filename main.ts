// main.ts
import { Beam } from "./elements/beam";
import { Support } from "./elements/support";
import { PointLoad, UDL, VDL } from "./elements/load";
import { FixedEndMoments } from "./logic/FEMs";

/*
const beam = new Beam(6);

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

const load1 = new PointLoad(10, 18);
const load2 = new UDL(0, 4, 20);
const load3 = new VDL(3, 0, 0, 18);

const support1 = new Support(0, "fixed");
const support2 = new Support(18, "pinned");

console.log(fem.getFixedEndMoment([load2], 4, support2));
// console.log(fem.getFixedEndMoment([load2], 8, support2));
