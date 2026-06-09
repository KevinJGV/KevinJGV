// src/data/cv.ts
// Contenido transcrito de docs/superpowers/.cv/KEVIN_JOHAN_GONZÁLEZ_V_CV_{ES,EN}.pdf
// Fuente única de verdad del texto del CV. El markup mapea sobre estos datos.

export interface CvLink {
  label: string;
  href: string;
}

export interface CvAchievement {
  title: string;
  description: string;
}

export interface CvExperience {
  role: string;
  company: string;
  companyUrl?: string;
  period: string;
  summary: string;
  achievements: CvAchievement[];
}

export interface CvEducation {
  title: string;
  institution: string;
  institutionUrl?: string;
  period: string;
  location: string;
  description: string;
}

export interface CvSkillGroup {
  category: string;
  items: string;
}

export interface CvUi {
  achievementsLabel: string;
  downloadPdf: string;
  themeLabel: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  switchTo: string; // etiqueta del idioma alternativo (p.ej. "EN")
}

export interface CvData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  links: CvLink[];
  profileHeading: string;
  profile: string;
  experienceHeading: string;
  experience: CvExperience[];
  educationHeading: string;
  education: CvEducation[];
  skillsHeading: string;
  skills: CvSkillGroup[];
  ui: CvUi;
}

const links: CvLink[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/vin-dev" },
  { label: "Github", href: "https://github.com/KevinJGV" },
  { label: "Website", href: "https://vindevsito.dev" },
];

