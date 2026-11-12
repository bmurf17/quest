import type { DamageDice } from "@/types/Item";

export function rollDamageDice(dice: DamageDice): number {
  let total = 0;
  for (let i = 0; i < dice.numDice; i++) {
    total += Math.floor(Math.random() * dice.dieSize) + 1;
  }
  return total + dice.bonus;
}

export function formatDamageDice(dice: DamageDice): string {
  return `${dice.numDice}d${dice.dieSize}${dice.bonus >= 0 ? "+" : ""}${dice.bonus}`;
}
