// src/i18n/en.ts
// EN dictionary. Same shape as es.ts, populated in Tasks B.1-B.x.
export default {
  layout: {
    meta: {
      description: "Kevin González — Colombian FullStack Developer. I build SaaS, integrate AI into real products, and lead implementation teams. Bucaramanga, Colombia.",
    },
  },
  pages: { home: { title: "Vin" }, me: { title: "About me" }, contact: { title: "Contact" } },
  nav: { home: "Home", me: "About me", contact: "Contact" },
  tools: { muteAria: "Mute/Unmute music", localeToggleAria: "Switch language" },
  sidebar: {
    statusAvailable: "Available",
  },
  home: {
    hero: {
      greeting: "Hello, ",
      heading: "I'm Kevin",
      subtitle: "Fullstack Software Developer",
      status: "Active Since SEP '23",
      statusCta: "LET'S TALK",
      body: "I build systems that combine solid back-end, polished front-end, and LLM integration into real products.<br />I've co-created a SaaS from MVP, led implementation teams, and migrated entire platforms to more maintainable stacks.<br />I'm obsessed with clean architecture — high cohesion, low coupling — and translating vague requirements into clear technical decisions.<br />Why do I do this?<br />Because when everything clicks, I feel a bit like a god creating things, defining their attributes and behaviors.<br />When I'm not developing, I'm probably thinking about the future or being the go-to advisor for my friends.",
    },
    casos: {
      title: "CASES",
      titleHover: "Real",
      cardCta: "See more →",
      linkedinAnchor: "More on LinkedIn ",
    },
    techs: {
      title: "SKILLS",
      titleHover: "My",
      aboutMeAnchor: "About me ",
      hexLockedLabel: "Locked",
    },
  },
} as const;