const es: CvData = {
  name: "Kevin Johan González V.",
  title: "FullStack Software Developer",
  email: "vin.devsito@gmail.com",
  phone: "+573178952025",
  location: "Bucaramanga, Colombia",
  links,
  profileHeading: "Perfil",
  profile:
    "Desarrollador FullStack con cerca de 3 años de experiencia, especializado en aportar a los equipos mediante la construcción de arquitecturas escalables (Alta Cohesión y Bajo Acoplamiento) y la integración avanzada de Inteligencia Artificial. Experto en colaborar para modernizar interfaces (React/Astro) y robustecer el backend. Destaco por mi facilidad para trabajar en sintonía con las necesidades del negocio, traduciendo requerimientos complejos en soluciones técnicas eficientes que optimizan los procesos y el éxito general del producto.",
  experienceHeading: "Experiencia Profesional",
  experience: [
    {
      role: "Desarrollador FullStack / Líder Implementador",
      company: "Clonai S.a.s",
      companyUrl: "https://www.linkedin.com/company/clonaico/posts/?feedView=all",
      period: "02/2025 – 05/2026",
      summary:
        "Actué como co-creador técnico del producto SaaS desde su fase MVP, liderando el desarrollo de la arquitectura y la lógica de negocio. Posteriormente, dada mi comprensión integral del sistema y tras una reestructuración estratégica, fui seleccionado para asumir el rol de Líder Implementador, combinando el desarrollo técnico continuo con la dirección del equipo de entrega.",
      achievements: [
        {
          title: "Co-creación y Consolidación de Arquitectura",
          description:
            "Lideré el diseño y escalado de las bases del producto abarcando modelado de bases de datos, lógicas de negocio y UI/UX, garantizando un entorno SaaS estable, escalable y alineado a los requerimientos del mercado.",
        },
        {
          title: "Motor de Inteligencia Artificial",
          description:
            "Participé en la estructuración de un motor de agentes autónomos para soporte, apoyando la implementación de tolerancia a fallos multi-LLM y un pipeline dinámico de políticas de seguridad en tiempo real.",
        },
        {
          title: "Liderazgo Técnico y Gestión del Cambio",
          description:
            "Dirigí y capacité al equipo de implementadores bajo una nueva estrategia comercial. Facilité ceremonias ágiles (dailies), coordiné requerimientos directamente con clientes y transmití buenas prácticas de desarrollo para elevar la calidad operativa del área.",
        },
        {
          title: "Estandarización de Procesos",
          description:
            "Ideé y establecí los lineamientos formales del rol de implementación. Desarrollé un sistema de seguimiento centralizado —apoyándome en automatizaciones y Spreadsheets con filtrado dinámico— que aportó orden, control y visibilidad ante los constantes pivotes estratégicos de la startup.",
        },
      ],
    },
    {
      role: "Desarrollador FullStack",
      company: "Campuslands Co-working",
      companyUrl: "https://www.linkedin.com/company/campuslands/posts/?feedView=all",
      period: "10/2023 – 02/2025",
      summary:
        "Contribuí al desarrollo de plataformas internas y externas impulsadas por IA, enfocadas en mejorar la gestión comercial, la entrega de servicios digitales y el servicio al cliente.",
      achievements: [
        {
          title: "Entrega Crítica e Impacto de Negocio",
          description:
            "Lideré junto al equipo de diseño UI/UX el rediseño total de la interfaz bajo plazos sumamente estrictos y de alta exigencia. El despliegue exitoso en tiempo récord fue un factor determinante para concretar la validación del producto y asegurar el respaldo económico de un stakeholder clave en una mesa de inversión.",
        },
        {
          title: "Integración E-commerce e IA (Solución a Medida)",
          description:
            "Diseñé un flujo automatizado en Shopify (usando Liquid y GraphQL) conectado a un formulario dinámico y Make.com para superar las limitaciones de la plataforma, logrando la generación y entrega automatizada de documentos legales mediante IA.",
        },
        {
          title: "Refactorización y Migración Profunda",
          description:
            "Ejecuté la transición completa de ecosistemas de JavaScript a TypeScript y de Vue a Astro, asegurando una base de código más robusta y de fácil mantenimiento para el resto del equipo de desarrollo.",
        },
        {
          title: "Rediseño de UI e Integraciones",
          description:
            "Integré pasarelas de pago regionales, dejando la infraestructura lista para modelos de suscripción recurrente.",
        },
      ],
    },
  ],
  educationHeading: "Educación",
  education: [
    {
      title: "Técnico en desarrollo de software",
      institution: "Campuslands S.a.s",
      institutionUrl: "https://www.linkedin.com/company/campuslands/about/",
      period: "09/2023 – 02/2025",
      location: "Floridablanca, Colombia",
      description:
        "Formación intensiva y práctica orientada al sector TI. Enfoque dual en habilidades técnicas (Software Skills) y blandas (Soft Skills), complementada con metodologías ágiles, pruebas de rendimiento mensuales, simulacros de entrevistas técnicas y elevator pitches ante expertos.",
    },
  ],
  skillsHeading: "Habilidades",
  skills: [
    { category: "Lenguajes", items: "TypeScript, JavaScript (ES6+), Python, Java, GraphQL, Liquid." },
    { category: "Bases de Datos y BaaS", items: "PostgreSQL, MySQL, Convex, Gestión de ORMs." },
    {
      category: "Herramientas y Automatización",
      items:
        "Git, Diseño de APIs REST, Shopify, Make.com, Hojas de Cálculo Avanzadas (Spreadsheets con automatización y filtrado dinámico).",
    },
    { category: "Frameworks y Librerías", items: "React.js, Astro, Next.js, Node/Express.js, Spring Boot, Tailwind CSS." },
    {
      category: "IA, Arquitectura y Procesamiento",
      items:
        "Integración de LLMs y Agentes Autónomos, Prompt Engineering Avanzado (gestión dinámica de contexto y cápsulas de prompts), Arquitectura de Software (Alta Cohesión y Bajo Acoplamiento), Multithreading.",
    },
    {
      category: "Liderazgo y Metodologías",
      items:
        "Liderazgo Técnico y Mentoría, Gestión de Requerimientos con Clientes, Estandarización de Procesos, Scrum / Metodologías Ágiles.",
    },
  ],
  ui: {
    achievementsLabel: "Logros Clave",
    downloadPdf: "Descargar PDF",
    themeLabel: "Tema",
    themeLight: "Claro",
    themeDark: "Oscuro",
    themeSystem: "Sistema",
    switchTo: "EN",
  },
};

