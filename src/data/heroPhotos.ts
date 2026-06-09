export interface HeroPhoto {
  src: string;
}

// Fotos del hero (HomeHero.astro). Se elige una AL AZAR en cada carga de la
// página (igual que el shuffle de `technologies.ts`): SSR pinta una como
// fallback y el script cliente re-elige en cada `astro:page-load`.
// Agregá más URLs (Cloudinary) para que rote entre ellas.
export const heroPhotos: HeroPhoto[] = [
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781040270/phantom_face_g3rbix_450x686.png" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781040267/phantom_face_glasses_jtoy8g_450x686.png" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781040262/phantom_face_smiling_wrobx5_450x686.png" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781040254/phantom_face_sunglasses_smqhrn_450x686.png" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1781039010/copy_of_phantom_face_wise_yfvadm.png" },
];
