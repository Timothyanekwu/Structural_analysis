import {
  FixedSupport,
  PinnedSupport,
  RollerSupport,
  Support,
} from "../elements/support";
import { FixedEndMoments } from "./FEMs";
import { Beam } from "../elements/beam";

class StaticVariable {
  name: string;
  coefficient: number;

  constructor(name: string, coefficient: number) {
    this.name = name;
    this.coefficient = coefficient;
  }
}

// const a = {
//   EItetaA: 4 / 5,
//   EItetaB: 6 / 5,
//   EIsettlement: 0,
// };

export class SlopeDeflection {
  // span: number;

  // constructor(support: Support, beam: Beam) {
  //   this.support = support;
  //   this.beam = beam;
  // }

  collectLikeTerms = (terms: StaticVariable[]) => {
    let result: { [key: string]: number } = {};

    for (let i = 0; i < terms.length; i++) {
      if (terms[i].name in result) {
        result[terms[i].name] += terms[i].coefficient;
      } else {
        if (terms[i].coefficient === 0) continue;
        result[terms[i].name] = terms[i].coefficient;
      }
    }

    return result;
  };

  getEquations(support: Support, beam: Beam, E = 1, I = 1) {
    /// E and I in the parameter is the value of its coefficient in the slope deflection equation
    if (support.position > beam.length || support.position < 0) {
      throw Error(
        "The support is not in the system. This means that the support is nowhere in the span of the beam "
      );
    }

    // const E = new StaticVariable("E", 1);
    // const I = new StaticVariable("I", 1);

    // Equation for the right side of the support
    // let right: { [key: string]: number } = {};
    let right: StaticVariable[] | null = [];

    // Equation for the left side of the same support
    // let left: { [key: string]: number } = {};
    let left: StaticVariable[] | null = [];

    if (!support.prev) {
      // we will deal with the right side of the support
      // because the support is at the left end of the beanm
      console.log("Right");
    } else if (!support.next) {
      // we will deal with the left side of the support
      // because the support is at the right end of the beam
      console.log("Left");
    } else {
      // we will deal with interior supports
      const curr = support;
      const next = support.next;
      const prev = support.prev;
      const rightSpan = next.position - curr.position;
      const leftSpan = curr.position - prev.position;

      // right[`EIteta${curr.id}`] = 4 / L;
      // right[`EIteta${next.id}`] = 2 / L;
      // right[`EIdeta`] = -1 * (6 / L ** 2);

      // left[`EIteta${curr.id}`] = 4 / L;
      // left[`EIteta${prev.id}`] = 2 / L;
      // left[`EIdeta`] = -1 * (6 / L ** 2);

      right = [
        new StaticVariable(`EIteta${curr.id}`, 4 / rightSpan),
        new StaticVariable(
          `EIteta${next.id}`,
          next.type === "fixed" ? 0 : 2 / rightSpan
        ),
        new StaticVariable(
          "EIdeta",
          !curr.settlement || curr.settlement === 0
            ? 0
            : -1 * (6 / rightSpan ** 2) * curr.settlement
        ),
      ];

      left = [
        new StaticVariable(`EIteta${curr.id}`, 4 / leftSpan),
        new StaticVariable(
          `EIteta${prev.id}`,
          prev.type === "fixed" ? 0 : 2 / leftSpan
        ),
        new StaticVariable(
          "EIdeta",
          !curr.settlement || curr.settlement === 0
            ? 0
            : -1 * (6 / rightSpan ** 2) * curr.settlement
        ),
      ];
    }

    console.log("RIGHT: ", right);
    console.log("LEFT: ", left);

    const supportEqn = right.concat(left);
    console.log("SUPPORT EQN: ", supportEqn);

    const generalEquation = this.collectLikeTerms(supportEqn);
    return generalEquation;
  }
}
