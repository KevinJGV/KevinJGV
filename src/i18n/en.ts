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
    carouselNouns: [
      "Software Developer",
      "Dev in dev",
      "Pizza Time",
      '"FullStack"',
      "Frontend",
      "Backend",
      "AI-pilled",
      "Implementation Lead",
      "Architecture-pilled",
      "Gamer",
      "Empanada Lover",
    ],
  },
  footer: {
    typewriterWords: ["Brand.", "Business.", "Value.", "Potential."],
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
  me: {
    about: {
      heading: "About me?",
      body: "My full name is Kevin Johan González Velandia.<br />I'm a Colombian FullStack developer,<br />focused on scalable architectures and AI integration where it actually adds value — not just because it's trendy.<br />I shape brands and digital products, fascinated by the intersection of creativity and logic.<br />Despite what my webpage might suggest, I'm a lover of simplicity, minimalism, and the complexity of human relationships.<br />I love collaborating on demanding projects with talented people — and I'm one of those who believe a team works best when the new hire can have an absurd conversation with the manager without it undermining professionalism.<br />Need a hand? I've got two.",
    },
    whatIDo: {
      heading: "What do I do?",
      body: "I design and build software that has to work on Monday in production, not just in a Friday demo.<br />I'd rather understand the problem twice than rewrite the solution three times.<br />I optimize processes before reinventing them: if the wheel exists, works, and is reliable, I use it.<br />I add value through collaboration, honest communication, and the discipline to finish what I start — without turning into a robot or expecting others to be one.<br />Give me a keyboard, a mouse, time, and ad-free classical music — we'll figure out the rest.",
    },
    whereImGoing: {
      heading: "Where am I going?",
      quote: "Through my work, without fear of it and nothing more than that, to distill my professional value and success regardless of the company.",
      bodyBefore: "Personally, that person you turn to when there's a gridlock —\nthe one who's been through enough fires to know where to start,\ncapable of writing ",
      ninjaCodeLinkText: "Ninja Code",
      bodyAfter: " at will.\nProfessionally, building or co-building products that matter:\nwith the technical expertise, architectural judgment, and leadership mindset\nto get things to the user and keep them standing six months later.\nAnd, at some point, the CEO of one or several of those products.",
    },
    likes: {
      lovesHeading: "What I love",
      hatesHeading: "Not so much",
      mainHeading: "Look at that, how human",
      loves: [
        { text: "The color black" },
        { text: "Audiovisual content production" },
        { text: "Animations" },
        { text: "Video games" },
        { text: "My bike", note: "(Enduros)" },
        { text: "Admiring people" },
        { text: "Giving advice" },
        { text: "Cats" },
        { text: "Cooking", note: "(if I feel like it)" },
        { text: "Solitude", note: "(Staying-at-home)" },
        { text: "Cold weather" },
        { text: "Teamwork", note: "(And co-working)" },
        { text: "Discovering new places" },
      ],
      hates: [
        { text: "Incomplete results" },
        { text: "Running out of money" },
        { text: "Very hot weather" },
        { text: "People with no opinions of their own" },
        { text: "People who can't handle my sense of humor" },
        { text: "Black coffee" },
        { text: "Lack of empathy" },
        { text: "Overly authoritarian people" },
      ],
    },
  },
  contact: {
    heading1: "Give me your contact",
    intro: "I'm always open to proposals — got one?",
    formLabels: {
      nombre: "Name",
      email: "E-mail",
      descripcion: "Spill the tea",
      submit: "Send",
    },
    successFeedback: "Message received. I'll reply soon.",
    heading2: "... Or send me an e-mail",
    emailIntro: "It might take a little while to hear back from me, but you definitely won't have to wait more than a week",
    emailIntroParen: "(if it's not spam, of course)",
  },
} as const;
