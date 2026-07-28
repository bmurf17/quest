export type SkillNode = {
  id: string;
  name: string;
  description: string;
  tier: number;
  prerequisites: string[];
};

export type ClassSkillTree = {
  className: string;
  nodes: SkillNode[];
};
