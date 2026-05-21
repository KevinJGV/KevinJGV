export interface Technology {
  src: string;
  title: string;
}

export type HexagonSlot = Technology | null;

// `null` represents an empty slot in the hexagonal honeycomb (a `<Hexagon />` with no props).
// The order MUST be preserved or the visual pattern breaks.
export const hexagonSlots: HexagonSlot[] = [
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1732069030/free-java-59-1174952_rcoapt.svg", title: "Java" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1755287690/1200px-Typescript_logo_2020.svg_umjkft.svg", title: "TypeScript" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1732070256/gratis-png-jira-atlassian-software-de-computadora-confluencia-desarrollo-de-software-jira_ijbp0y.svg", title: "Jira" },
  null,
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732069645/git_plain_wordmark_logo_icon_146508_lxcqzm.svg", title: "git" },
  null,
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1755288774/340px-CSS3_logo_and_wordmark.svg_elok7l.svg", title: "CSS" },
  null,
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732068544/1711525883305_prjgih.svg", title: "Python" },
  null,
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732070853/image_rnyojd.svg", title: "MarkDown" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732071297/Notion_app_logo_f6uixh.svg", title: "Notion" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1732069390/1656604745399_m4wyx5.png", title: "Spring Boot" },
  null,
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732071011/pngwing.com_bpat9e.svg", title: "PostgreSQL" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732071136/postman-logo-0087CA0D15-seeklogo.com_dajchv.svg", title: "Postman" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732068739/JavaScript-logo_mpgu9l.svg", title: "Javascript" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732071705/1_nLbfO_PdTSpeCdZQuUr8RQ_wvcppy.svg", title: "Astro Framework" },
  null,
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732069752/Figma-logo_jsyern.svg", title: "Figma" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732071224/insomnia-logo-A35E09EB19-seeklogo.com_jujkam.svg", title: "Insomnia" },
  null,
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732069295/mysql_PNG23_rlknax.svg", title: "MySQL" },
  null,
  null,
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732070581/HTML5_logo_and_wordmark_njrary.svg", title: "HTML" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732071368/sonarlint-icon-logo-0161BCE8AD-seeklogo.com_l2ardn.svg", title: "SonarLint" },
  null,
  null,
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1732071874/1200px-Tux.svg_xjz7da.svg", title: "Linux" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1755288591/arch_o5n2pt.svg", title: "Arch Linux" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1755288590/vercel_xivkm6.svg", title: "Vercel" },
  null,
  null,
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1755288591/react_xjxhnf.svg", title: "React" },
  null,
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1755287829/eslint_ag585p.svg", title: "ESLint" },
];
