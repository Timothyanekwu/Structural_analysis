// main.ts
import { Beam } from "./elements/beam";
import { Support } from "./elements/support";
import { PointLoad } from "./elements/load";

const beam = new Beam(17); // 6 m beam

// Add supports
beam.addSupport(new Support(0, "roller"));
beam.addSupport(new Support(17, "roller"));

// Add loads
beam.addLoad(new PointLoad(5, 20)); // 10 kN @ 2 m
beam.addLoad(new PointLoad(12, 10)); // 20 kN @ 4 m

// Solve for reactions
const { RA, RB } = beam.solveReactions();

console.log("=== Simply Supported Beam Analysis ===");
console.log(`RA (Left Support): ${RA.toFixed(2)} kN`);
console.log(`RB (Right Support): ${RB.toFixed(2)} kN`);
