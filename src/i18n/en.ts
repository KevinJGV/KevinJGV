// src/i18n/en.ts
// EN dictionary. Same shape as es.ts, populated in Tasks B.1-B.x.
export default {
  layout: { meta: { description: "" } },
  pages: { home: { title: "Vin" }, me: { title: "About me" }, contact: { title: "Contact" } },
  nav: { home: "Home", me: "About me", contact: "Contact" },
  tools: { muteAria: "Mute/Unmute music", localeToggleAria: "Switch language" },
} as const;
