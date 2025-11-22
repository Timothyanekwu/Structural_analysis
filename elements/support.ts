// --- Support Class ---
export type SupportType = "pinned" | "roller" | "fixed";

const SUPPORT_REACTIONS: Record<SupportType, number> = {
  pinned: 2,
  roller: 1,
  fixed: 3,
};

export abstract class Support {
  position: number;
  type: SupportType;
  prev: Support | null;
  next: Support | null;
  id: number;
  settlement?: number;

  constructor(
    position: number,
    type: SupportType,
    settlement?: number,
    prev: Support | null = null,
    next: Support | null = null
  ) {
    this.type = type;
    this.position = position;
    this.prev = prev;
    this.next = next;
    this.id = !this.prev ? 0 : this.prev.id + 1;
    this.settlement = settlement || 0;

    if (prev) prev.next = this;
    if (next) next.prev = this;
  }
}

export class RollerSupport extends Support {
  allowRotation: boolean;
  YReaction: number;
  settlement: number;

  constructor(
    position: number,
    settlement?: number,
    prev: Support | null = null
  ) {
    super(position, "roller", settlement, prev);

    this.allowRotation = true;
    this.YReaction = 0;
    this.settlement = settlement || 0;
  }
}

export class PinnedSupport extends Support {
  rotation: boolean;
  YReaction: number;
  XReaction: number;
  settlement: number;

  constructor(
    position: number,
    settlement?: number,
    prev: Support | null = null
  ) {
    super(position, "pinned", settlement, prev);
    this.rotation = true;
    this.YReaction = 0;
    this.XReaction = 0;
    this.settlement = settlement || 0;
  }
}

export class FixedSupport extends Support {
  rotation: 0 = 0;
  YReaction: number;
  XReaction: number;
  moment: number;
  settlement: number;

  constructor(
    position: number,
    settlement?: number,
    prev: Support | null = null
  ) {
    super(position, "fixed", settlement, prev);
    this.YReaction = 0;
    this.XReaction = 0;
    this.moment = 0;
    this.settlement = settlement || 0;
  }

  clockwise() {
    return this.moment * -1;
  }

  antiClockwise() {
    return Math.abs(this.moment);
  }
}
