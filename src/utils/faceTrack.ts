// Wrapper de MediaPipe FaceLandmarker (Tasks Vision, WASM self-hosteado en
// /public/mediapipe). Detecta landmarks faciales del RETRATO (una vez, modo
// IMAGE) y del visitante por la webcam (modo VIDEO). Todo client-side.
import { FaceLandmarker, FilesetResolver, type NormalizedLandmark } from "@mediapipe/tasks-vision";

export interface VideoTrack {
  landmarks: NormalizedLandmark[] | null;
  blendshapes: Record<string, number> | null;
}

export async function createTracker(): Promise<FaceLandmarker> {
  const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
  return FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: "/mediapipe/face_landmarker.task" },
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: false,
    runningMode: "IMAGE",
  });
}

// Landmarks del retrato (imagen estática) → topología de 468 puntos.
export function detectImageLandmarks(
  landmarker: FaceLandmarker,
  img: HTMLImageElement,
): NormalizedLandmark[] | null {
  const res = landmarker.detect(img);
  return res.faceLandmarks?.[0] ?? null;
}

export function toVideoMode(landmarker: FaceLandmarker): Promise<void> {
  return landmarker.setOptions({ runningMode: "VIDEO" });
}

export function detectVideo(
  landmarker: FaceLandmarker,
  video: HTMLVideoElement,
  ts: number,
): VideoTrack {
  const res = landmarker.detectForVideo(video, ts);
  const landmarks = res.faceLandmarks?.[0] ?? null;
  const cats = res.faceBlendshapes?.[0]?.categories;
  const blendshapes = cats
    ? Object.fromEntries(cats.map((c) => [c.categoryName, c.score]))
    : null;
  return { landmarks, blendshapes };
}
