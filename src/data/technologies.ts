export interface Technology {
  src: string;
  title: string;
  href?: string;
}

// Pure tech list — locked slots are generated at render time (see
// `src/utils/hexLayout.ts` + `HomeTechs.astro`). Order here is the source
// of truth before shuffle; visual position is randomized client-side.
export const technologies: Technology[] = [
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1732069030/free-java-59-1174952_rcoapt.svg", title: "Java", href: "https://java.com" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1755287690/1200px-Typescript_logo_2020.svg_umjkft.svg", title: "TypeScript", href: "https://typescriptlang.org" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1732070256/gratis-png-jira-atlassian-software-de-computadora-confluencia-desarrollo-de-software-jira_ijbp0y.svg", title: "Jira", href: "https://atlassian.com" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732069645/git_plain_wordmark_logo_icon_146508_lxcqzm.svg", title: "git", href: "https://git-scm.com" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1755288774/340px-CSS3_logo_and_wordmark.svg_elok7l.svg", title: "CSS", href: "https://developer.mozilla.org/es/docs/Web/CSS" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732068544/1711525883305_prjgih.svg", title: "Python", href: "https://python.org" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732070853/image_rnyojd.svg", title: "MarkDown"},
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732071297/Notion_app_logo_f6uixh.svg", title: "Notion", href: "https://notion.com" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1732069390/1656604745399_m4wyx5.png", title: "Spring Boot", href: "https://spring.io" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732071011/pngwing.com_bpat9e.svg", title: "PostgreSQL", href: "https://postgresql.org" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732071136/postman-logo-0087CA0D15-seeklogo.com_dajchv.svg", title: "Postman", href: "https://postman.com" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1755288423/JavaScript-logo_mpgu9l.svg", title: "Javascript", href: "https://developer.mozilla.org/es/docs/Web/JavaScript" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732071705/1_nLbfO_PdTSpeCdZQuUr8RQ_wvcppy.svg", title: "Astro Framework", href: "https://astro.build" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732069752/Figma-logo_jsyern.svg", title: "Figma", href: "https://figma.com" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732071224/insomnia-logo-A35E09EB19-seeklogo.com_jujkam.svg", title: "Insomnia", href: "https://insomnia.rest" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732069295/mysql_PNG23_rlknax.svg", title: "MySQL", href: "https://mysql.com" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732070581/HTML5_logo_and_wordmark_njrary.svg", title: "HTML", href: "https://developer.mozilla.org/es/docs/Web/HTML" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732071368/sonarlint-icon-logo-0161BCE8AD-seeklogo.com_l2ardn.svg", title: "SonarLint", href: "https://sonarlint.org" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1732071874/1200px-Tux.svg_xjz7da.svg", title: "Linux", href: "https://linux.org" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1755288591/arch_o5n2pt.svg", title: "Arch Linux", href: "https://archlinux.org" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1755288590/vercel_xivkm6.svg", title: "Vercel", href: "https://vercel.com" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1755288591/react_xjxhnf.svg", title: "React", href: "https://react.dev" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1755287829/eslint_ag585p.svg", title: "ESLint", href: "https://eslint.org" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1779908388/hyprland_ixftzj.svg", title: "Hyprland", href: "https://hyprland.org" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1779908546/claudecode-color_fp03n9.svg", title: "Claude Code", href: "https://claude.com/product/claude-code" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1779908647/convex_o8asu8.svg", title: "Convex Baas", href: "https://convex.dev" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1779908731/shopify_acwnnw.svg", title: "Shopify", href: "https://shopify.com" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1779911644/Prisma_xmiehy.svg", title: "Prisma ORM", href: "https://prisma.io" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1779912539/Next-js_Logo_0_fpumj9.svg", title: "Next.JS", href: "https://nextjs.org" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1779912689/GraphQL_Logo_Wordmark_Stacked_Rhodamine_qcavxd.svg", title: "GraphQL", href: "https://graphql.org" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1779912873/liquid_agzcio.png", title: "Liquid", href: "https://shopify.dev/docs/api/liquid" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1779914889/Make_idU77DJcxU_0_ajmb7n.svg", title: "Make.com", href: "https://make.com" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1779913037/Google_Apps_Script_t8l0nq.svg", title: "Apps Script", href: "https://developers.google.com/apps-script?hl=es-419" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1779914920/nodejsStackedLight_sz4ozv.svg", title: "Node.JS", href: "https://nodejs.org" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1779914928/ExpressJS_id74npXgk8_1_cvmmrx.svg", title: "Express", href: "https://expressjs.com" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1780844711/biomejs_ki68sh.svg", title: "Biome", href: "https://biomejs.dev" },
];

