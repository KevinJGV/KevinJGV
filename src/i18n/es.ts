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
    carouselNouns: [
      "Software Developer",
      "Dev in dev",
      "Pizza Time",
      '"FullStack"',
      "Frontend",
      "Backend",
      "AI-pilled",
      "Líder Implementador",
      "Architecture-pilled",
      "Gamer",
      "Empanada Lover",
    ],
  },
  footer: {
    typewriterWords: ["Marca.", "Negocio.", "Valor.", "Potencial."],
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
  me: {
    about: {
      heading: "¿Sobre mí?",
      body: "Mi nombre completo es Kevin Johan González Velandia.<br />Soy un desarrollador FullStack colombiano,<br />con foco en arquitecturas escalables e integración de IA donde realmente suma valor — no por moda.<br />Doy forma a marcas y productos digitales, fascinado por la intersección de la creatividad y la lógica.<br />A pesar de la apariencia de mi webpage, soy un amante de la simplicidad, el minimalismo y la complejidad de las relaciones interpersonales.<br />Me encanta colaborar en proyectos exigentes con gente talentosa — y soy de los que creen que un equipo funciona mejor cuando el nuevo puede tener una charla absurda con el administrador sin que eso reste profesionalismo.<br />¿Necesitas una mano? Yo tengo dos.",
    },
    whatIDo: {
      heading: "¿Qué hago?",
      body: "Diseño y construyo software que tiene que funcionar el lunes en producción, no solo en una demo de viernes.<br />Prefiero entender el problema dos veces antes que reescribir la solución tres.<br />Optimizo procesos antes que reinventarlos: si la rueda existe, funciona y es confiable, la uso.<br />Sumo valor con colaboración, comunicación honesta y la disciplina de terminar lo que empiezo — sin convertirme en robot ni esperar que los demás lo sean.<br />Dame un teclado, un ratón, tiempo y música clásica sin anuncios — lo demás lo resolvemos.",
    },
    whereImGoing: {
      heading: "¿A donde voy?",
      quote: "Con mi trabajo, sin temor a ello y nada más que eso, destilar mi valor y éxito profesional sin importar la empresa.",
      bodyBefore: "Personalmente, aquel sujeto al que recurres ante un gridlock —\nel que ya pasó por suficientes incendios para saber por dónde empezar,\ncapaz de escribir ",
      ninjaCodeLinkText: "Código Ninja",
      bodyAfter: " a su conveniencia.\nProfesionalmente, construyendo o co-construyendo productos que importen:\ncon la experiencia técnica, el criterio de arquitectura y la cabeza de líder\npara que las cosas lleguen al usuario y sigan en pie seis meses después.\nY, en algún momento, el CEO de uno o varios de esos productos.",
    },
    likes: {
      lovesHeading: "Qué amo",
      hatesHeading: "Qué no tanto",
      mainHeading: "Mira eso, qué humano",
      loves: [
        { text: "Color negro" },
        { text: "Producción de contenidos audiovisuales" },
        { text: "Animaciones" },
        { text: "Videojuegos" },
        { text: "Mi moto", note: "(Enduros)" },
        { text: "Admirar personas" },
        { text: "Aconsejar" },
        { text: "Gatos" },
        { text: "Cocinar", note: "(si me animo)" },
        { text: "Soledad", note: "(Staying-at-home)" },
        { text: "Climas fríos" },
        { text: "Trabajar en equipo", note: "(Y el co-working)" },
        { text: "Conocer nuevos sitios" },
      ],
      hates: [
        { text: "Resultados incompletos" },
        { text: "Quedarme sin dinero" },
        { text: "Climas muy calientes" },
        { text: "Gente sin criterio propio" },
        { text: "Gente que no soporta mi sentido del humor" },
        { text: "Café puro" },
        { text: "Falta de empatía" },
        { text: "Gente superautoritaria" },
      ],
    },
  },
  contact: {
    heading1: "Dame tu contacto",
    intro: "Siempre estoy abierto a propuestas, ¿tienes alguna?",
    formLabels: {
      nombre: "Nombre",
      email: "E-mail",
      descripcion: "Cuentame el chisme",
      submit: "Enviar",
    },
    successFeedback: "Mensaje recibido. Te respondo pronto.",
    heading2: "... O enviame un e-mail",
    emailIntro: "Puede tardar un poco en que recibas mi respuesta, pero seguro que mas de una semana no vas a tener que esperar",
    emailIntroParen: "(si no es spam, claro)",
  },
} as const;
