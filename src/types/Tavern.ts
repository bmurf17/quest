export interface TavernConfig {
  minLevel: number;
  maxLevel: number;
  statBonusPool: number;
  candidateCount: number;
}

export const DEFAULT_TAVERN_CONFIG: TavernConfig = {
  minLevel: 1,
  maxLevel: 3,
  statBonusPool: 35,
  candidateCount: 3,
};
