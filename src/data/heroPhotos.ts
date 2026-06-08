export interface HeroPhoto {
  src: string;
}

// Fotos del hero (HomeHero.astro). Se elige una AL AZAR en cada carga de la
// página (igual que el shuffle de `technologies.ts`): SSR pinta una como
// fallback y el script cliente re-elige en cada `astro:page-load`.
// Agregá más URLs (Cloudinary) para que rote entre ellas.
export const heroPhotos: HeroPhoto[] = [
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1780883374/phantom_face_g3rbix.png" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1780883386/phantom_face_wise_yfvadm.png" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1780883416/phantom_face_glasses_jtoy8g.png" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1780883425/phantom_face_smiling_wrobx5.png" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1780883436/phantom_face_sunglasses_smqhrn.png" },
];
