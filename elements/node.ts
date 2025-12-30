import { Beam, Column, InclinedMember } from "./member";
import { FixedSupport, RollerSupport, PinnedSupport } from "./support";

export class Node {
  id: string;
  x: number;
  y: number;
  connectedMembers: {
    member: Beam | Column | InclinedMember;
    isStart: boolean;
    moment: number;
  }[] = [];
  support: FixedSupport | RollerSupport | PinnedSupport | null = null; // FixedSupport | RollerSupport | PinnedSupport | null

  constructor(
    id: string,
    x: number,
    y: number,
    support: FixedSupport | RollerSupport | PinnedSupport | null = null
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.support = support;

    if (support) {
      support.node = this; // link support to node
    }
  }

  addMember(member: Beam, isStart: boolean) {
    this.connectedMembers.push({ member, isStart, moment: 0 });
  }
}
