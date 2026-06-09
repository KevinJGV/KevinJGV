export interface Technology {
  src: string;
  title: string;
  href?: string;
}

// Pure tech list — locked slots are generated at render time (see
// `src/utils/hexLayout.ts` + `HomeTechs.astro`). Order here is the source
// of truth before shuffle; visual position is randomized client-side.
export const technologies: Technology[] = [
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042587/honeycomb_java_ianic7.svg", title: "Java", href: "https://java.com" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042593/honeycomb_ts_yfxeb6.svg", title: "TypeScript", href: "https://typescriptlang.org" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042584/honeycomb_atlassian_u9q0jk.svg", title: "Jira", href: "https://atlassian.com" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042586/honeycomb_giit_inyrvg.svg", title: "git", href: "https://git-scm.com" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042595/honeycomb_css_bdeaun.svg", title: "CSS", href: "https://developer.mozilla.org/es/docs/Web/CSS" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042593/honeycomb_py_oajqm9.svg", title: "Python", href: "https://python.org" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042582/honeycomb_md_mbjzs7.svg", title: "MarkDown"},
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042577/honeycomb_notion_clh2jz.svg", title: "Notion", href: "https://notion.com" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781041551/honeycomb_springboot.png", title: "Spring Boot", href: "https://spring.io" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042576/honeycomb_postgre_zpcxdq.svg", title: "PostgreSQL", href: "https://postgresql.org" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042575/honeycomb_postman_ealqxb.svg", title: "Postman", href: "https://postman.com" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042580/honeycomb_js_iwridy.svg", title: "Javascript", href: "https://developer.mozilla.org/es/docs/Web/JavaScript" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042595/honeycomb_astro_q1gnmt.svg", title: "Astro Framework", href: "https://astro.build" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042588/honeycomb_Figma_uhzvhi.svg", title: "Figma", href: "https://figma.com" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042581/honeycomb_insomnia_z03pbv.svg", title: "Insomnia", href: "https://insomnia.rest" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042579/honeycomb_mysql_gaijxz.svg", title: "MySQL", href: "https://mysql.com" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042583/honeycomb_html5_crzcb7.svg", title: "HTML", href: "https://developer.mozilla.org/es/docs/Web/HTML" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042594/honeycomb_linux_kpbqtw.svg", title: "Linux", href: "https://linux.org" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042592/honeycomb_archlinux_dn7dg6.svg", title: "Arch Linux", href: "https://archlinux.org" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042573/honeycomb_vercel_k8i3sm.svg", title: "Vercel", href: "https://vercel.com" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042574/honeycomb_react_cvk6dr.svg", title: "React", href: "https://react.dev" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042589/honeycomb_eslint_svxda9.svg", title: "ESLint", href: "https://eslint.org" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042583/honeycomb_hyprland_h4ud8e.svg", title: "Hyprland", href: "https://hyprland.org" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042590/honeycomb_claudecode_i0grnf.svg", title: "Claude Code", href: "https://claude.com/product/claude-code" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042590/honeycomb_convex_vcoew0.svg", title: "Convex Baas", href: "https://convex.dev" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042574/honeycomb_shopify_ekxpu0.svg", title: "Shopify", href: "https://shopify.com" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042575/honeycomb_prisma_ndkh5k.svg", title: "Prisma ORM", href: "https://prisma.io" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042578/honeycomb_nextjs_n7waxc.svg", title: "Next.JS", href: "https://nextjs.org" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042585/honeycomb_GraphQL_dcsozn.svg", title: "GraphQL", href: "https://graphql.org" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781041619/honeycomb_liquid.png", title: "Liquid", href: "https://shopify.dev/docs/api/liquid" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042580/honeycomb_make_qhrcjj.svg", title: "Make.com", href: "https://make.com" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042585/honeycomb_Apps_Script_kq6fmw.svg", title: "Apps Script", href: "https://developers.google.com/apps-script?hl=es-419" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042577/honeycomb_node_nubflr.svg", title: "Node.JS", href: "https://nodejs.org" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042588/honeycomb_ExpressJS_sn4yyl.svg", title: "Express", href: "https://expressjs.com" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781042591/honeycomb_biome_lbwakl.svg", title: "Biome", href: "https://biomejs.dev" },
];

