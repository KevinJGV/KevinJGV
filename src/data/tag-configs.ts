export interface TagConfig {
  label: string;
  bgColor: string;
  txtColor: string;
}

export const tagConfigs: Record<string, TagConfig> = {
  "e-commerce": { label: "E-commerce", bgColor: "#264653", txtColor: "#fff" },
  technology:   { label: "Technologia", bgColor: "#6c8c65", txtColor: "#000" },
  frontend:     { label: "Frontend", bgColor: "#6f1d1b", txtColor: "#fff" },
  uiux:         { label: "UI/UX", bgColor: "#f4d35e", txtColor: "#000" },
  entertainment:{ label: "Entretenimiento", bgColor: "#2a9d8f", txtColor: "#000" },
  api:          { label: "API", bgColor: "#000000", txtColor: "#fff" },
  manager:      { label: "Administrador", bgColor: "#8d99ae", txtColor: "#000" },
  dashboard:    { label: "DashBoard", bgColor: "#ff6d00", txtColor: "#000" },
  modeling:     { label: "Modelado", bgColor: "#042a2b", txtColor: "#fff" },
  business:     { label: "Negocio", bgColor: "#ff6b6b", txtColor: "#000" },
  leadership:   { label: "Líderazgo", bgColor: "#7a9e9f", txtColor: "#000" },
  mysql:        { label: "MySql", bgColor: "#04a777", txtColor: "#000" },
  db:           { label: "DB", bgColor: "#f0f0c9", txtColor: "#000" },
};
