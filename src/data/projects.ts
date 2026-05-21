export interface Project {
  text: string;
  href: string;
  cover: string;
  bgColor: string;
  txtColor?: string;
  hrefImages?: string[];
  tags: Record<string, string>;
}

export const projects: Project[] = [
  {
    text: "Domi",
    href: "https://kevinjgv.github.io/Work-Project_DOMI/",
    cover: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1731379909/Domi_lmwy6d.svg",
    bgColor: "#F3B10F",
    txtColor: "#092334",
    hrefImages: [
      "https://res.cloudinary.com/dqgxt985j/image/upload/v1731358579/Domi_index_hg32o3.png",
      "https://res.cloudinary.com/dqgxt985j/image/upload/v1731358579/Domi_shop_snjaez.png",
      "https://res.cloudinary.com/dqgxt985j/image/upload/v1731358579/Domi_cart_ezbmjb.png",
    ],
    tags: {
      template: "e-commerce",
      template2: "technology",
      template3: "frontend",
      template4: "uiux",
    },
  },
  {
    text: "SWAPI - Consumed API",
    href: "https://kevinjgv.github.io/SWAPIMPIRE_OF_JEDIS_CONSUMED-API/",
    cover: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1731379907/Swapi_popgza.png",
    bgColor: "#42000b",
    txtColor: "#FFE300",
    hrefImages: [
      "https://res.cloudinary.com/dqgxt985j/image/upload/v1731914352/swapi1_dgz5ml.png",
      "https://res.cloudinary.com/dqgxt985j/image/upload/v1731914349/swapi2_v6zavr.png",
      "https://res.cloudinary.com/dqgxt985j/image/upload/v1731914348/swapi3_czp65u.png",
    ],
    tags: {
      template: "entertainment",
      template1: "api",
      template2: "frontend",
      template3: "uiux",
    },
  },
  {
    text: "My Progress Eye",
    href: "https://kevinjgv.github.io/My_Progress_Eye/index.html",
    cover: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1731379911/progress_eye_wsybqv.png",
    bgColor: "#F9FAFB",
    txtColor: "#000",
    hrefImages: [
      "https://res.cloudinary.com/dqgxt985j/image/upload/v1731915005/prog1_bwchsj.png",
      "https://res.cloudinary.com/dqgxt985j/image/upload/v1731915003/prog2_tvttbo.png",
      "https://res.cloudinary.com/dqgxt985j/image/upload/v1731915000/prog3_yoa58g.png",
      "https://res.cloudinary.com/dqgxt985j/image/upload/v1731914999/prog4_rredwu.png",
    ],
    tags: {
      template: "manager",
      template1: "entertainment",
      template2: "frontend",
      template3: "api",
      template4: "dashboard",
      template5: "uiux",
    },
  },
  {
    text: "Farm Database",
    href: "https://github.com/KevinJGV/Finca_El_Primer_Mundo_MYSQL",
    cover: '<svg xmlns="http://www.w3.org/2000/svg" width="0.88em" height="1em" viewBox="0 0 448 512"><path fill="currentColor" d="M448 73.143v45.714C448 159.143 347.667 192 224 192S0 159.143 0 118.857V73.143C0 32.857 100.333 0 224 0s224 32.857 224 73.143M448 176v102.857C448 319.143 347.667 352 224 352S0 319.143 0 278.857V176c48.125 33.143 136.208 48.572 224 48.572S399.874 209.143 448 176m0 160v102.857C448 479.143 347.667 512 224 512S0 479.143 0 438.857V336c48.125 33.143 136.208 48.572 224 48.572S399.874 369.143 448 336"/></svg>',
    bgColor: "#353535",
    tags: {
      template: "modeling",
      template1: "business",
      template2: "leadership",
      template3: "mysql",
      template4: "db",
    },
  },
];
