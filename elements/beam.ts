// member.ts

import { PointLoad, UDL, VDL } from "./load";
import { FixedSupport, RollerSupport, PinnedSupport } from "./support";

export class Node {
  id: string;
  x: number;
  y: number;
  connectedMembers: { member: Beam; isStart: boolean }[] = [];
  support: any = null; // FixedSupport | RollerSupport | PinnedSupport | null

  constructor(id: string, x: number, y: number, support: any = null) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.support = support;

    if (support) {
      support.node = this; // link support to node
    }
  }

  addMember(member: Beam, isStart: boolean) {
    this.connectedMembers.push({ member, isStart });
  }
}

export abstract class Member {
  startNode: Node;
  endNode: Node;
  loads: (PointLoad | UDL | VDL)[];
  Ecoef: number;
  Icoef: number;

  constructor(startNode: Node, endNode: Node, Ecoef = 1, Icoef = 1) {
    this.startNode = startNode;
    this.endNode = endNode;
    this.loads = [];
    this.Ecoef = Ecoef;
    this.Icoef = Icoef;
  }

  get length(): number {
    const dx = this.endNode.x - this.startNode.x;
    const dy = this.endNode.y - this.startNode.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  get angle(): number {
    return Math.atan2(
      this.endNode.y - this.startNode.y,
      this.endNode.x - this.startNode.x
    );
  }

  addLoad(load: PointLoad | UDL | VDL) {
    this.loads.push(load);
  }

  getEquivalentPointLoads(): PointLoad[] {
    const pointLoads: PointLoad[] = [];
    for (const load of this.loads) {
      if (load instanceof PointLoad) pointLoads.push(load);
      else pointLoads.push(load.getResultantLoad());
    }
    return pointLoads;
  }
}

export class Beam extends Member {
  leftSupport: FixedSupport | RollerSupport | PinnedSupport | null;
  rightSupport: FixedSupport | RollerSupport | PinnedSupport | null;

  constructor(
    startNode: Node,
    endNode: Node,
    leftSupport: FixedSupport | RollerSupport | PinnedSupport | null,
    rightSupport: FixedSupport | RollerSupport | PinnedSupport | null,
    Ecoef = 1,
    Icoef = 1
  ) {
    super(startNode, endNode, Ecoef, Icoef);
    this.leftSupport = leftSupport;
    this.rightSupport = rightSupport;

    startNode.addMember(this, true);
    endNode.addMember(this, false);
  }
}

export class Column extends Member {
  constructor(startNode: Node, endNode: Node, Ecoef = 1, Icoef = 1) {
    super(startNode, endNode, Ecoef, Icoef);
    if (Math.abs(this.angle) > 0.01) {
      throw new Error("Column must be vertical");
    }
  }
}

export class InclinedMember extends Member {
  constructor(startNode: Node, endNode: Node, Ecoef = 1, Icoef = 1) {
    super(startNode, endNode, Ecoef, Icoef);
    if (
      Math.abs(this.angle) < 0.01 ||
      Math.abs(Math.abs(this.angle) - Math.PI / 2) < 0.01
    ) {
      throw new Error("InclinedMember must not be horizontal or vertical");
    }
  }
}
