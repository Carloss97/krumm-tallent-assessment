import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_FACE_LANDMARKER_MODEL_ASSET_PATH,
  DEFAULT_FACE_LANDMARKER_WASM_BASE_URL,
} from './faceLandmarkerClient';

const EXPECTED_FACE_LANDMARKER_SHA256 = '64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff';
const currentDir = dirname(fileURLToPath(import.meta.url));

describe('FaceLandmarker production assets', () => {
  it('serves a pinned local model asset at the default runtime path', () => {
    expect(DEFAULT_FACE_LANDMARKER_MODEL_ASSET_PATH).toBe('/models/face_landmarker.task');
    const assetPath = join(currentDir, '../../../public', DEFAULT_FACE_LANDMARKER_MODEL_ASSET_PATH.replace(/^\//, ''));

    expect(existsSync(assetPath)).toBe(true);
    expect(statSync(assetPath).size).toBeGreaterThan(3_000_000);
    const sha256 = createHash('sha256').update(readFileSync(assetPath)).digest('hex');
    expect(sha256).toBe(EXPECTED_FACE_LANDMARKER_SHA256);
  });

  it('uses a pinned MediaPipe Tasks Vision WASM version instead of @latest', () => {
    expect(DEFAULT_FACE_LANDMARKER_WASM_BASE_URL).toContain('@mediapipe/tasks-vision@0.10.35/wasm');
    expect(DEFAULT_FACE_LANDMARKER_WASM_BASE_URL).not.toContain('@latest');
  });
});
