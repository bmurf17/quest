export interface RunResult {
  outcome: "victory" | "defeat" | "timeout";
  turnsTaken: number;
  combatsWon: number;
  combatsLost: number;
  partyState: PartyState[];
  gold: number;
  log: string[];
}

export interface PartyState {
  name: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  alive: boolean;
}

export interface ScenarioConfig {
  party: string[];
  maxTurns: number;
  verbose: boolean;
  screenshotDir?: string;
  timeoutSeconds: number;
}
