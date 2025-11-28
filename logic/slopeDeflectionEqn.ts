import {
  FixedSupport,
  PinnedSupport,
  RollerSupport,
  Support,
} from "../elements/support";
import { FixedEndMoments } from "./FEMs";
import { Beam } from "../elements/beam";
import { UDL, VDL, PointLoad } from "../elements/load";
import { Moment } from "./moment";

export class StaticVariable {
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

  getEquations(support: FixedSupport | PinnedSupport | RollerSupport) {
    /// E and I in the parameter is the value of its coefficient in the slope deflection equation
    const El = support.leftBeam?.Ecoef || 0;
    const Il = support.leftBeam?.Icoef || 0;

    const Er = support.rightBeam?.Ecoef || 0;
    const Ir = support.rightBeam?.Icoef || 0;

    const fem = new FixedEndMoments();
    const moment = new Moment();

    // Equation for the right side of the support
    // let right: { [key: string]: number } = {};
    let right: StaticVariable[] | null = [];

    // Equation for the left side of the same support
    // let left: { [key: string]: number } = {};
    let left: StaticVariable[] | null = [];

    if (!support.prev) {
      // < --- RIGHT SIDE OF SUPPORT --- >
      // we will deal with respect to the right beam of the support
      // because the support is at the left end of the beanm

      const curr = support;
      const next = support.next;
      if (!next || !curr.rightBeam) {
        throw Error(
          "Invalid Model: The system should contain at least one Beam and support"
        );
      }
      const rightSpan = next
        ? next.position - curr.position
        : curr.rightBeam?.length;

      const FEMToRight = fem.getFixedEndMoment(
        support.rightBeam?.loads || [],
        rightSpan,
        "left",
        support
      ); // get the FEM wrt the right beam therefore the support is at the left of the beam
      const momentToLeft = moment.getMoment(
        curr.position,
        curr.leftBeam?.getEquivalentPointLoads() ?? []
      );

      left = curr.leftBeam
        ? [
            new StaticVariable("c", momentToLeft || 0),
            new StaticVariable(
              `EIteta${curr.id}`,
              curr.type === "fixed" ? 0 : (4 / curr.leftBeam.length) * (Er * Ir)
            ),

            new StaticVariable(
              "EIdeta",
              !curr.settlement || curr.settlement === 0
                ? 0
                : -1 *
                  (6 / curr.leftBeam.length ** 2) *
                  curr.settlement *
                  (Er * Ir)
            ),
          ]
        : [];

      right = [
        new StaticVariable("c", FEMToRight || 0),
        new StaticVariable(
          `EIteta${curr.id}`,
          curr.type === "fixed" ? 0 : (4 / rightSpan) * (Er * Ir)
        ),
        new StaticVariable(
          `EIteta${next.id}`,
          next.type === "fixed" ? 0 : (2 / rightSpan) * (Er * Ir)
        ),
        new StaticVariable(
          "EIdeta",
          !curr.settlement || curr.settlement === 0
            ? 0
            : -1 * (6 / rightSpan ** 2) * curr.settlement * (Er * Ir)
        ),
      ];
    } else if (!support.next) {
      // we will deal with respect to the left beam of the support
      // because the support is at the right end of the beam

      const curr = support;
      const prev = support.prev;
      const leftSpan = curr.position - prev.position;
      const FEMToLeft = fem.getFixedEndMoment(
        support.leftBeam?.loads || [],
        leftSpan,
        "right",
        support.prev
      ); // get the FEM wrt the left beam therefore the support is at the right of the beam
      const momentToRight = moment.getMoment(
        curr.position,
        curr.rightBeam?.getEquivalentPointLoads() ?? []
      );

      left = [
        new StaticVariable("c", FEMToLeft || 0),
        new StaticVariable(
          `EIteta${curr.id}`,
          curr.type === "fixed" ? 0 : (4 / leftSpan) * (El * Il)
        ),
        new StaticVariable(
          `EIteta${prev.id}`,
          prev.type === "fixed" ? 0 : (2 / leftSpan) * (El * Il)
        ),
        new StaticVariable(
          "EIdeta",
          !curr.settlement || curr.settlement === 0
            ? 0
            : -1 * (6 / leftSpan ** 2) * curr.settlement * (El * Il)
        ),
      ];

      right = curr.rightBeam
        ? [
            new StaticVariable("c", momentToRight || 0),
            new StaticVariable(
              `EIteta${curr.id}`,
              curr.type === "fixed"
                ? 0
                : (4 / curr.rightBeam.length) * (Er * Ir)
            ),

            new StaticVariable(
              "EIdeta",
              !curr.settlement || curr.settlement === 0
                ? 0
                : -1 *
                  (6 / curr.rightBeam.length ** 2) *
                  curr.settlement *
                  (Er * Ir)
            ),
          ]
        : [];
    } else {
      // we will deal with interior supports
      const curr = support;
      const next = support.next;
      const prev = support.prev;
      const rightSpan = next.position - curr.position;
      const leftSpan = curr.position - prev.position;
      const FEMToLeft = fem.getFixedEndMoment(
        support.leftBeam?.loads || [],
        leftSpan,
        "right",
        support.prev
      ); // get the FEM wrt the left beam therefore the support is at the right of the beam

      const FEMToRight = fem.getFixedEndMoment(
        support.rightBeam?.loads || [],
        rightSpan,
        "left",
        support
      ); // get the FEM wrt the right beam therefore the support is at the left of the beam

      const signConvention = curr.next
        ? curr.settlement < curr.next.settlement
          ? -1
          : 1
        : 1;
      right = [
        new StaticVariable("c", FEMToRight || 0),
        new StaticVariable(`EIteta${curr.id}`, (4 / rightSpan) * (Er * Ir)),
        new StaticVariable(
          `EIteta${next.id}`,
          next.type === "fixed" ? 0 : (2 / rightSpan) * (Er * Ir)
        ),
        new StaticVariable(
          "EIdeta",
          !curr.settlement || curr.settlement === 0
            ? 0
            : (6 / rightSpan ** 2) *
              curr.settlement *
              (Er * Ir) *
              signConvention
        ),
      ];

      left = [
        new StaticVariable("c", FEMToLeft || 0),
        new StaticVariable(`EIteta${curr.id}`, (4 / leftSpan) * (El * Il)),
        new StaticVariable(
          `EIteta${prev.id}`,
          prev.type === "fixed" ? 0 : (2 / leftSpan) * (El * Il)
        ),
        new StaticVariable(
          "EIdeta",
          !curr.settlement || curr.settlement === 0
            ? 0
            : (6 / leftSpan ** 2) * curr.settlement * (El * Il) * signConvention
        ),
      ];
    }

    const supportEqn = right.concat(left);

    const generalEquation = this.collectLikeTerms(supportEqn);
    return generalEquation;
  }
}
