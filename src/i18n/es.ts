// src/i18n/es.ts
// Diccionario de strings ES. Las claves se rellenan en Tasks B.1-B.x
// según los componentes que las consumen.
export default {
  layout: {
    meta: {
      description: "Kevin González — FullStack Developer colombiano. Construyo SaaS, integro IA en productos reales y lidero equipos de implementación. Bucaramanga, Colombia.",
    },
  },
  pages: { home: { title: "Vin" }, me: { title: "Sobre mí" }, contact: { title: "Contacto" } },
  nav: { home: "Inicio", me: "Sobre mí", contact: "Contacto" },
  tools: { muteAria: "Silenciar/Activar música", localeToggleAria: "Cambiar idioma" },
} as const;
