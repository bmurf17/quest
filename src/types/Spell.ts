export type SpellEffect = 
  | { type: 'damage'; amount: number; target: 'single' | 'all' }
  | { type: 'heal'; amount: number; target: 'single' | 'party' }
  | { type: 'buff'; stat: 'str' | 'dex' | 'def'; amount: number; duration?: number }
  | { type: 'debuff'; stat: 'defense' | 'strength' | 'dex'; amount: number; duration?: number };

export type Spell = {
  name: string;
  manaCost: number;
  image: string;
  effect: SpellEffect;
  description: string;
};