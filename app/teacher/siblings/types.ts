import { Student } from "@/lib/types";

export interface SiblingFamily {
  familyId: string;
  familyName?: string;
  members: Student[];
}

export interface DiscountModalState {
  familyId: string;
  familyName: string;
  currentPercent: number | null;
  currentReason: string;
  currentBookPercent: number | null;
  currentBookReason: string;
}
