const DEFAULT_WASM_BASE_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const DEFAULT_MODEL_ASSET_PATH = '/models/face_landmarker.task';
const SOURCE = 'mediapipe_face_landmarker';
const UNAVAILABLE_RESULT = Object.freeze({
  faceLandmarks: [],
  faceBlendshapes: [],
  facialTransformationMatrixes: [],
  error: 'facial_model_unavailable',
});

const defaultImportTasksVision = () => import('@mediapipe/tasks-vision');

export function createFaceLandmarkerClient(options = {}) {
  const importTasksVision = options.importTasksVision || defaultImportTasksVision;
  const wasmBaseUrl = options.wasmBaseUrl || DEFAULT_WASM_BASE_URL;
  const modelAssetPath = options.modelAssetPath || DEFAULT_MODEL_ASSET_PATH;
  const delegate = options.delegate || 'GPU';
  const logger = options.logger || null;

  let landmarker = null;
  let initPromise = null;
  let unavailable = false;

  const buildOptions = () => ({
    baseOptions: {
      modelAssetPath,
      delegate,
    },
    runningMode: 'VIDEO',
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
  });

  const initialize = async () => {
    if (landmarker) return { ok: true, source: SOURCE };
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        const module = await importTasksVision();
        const filesetResolver = await module.FilesetResolver.forVisionTasks(wasmBaseUrl);
        landmarker = await module.FaceLandmarker.createFromOptions(filesetResolver, buildOptions());
        unavailable = false;
        return { ok: true, source: SOURCE };
      } catch (error) {
        landmarker = null;
        unavailable = true;
        const message = String(error?.message || error || 'Unable to initialize MediaPipe FaceLandmarker');
        if (logger?.warn) {
          logger.warn({ error: message }, 'facial_model_unavailable');
        }
        return {
          ok: false,
          code: 'facial_model_unavailable',
          flags: ['facial_model_unavailable'],
          message,
        };
      } finally {
        initPromise = null;
      }
    })();

    return initPromise;
  };

  return {
    initialize,

    detectForVideo(videoElement, timestampMs) {
      if (!landmarker || unavailable) return { ...UNAVAILABLE_RESULT };
      try {
        return landmarker.detectForVideo(videoElement, timestampMs);
      } catch (error) {
        const message = String(error?.message || error || 'detectForVideo failed');
        if (logger?.warn) {
          logger.warn({ error: message }, 'facial_detection_failed');
        }
        return {
          ...UNAVAILABLE_RESULT,
          error: 'facial_detection_failed',
          message,
        };
      }
    },

    isReady() {
      return Boolean(landmarker) && !unavailable;
    },

    dispose() {
      if (landmarker?.close) {
        landmarker.close();
      } else if (landmarker?.dispose) {
        landmarker.dispose();
      }
      landmarker = null;
      unavailable = false;
    },
  };
}

export const FACE_LANDMARKER_SOURCE = SOURCE;
export const DEFAULT_FACE_LANDMARKER_MODEL_ASSET_PATH = DEFAULT_MODEL_ASSET_PATH;
export const DEFAULT_FACE_LANDMARKER_WASM_BASE_URL = DEFAULT_WASM_BASE_URL;
