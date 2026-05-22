export const FONT_STACKS: Record<string, string> = {
  'Inter': '"Inter", "Segoe UI", system-ui, sans-serif',
  'System': '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  'Atkinson': '"Atkinson Hyperlegible", sans-serif',
  'JetBrains Mono': '"JetBrains Mono", "Fira Code", monospace',
  'Fira Code': '"Fira Code", "JetBrains Mono", monospace',
  'Cascadia': '"Cascadia Code", "Cascadia Mono", monospace',
  'monospace': 'monospace, "Courier New", Courier',
  'Lora': '"Lora", Georgia, serif',
  'Source Serif': '"Source Serif 4", "Source Serif", Georgia, serif',
  'Georgia': 'Georgia, "Times New Roman", serif',
};

export const UI_FONTS = ['Inter', 'System', 'Atkinson'] as const;

export const EDITOR_FONTS = ['JetBrains Mono', 'Fira Code', 'Cascadia', 'monospace'] as const;

export const PREVIEW_FONTS = ['Inter', 'Lora', 'Source Serif', 'Georgia'] as const;

export interface ThemeEntry {
  id: string;
  name: string;
  description: string;
  colors: { bg: string; surface: string; text: string; accent: string; muted: string };
}

export const AVAILABLE_THEMES: ThemeEntry[] = [
  { id: 'quiet', name: 'Quiet Light', description: 'Warm paper background, soft contrast', colors: { bg: '#f8f5f0', surface: '#f2eee8', text: '#2a2724', accent: '#6b615a', muted: '#7d7570' } },
  { id: 'quiet-dark', name: 'Quiet Dark', description: 'Dark background, muted tones', colors: { bg: '#1e1e1e', surface: '#252525', text: '#d4d4d4', accent: '#8b8178', muted: '#888888' } },
  { id: 'catppuccin-latte', name: 'Catppuccin Latte', description: 'Warm, gentle pastels', colors: { bg: '#eff1f5', surface: '#e6e9ef', text: '#4c4f69', accent: '#8839ef', muted: '#9ca0b0' } },
  { id: 'catppuccin-mocha', name: 'Catppuccin Mocha', description: 'Rich, cozy dark pastels', colors: { bg: '#1e1e2e', surface: '#181825', text: '#cdd6f4', accent: '#cba6f7', muted: '#a6adc8' } },
  { id: 'everforest-day', name: 'Everforest Day', description: 'Soft green-tinted light', colors: { bg: '#fdf6e3', surface: '#f5edd6', text: '#5c6a64', accent: '#7a9e7e', muted: '#9da9a0' } },
  { id: 'everforest-night', name: 'Everforest Night', description: 'Deep green-tinted dark', colors: { bg: '#2d353b', surface: '#343f44', text: '#d3c6aa', accent: '#a7c080', muted: '#859289' } },
  { id: 'github-light', name: 'GitHub Light', description: 'Clean, neutral light', colors: { bg: '#ffffff', surface: '#f6f8fa', text: '#1f2328', accent: '#0969da', muted: '#656d76' } },
  { id: 'github-dark', name: 'GitHub Dark', description: 'Clean, neutral dark', colors: { bg: '#0d1117', surface: '#161b22', text: '#e6edf3', accent: '#58a6ff', muted: '#8b949e' } },
  { id: 'nord', name: 'Nord', description: 'Arctic, bluish cool tones', colors: { bg: '#eceff4', surface: '#e5e9f0', text: '#2e3440', accent: '#5e81ac', muted: '#7b88a1' } },
];
