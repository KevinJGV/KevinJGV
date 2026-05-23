export interface TagConfig {
  label: string;
  bgColor: string;
  txtColor: string;
}

export const tagConfigs: Record<string, TagConfig> = {
  "e-commerce": { label: "E-commerce", bgColor: "#264653", txtColor: "#fff" },
  leadership:   { label: "Líderazgo", bgColor: "#7a9e9f", txtColor: "#000" },
  saas:         { label: "SaaS", bgColor: "#0f4c5c", txtColor: "#fff" },
  "ai-applied": { label: "IA aplicada", bgColor: "#5e4ae3", txtColor: "#fff" },
  architecture: { label: "Arquitectura", bgColor: "#2b2d42", txtColor: "#fff" },
  automation:   { label: "Automatización", bgColor: "#e07a5f", txtColor: "#000" },
  refactor:     { label: "Refactor", bgColor: "#3d5a80", txtColor: "#fff" },
  typescript:   { label: "TypeScript", bgColor: "#3178c6", txtColor: "#fff" },
};
