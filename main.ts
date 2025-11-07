// main.ts
import { Beam } from "./elements/beam";
import { Support } from "./elements/support";
import { Load } from "./elements/load";

const beam = new Beam(6); // 6 m beam

// Add supports
beam.addSupport(new Support(0, "roller"));
beam.addSupport(new Support(6, "roller"));

// Add loads
beam.addLoad(new Load(2, 10)); // 10 kN @ 2 m
beam.addLoad(new Load(4, 20)); // 20 kN @ 4 m

// Solve for reactions
const { RA, RB } = beam.solveReactions();

// console.log("=== Simply Supported Beam Analysis ===");
// console.log(`RA (Left Support): ${RA.toFixed(2)} kN`);
// console.log(`RB (Right Support): ${RB.toFixed(2)} kN`);
