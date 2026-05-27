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
  sidebar: {
    statusAvailable: "Disponible",
  },
  home: {
    hero: {
      greeting: "Hola, ",
      heading: "Soy Kevin",
      subtitle: "Fullstack Software Developer",
      status: "Activo Desde SEP '23",
      statusCta: "HABLEMOS",
      body: "Construyo sistemas que combinan back-end sólido, front-end cuidado e integración de LLMs en productos reales.<br />He co-creado un SaaS desde MVP, liderado equipos de implementación y migrado plataformas enteras a stacks más mantenibles.<br />Me obsesiona la arquitectura limpia — alta cohesión, bajo acoplamiento — y traducir requerimientos confusos a decisiones técnicas claras.<br />¿Por qué hago esto?<br />Porque cuando todo encaja me siento un poco dios creando cosas, definiendo sus atributos y comportamientos.<br />Cuando no estoy desarrollando, probablemente estoy pensando en el futuro o siendo el consejero de mis amigos.",
    },
    casos: {
      title: "CASOS",
      titleHover: "Mis",
      cardCta: "Ver más →",
      linkedinAnchor: "Más en LinkedIn ",
    },
    techs: {
      title: "BAGAJE",
      titleHover: "Mí",
      aboutMeAnchor: "Sobre mí ",
      hexLockedLabel: "Bloqueado",
    },
  },
} as const;
