import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';
import {
  EDGE_LOCAL_MODEL_FEATURE_ORDER,
  EDGE_LOCAL_MODEL_NAME,
  EDGE_LOCAL_MODEL_VERSION,
  EDGE_LOCAL_CALIBRATION_STATUS,
} from './edgeLocalModelContract';

const modelDir = path.resolve(process.cwd(), 'public', 'models');
const metaPath = path.join(modelDir, 'edge-local-report.meta.json');
const onnxPath = path.join(modelDir, 'edge-local-report.onnx');

const toNumber = (value) => Number(value?.toString ? value.toString() : value);
const getShape = (valueInfo) => valueInfo.type.tensorType.shape.dim.map((dim) => toNumber(dim.dimValue));

describe('edge-local model runtime artifact', () => {
  it('is rebuilt against the metadata-only contract feature order', async () => {
    const meta = JSON.parse(await readFile(metaPath, 'utf8'));

    expect(meta.name).toBe(EDGE_LOCAL_MODEL_NAME);
    expect(meta.runtimeModelVersion).toBe(EDGE_LOCAL_MODEL_VERSION);
    expect(meta.calibrationStatus).toBe(EDGE_LOCAL_CALIBRATION_STATUS);
    expect(meta.runtimeFeatureOrder).toEqual(EDGE_LOCAL_MODEL_FEATURE_ORDER);
    expect(meta.contractFeatureOrder).toEqual(EDGE_LOCAL_MODEL_FEATURE_ORDER);
    expect(meta.inputShape).toEqual([1, EDGE_LOCAL_MODEL_FEATURE_ORDER.length]);
    expect(meta.outputShape).toEqual([1, 1]);
    expect(meta.privacy).toMatchObject({
      source: 'aggregate_metadata_only',
      rawVideoStored: false,
      rawFramesStored: false,
      landmarksStored: false,
      audioCaptured: false,
    });

    const pkg = await import('onnx-proto');
    const onnx = (pkg.default || pkg['module.exports']).onnx;
    const encoded = await readFile(onnxPath);
    const model = onnx.ModelProto.decode(encoded);

    expect(model.graph.name).toBe('edge_local_report_graph');
    expect(getShape(model.graph.input[0])).toEqual([1, EDGE_LOCAL_MODEL_FEATURE_ORDER.length]);
    expect(getShape(model.graph.output[0])).toEqual([1, 1]);

    const weights = model.graph.initializer.find((tensor) => tensor.name === 'weights');
    expect(weights).toBeDefined();
    expect(weights.dims.map(toNumber)).toEqual([EDGE_LOCAL_MODEL_FEATURE_ORDER.length, 1]);
  });
});
