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
}

export interface Settings {
  theme: string;
  fonts: FontSettings;
  sizes: SizeSettings;
  editor: EditorSettings;
}
