import {
  FixedSupport,
  PinnedSupport,
  RollerSupport,
} from "../elements/support";
import { FixedEndMoments } from "./FEMs";
import { Moment } from "./moment";

type Term = { name: string; coefficient: number };

export class SlopeDeflection {
  // Combine like terms
  collectLikeTerms = (terms: Term[]) => {
    const result: { [key: string]: number } = {};

    for (const term of terms) {
      if (term.coefficient === 0) continue;
      if (term.name in result) {
        result[term.name] += term.coefficient;
      } else {
        result[term.name] = term.coefficient;
      }
    }

    return result;
  };

  supportEquations(support: FixedSupport | PinnedSupport | RollerSupport) {
    const El = support.leftBeam?.Ecoef || 0;
    const Il = support.leftBeam?.Icoef || 0;

    const Er = support.rightBeam?.Ecoef || 0;
    const Ir = support.rightBeam?.Icoef || 0;

    const fem = new FixedEndMoments();
    const moment = new Moment();

    let left: Term[] = [];
    let right: Term[] = [];

    const curr = support;
    const next = support.next;
    const prev = support.prev;

    if (!prev) {
      // Left-most support
      const rightSpan = next
        ? next.position - curr.position
        : curr.rightBeam?.length || 0;

      const FEMToRight = fem.getFixedEndMoment(
        curr.rightBeam?.loads || [],
        rightSpan,
        "left",
        support
      );
      const momentToLeft = moment.getMoment(
        curr.position,
        curr.leftBeam?.getEquivalentPointLoads() || []
      );

      left = curr.leftBeam
        ? [
            { name: "c", coefficient: momentToLeft || 0 },
            {
              name: `EIteta${curr.id}`,
              coefficient:
                curr.type === "fixed"
                  ? 0
                  : (4 / curr.leftBeam.length) * (Er * Ir),
            },
            {
              name: "EIdeta",
              coefficient: curr.settlement
                ? (-6 / curr.leftBeam.length ** 2) * curr.settlement * (Er * Ir)
                : 0,
            },
          ]
        : [];

      right = [
        { name: "c", coefficient: FEMToRight || 0 },
        {
          name: `EIteta${curr.id}`,
          coefficient: curr.type === "fixed" ? 0 : (4 / rightSpan) * (Er * Ir),
        },
        {
          name: `EIteta${next?.id}`,
          coefficient: next?.type === "fixed" ? 0 : (2 / rightSpan) * (Er * Ir),
        },
        {
          name: "EIdeta",
          coefficient: curr.settlement
            ? (-6 / rightSpan ** 2) * curr.settlement * (Er * Ir)
            : 0,
        },
      ];
    } else if (!next) {
      // Right-most support
      const leftSpan = curr.position - prev.position;

      const FEMToLeft = fem.getFixedEndMoment(
        curr.leftBeam?.loads || [],
        leftSpan,
        "right",
        prev
      );
      const momentToRight = moment.getMoment(
        curr.position,
        curr.rightBeam?.getEquivalentPointLoads() || []
      );

      left = [
        { name: "c", coefficient: FEMToLeft || 0 },
        {
          name: `EIteta${curr.id}`,
          coefficient: curr.type === "fixed" ? 0 : (4 / leftSpan) * (El * Il),
        },
        {
          name: `EIteta${prev.id}`,
          coefficient: prev.type === "fixed" ? 0 : (2 / leftSpan) * (El * Il),
        },
        {
          name: "EIdeta",
          coefficient: curr.settlement
            ? (-6 / leftSpan ** 2) * curr.settlement * (El * Il)
            : 0,
        },
      ];

      right = curr.rightBeam
        ? [
            { name: "c", coefficient: momentToRight || 0 },
            {
              name: `EIteta${curr.id}`,
              coefficient:
                curr.type === "fixed"
                  ? 0
                  : (4 / curr.rightBeam.length) * (Er * Ir),
            },
            {
              name: "EIdeta",
              coefficient: curr.settlement
                ? (-6 / curr.rightBeam.length ** 2) *
                  curr.settlement *
                  (Er * Ir)
                : 0,
            },
          ]
        : [];
    } else {
      // Interior support
      const rightSpan = next.position - curr.position;
      const leftSpan = curr.position - prev.position;

      const FEMToLeft = fem.getFixedEndMoment(
        curr.leftBeam?.loads || [],
        leftSpan,
        "right",
        prev
      );
      const FEMToRight = fem.getFixedEndMoment(
        curr.rightBeam?.loads || [],
        rightSpan,
        "left",
        support
      );

      const signConvention = next && curr.settlement < next.settlement ? -1 : 1;

      right = [
        { name: "c", coefficient: FEMToRight || 0 },
        { name: `EIteta${curr.id}`, coefficient: (4 / rightSpan) * (Er * Ir) },
        {
          name: `EIteta${next.id}`,
          coefficient: next.type === "fixed" ? 0 : (2 / rightSpan) * (Er * Ir),
        },
        {
          name: "EIdeta",
          coefficient: curr.settlement
            ? (6 / rightSpan ** 2) *
              curr.settlement *
              (Er * Ir) *
              signConvention
            : 0,
        },
      ];

      left = [
        { name: "c", coefficient: FEMToLeft || 0 },
        { name: `EIteta${curr.id}`, coefficient: (4 / leftSpan) * (El * Il) },
        {
          name: `EIteta${prev.id}`,
          coefficient: prev.type === "fixed" ? 0 : (2 / leftSpan) * (El * Il),
        },
        {
          name: "EIdeta",
          coefficient: curr.settlement
            ? (6 / leftSpan ** 2) * curr.settlement * (El * Il) * signConvention
            : 0,
        },
      ];
    }

    return { left, right };
  }

  getEquations(support: FixedSupport | PinnedSupport | RollerSupport) {
    const { left, right } = this.supportEquations(support);

    const supportEqn = right.concat(left);
    return this.collectLikeTerms(supportEqn);
  }

  getResultMoments() {
    // Implementation remains the same
  }
}
