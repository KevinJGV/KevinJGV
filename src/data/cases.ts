export interface Case {
  text: { es: string; en: string };
  href: string;
  cover: string;
  bgColor: string;
  txtColor?: string;
  hrefImages?: string[];
  tags: Record<string, string>;
  company: string;
  role: { es: string; en: string };
  period: string;
}

export const cases: Case[] = [
  {
    text: {
      es: "SaaS B2B desde MVP — motor de agentes IA + liderazgo de implementación",
      en: "B2B SaaS from MVP — AI agent engine + implementation leadership",
    },
    company: "Clonai",
    role: {
      es: "FullStack Developer / Líder Implementador",
      en: "FullStack Developer / Implementation Lead",
    },
    period: "02/2025 – 05/2026",
    href: "https://www.linkedin.com/company/clonaico/posts/?feedView=all",
    cover: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><text x="100" y="62" text-anchor="middle" fill="currentColor" font-family="sans-serif" font-weight="800" font-size="36" letter-spacing="2">CLONAI</text></svg>',
    bgColor: "#0a1929",
    txtColor: "#fff",
    tags: {
      template:  "saas",
      template1: "ai-applied",
      template2: "leadership",
      template3: "architecture",
    },
  },
  {
    text: {
      es: "Integración Shopify + IA para generación automatizada de documentos legales",
      en: "Shopify integration + AI for automated legal document generation",
    },
    company: "Campuslands",
    role: {
      es: "FullStack Developer",
      en: "FullStack Developer",
    },
    period: "10/2023 – 02/2025",
    href: "https://www.justiciacercana.co/",
    cover: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><text x="100" y="42" text-anchor="middle" fill="currentColor" font-family="sans-serif" font-weight="800" font-size="22" letter-spacing="1">JUSTICIA</text><text x="100" y="72" text-anchor="middle" fill="currentColor" font-family="sans-serif" font-weight="800" font-size="22" letter-spacing="1">CERCANA</text></svg>',
    bgColor: "#1d4e3f",
    txtColor: "#fff",
    tags: {
      template:  "e-commerce",
      template1: "automation",
      template2: "ai-applied",
    },
  },
  {
    text: {
      es: "Migración Vue + JavaScript → Astro + TypeScript en plataforma productiva",
      en: "Vue + JavaScript → Astro + TypeScript migration on production platform",
    },
    company: "Campuslands",
    role: {
      es: "FullStack Developer",
      en: "FullStack Developer",
    },
    period: "10/2023 – 02/2025",
    href: "mailto:vin.devsito@gmail.com?subject=Cu%C3%A9ntame%20m%C3%A1s%20sobre%20la%20migraci%C3%B3n%20Vue%E2%86%92Astro",
    cover: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><text x="100" y="68" text-anchor="middle" fill="currentColor" font-family="sans-serif" font-weight="800" font-size="48" letter-spacing="4">V→A</text></svg>',
    bgColor: "#FF5D01",
    txtColor: "#fff",
    tags: {
      template:  "refactor",
      template1: "typescript",
      template2: "architecture",
    },
  },
];
