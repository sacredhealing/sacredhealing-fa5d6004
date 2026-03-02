export interface ShieldData {
  emf: string;
  pathogenLoad: string;
  fearIndex: string;
}

export const INITIAL_DATA: ShieldData = {
  emf: "95mG_CHAOTIC",
  pathogenLoad: "HIGH_MOLD_VIRUS_VIBRATION",
  fearIndex: "COLLECTIVE_ANXIETY_DETECTED",
};

export const ACTIVE_DATA: ShieldData = {
  emf: "0.5mG_COHERENT",
  pathogenLoad: "NEUTRALIZED_BY_VIOLET_FLAME",
  fearIndex: "PEACE_RESTORATION_ACTIVE",
};
