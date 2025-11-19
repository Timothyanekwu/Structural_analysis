// --- Support Class ---
export type SupportType = "pinned" | "roller" | "fixed";

const SUPPORT_REACTIONS: Record<SupportType, number> = {
  pinned: 2,
  roller: 1,
  fixed: 3,
};

export class Support {
  position: number; // m
  type: SupportType;
  reaction: number;

  constructor(position: number, type: SupportType) {
    this.type = type;
    this.position = position;
    this.reaction = 0;
  }
}
