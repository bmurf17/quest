export type CutsceneScene = {
  text: string;
};

export type Cutscene = {
  id: string;
  scenes: CutsceneScene[];
  nextCutsceneId?: string;
};
