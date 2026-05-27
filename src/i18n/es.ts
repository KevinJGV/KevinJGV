// src/i18n/es.ts
// Diccionario de strings ES. Las claves se rellenan en Tasks B.1-B.x
// según los componentes que las consumen.
export default {
  layout: { meta: { description: "" } },
  pages: { home: { title: "Vin" }, me: { title: "Sobre mí" }, contact: { title: "Contacto" } },
  nav: { home: "Inicio", me: "Sobre mí", contact: "Contacto" },
  tools: { muteAria: "Silenciar/Activar música", localeToggleAria: "Cambiar idioma" },
} as const;