const en: CvData = {
  name: "Kevin Johan González V.",
  title: "FullStack Software Developer",
  email: "vin.devsito@gmail.com",
  phone: "+573178952025",
  location: "Bucaramanga, Colombia",
  links,
  profileHeading: "Profile",
  profile:
    "FullStack Developer with nearly 3 years of experience, specialized in contributing to teams through the construction of scalable architectures (High Cohesion and Low Coupling) and the advanced integration of Artificial Intelligence. Expert in collaborating to modernize interfaces (React/Astro) and strengthen the backend. I stand out for my ability to work in tune with business needs, translating complex requirements into efficient technical solutions that optimize processes and the overall success of the product.",
  experienceHeading: "Professional Experience",
  experience: [
    {
      role: "FullStack Developer / Implementation Lead",
      company: "Clonai S.a.s",
      companyUrl: "https://www.linkedin.com/company/clonaico/posts/?feedView=all",
      period: "02/2025 – 05/2026",
      summary:
        "I acted as the technical co-creator of the SaaS product from its MVP phase, leading the development of the architecture and business logic. Subsequently, given my comprehensive understanding of the system and following a strategic restructuring, I was selected to assume the role of Implementation Lead, combining continuous technical development with the direction of the delivery team.",
      achievements: [
        {
          title: "Architecture Co-creation and Consolidation",
          description:
            "I led the design and scaling of the product's foundations, covering database modeling, business logic, and UI/UX, ensuring a stable, scalable SaaS environment aligned with market requirements.",
        },
        {
          title: "Artificial Intelligence Engine",
          description:
            "I participated in the structuring of an autonomous agent engine for support, assisting in the implementation of multi-LLM fault tolerance and a dynamic real-time security policy pipeline.",
        },
        {
          title: "Technical Leadership and Change Management",
          description:
            "I directed and trained the implementation team under a new commercial strategy. I facilitated agile ceremonies (dailies), coordinated requirements directly with clients, and transmitted good development practices to elevate the operational quality of the department.",
        },
        {
          title: "Process Standardization",
          description:
            "I devised and established the formal guidelines for the implementation role. I developed a centralized tracking system—relying on automations and Spreadsheets with dynamic filtering—that brought order, control, and visibility in the face of the startup's constant strategic pivots.",
        },
      ],
    },
    {
      role: "FullStack Developer",
      company: "Campuslands Co-working",
      companyUrl: "https://www.linkedin.com/company/campuslands/posts/?feedView=all",
      period: "10/2023 – 02/2025",
      summary:
        "I contributed to the development of internal and external AI-driven platforms, focused on improving commercial management, digital service delivery, and customer service.",
      achievements: [
        {
          title: "Critical Delivery and Business Impact",
          description:
            "I led, alongside the UI/UX design team, the total redesign of the interface under extremely strict and highly demanding deadlines. The successful deployment in record time was a determining factor in materializing product validation and securing the financial backing of a key stakeholder at an investment table.",
        },
        {
          title: "E-commerce and AI Integration (Custom Solution)",
          description:
            "I designed an automated flow in Shopify (using Liquid and GraphQL) connected to a dynamic form and Make.com to overcome the platform's limitations, achieving the automated generation and delivery of legal documents using AI.",
        },
        {
          title: "Deep Refactoring and Migration",
          description:
            "I executed the complete transition of ecosystems from JavaScript to TypeScript and from Vue to Astro, ensuring a more robust and easily maintainable codebase for the rest of the development team.",
        },
        {
          title: "UI Redesign and Integrations",
          description:
            "I integrated regional payment gateways, leaving the infrastructure ready for recurring subscription models.",
        },
      ],
    },
  ],
  educationHeading: "Education",
  education: [
    {
      title: "Software Development Technician",
      institution: "Campuslands S.a.s",
      institutionUrl: "https://www.linkedin.com/company/campuslands/about/",
      period: "09/2023 – 02/2025",
      location: "Floridablanca, Colombia",
      description:
        "Intensive and practical training oriented to the IT sector. Dual focus on technical skills (Software Skills) and soft skills (Soft Skills), complemented by agile methodologies, monthly performance tests, technical interview simulations, and elevator pitches to experts.",
    },
  ],
  skillsHeading: "Skills",
  skills: [
    { category: "Languages", items: "TypeScript, JavaScript (ES6+), Python, Java, GraphQL, Liquid." },
    { category: "Databases and BaaS", items: "PostgreSQL, MySQL, Convex, ORM Management." },
    {
      category: "Tools and Automation",
      items:
        "Git, REST API Design, Shopify, Make.com, Advanced Spreadsheets (Spreadsheets with automation and dynamic filtering).",
    },
    { category: "Frameworks and Libraries", items: "React.js, Astro, Next.js, Node/Express.js, Spring Boot, Tailwind CSS." },
    {
      category: "AI, Architecture and Processing",
      items:
        "Integration of LLMs and Autonomous Agents, Advanced Prompt Engineering (dynamic context management and prompt capsules), Software Architecture (High Cohesion and Low Coupling), Multithreading.",
    },
    {
      category: "Leadership and Methodologies",
      items:
        "Technical Leadership and Mentoring, Requirements Management with Clients, Process Standardization, Scrum / Agile Methodologies.",
    },
  ],
  ui: {
    achievementsLabel: "Key Achievements",
    downloadPdf: "Download PDF",
    themeLabel: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    switchTo: "ES",
  },
};

export const cv: Record<"es" | "en", CvData> = { es, en };
