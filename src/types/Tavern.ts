export interface TavernConfig {
  minLevel: number;
  maxLevel: number;
  statBonusPool: number;
  candidateCount: number;
}

export const DEFAULT_TAVERN_CONFIG: TavernConfig = {
  minLevel: 1,
  maxLevel: 5,
  statBonusPool: 55,
  candidateCount: 3,
};
