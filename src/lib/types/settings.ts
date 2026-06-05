export interface FontSettings {
  ui: string;
  editor: string;
  preview: string;
}

export interface SizeSettings {
  ui: number;
  editor: number;
  preview: number;
}

export interface EditorSettings {
  lineNumbers: boolean;
  wordWrap: boolean;
  tabSize: number;
  dimInactiveLines: boolean;
  smoothCaret: boolean;
}

export interface PetColorPalette {
  core: string;
  inner: string;
  mid: string;
  outer: string;
  ember: string;
}

export interface PetSettings {
  bigFlameEnabled: boolean;
  smallParticleEnabled: boolean;
  ambientParticlesEnabled: boolean;
  colors: PetColorPalette;
}

export interface Settings {
  theme: string;
  fonts: FontSettings;
  sizes: SizeSettings;
  editor: EditorSettings;
  pet: PetSettings;
  trashRetentionDays: number;
  templatesEnabled: boolean;
}
