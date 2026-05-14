import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(projectRoot, 'public', 'models');
const outFile = path.join(outDir, 'edge-local-report.onnx');
const metaFile = path.join(outDir, 'edge-local-report.meta.json');

// Keep this list synchronized with EDGE_LOCAL_MODEL_FEATURE_ORDER in
// src/telemetry/model/edgeLocalModelContract.js. The artifact test verifies it.
const modelName = 'edge-local-report';
const modelVersion = '2026-05-14.contract-v1';
const contractVersion = '1.0.0';
const calibrationStatus = 'baseline_not_validated';
const modelSizeMb = 0.018;
const featureOrder = [
  'completedGameCount',
  'meanScore',
  'totalTrialEvents',
  'meanReactionTimeMs',
  'meanAccuracyProxy',
  'meanDurationSec',
  'meanCursorVelocity',
  'totalHesitationCount',
  'meanFacialCoverage',
  'meanWebcamSignalQuality',
  'meanFacialConfidence',
  'meanBlinkRatePerMin',
  'meanVisualStability',
  'meanOffScreenOrFaceAwayPercent',
  'meanHeadPoseVariability',
  'meanMicroGestureActivity',
  'meanAttentionStabilityProxy',
  'meanCognitiveLoadProxy',
  'meanFatigueProxy',
];
const allowedSignalGroups = [
  'game_results',
  'trial_timing_accuracy',
  'cursor_interaction_aggregates',
  'facial_signal_quality_aggregates',
  'microgesture_aggregate_blendshape_groups',
  'model_quality_flags',
];
const prohibitedClaims = [
  'lie_detection',
  'true_emotion_detection',
  'personality_inference',
  'mental_health_diagnosis',
  'innate_intelligence_claim',
  'automatic_hiring_decision',
];

// Tiny baseline linear model over aggregate metadata. It is intentionally marked
// baseline_not_validated and must not be presented as a validated hiring model.
const weightsByFeature = {
  completedGameCount: 0.04,
  meanScore: 0.015,
  totalTrialEvents: 0.001,
  meanReactionTimeMs: -0.0004,
  meanAccuracyProxy: 0.006,
  meanDurationSec: -0.003,
  meanCursorVelocity: 0.0008,
  totalHesitationCount: -0.015,
  meanFacialCoverage: 0.004,
  meanWebcamSignalQuality: 0.005,
  meanFacialConfidence: 0.004,
  meanBlinkRatePerMin: 0.001,
  meanVisualStability: 0.003,
  meanOffScreenOrFaceAwayPercent: -0.004,
  meanHeadPoseVariability: -0.02,
  meanMicroGestureActivity: 0.001,
  meanAttentionStabilityProxy: 0.003,
  meanCognitiveLoadProxy: -0.001,
  meanFatigueProxy: -0.002,
};

async function main() {
  const pkg = await import('onnx-proto');
  const onnx = (pkg.default || pkg['module.exports']).onnx;

  await mkdir(outDir, { recursive: true });

  const FLOAT = onnx.TensorProto.DataType.FLOAT;

  const weights = onnx.TensorProto.create({
    name: 'weights',
    dims: [featureOrder.length, 1],
    dataType: FLOAT,
    floatData: featureOrder.map((featureName) => weightsByFeature[featureName]),
  });

  const bias = onnx.TensorProto.create({
    name: 'bias',
    dims: [1],
    dataType: FLOAT,
    floatData: [-2.2],
  });

  const inputType = onnx.TypeProto.create({
    tensorType: onnx.TypeProto.Tensor.create({
      elemType: FLOAT,
      shape: onnx.TensorShapeProto.create({
        dim: [
          onnx.TensorShapeProto.Dimension.create({ dimValue: 1 }),
          onnx.TensorShapeProto.Dimension.create({ dimValue: featureOrder.length }),
        ],
      }),
    }),
  });

  const outputType = onnx.TypeProto.create({
    tensorType: onnx.TypeProto.Tensor.create({
      elemType: FLOAT,
      shape: onnx.TensorShapeProto.create({
        dim: [
          onnx.TensorShapeProto.Dimension.create({ dimValue: 1 }),
          onnx.TensorShapeProto.Dimension.create({ dimValue: 1 }),
        ],
      }),
    }),
  });

  const graph = onnx.GraphProto.create({
    name: 'edge_local_report_graph',
    node: [
      onnx.NodeProto.create({
        name: 'linear_matmul',
        opType: 'MatMul',
        input: ['features', 'weights'],
        output: ['linear_raw'],
      }),
      onnx.NodeProto.create({
        name: 'linear_bias',
        opType: 'Add',
        input: ['linear_raw', 'bias'],
        output: ['linear_biased'],
      }),
      onnx.NodeProto.create({
        name: 'score_sigmoid',
        opType: 'Sigmoid',
        input: ['linear_biased'],
        output: ['score'],
      }),
    ],
    initializer: [weights, bias],
    input: [
      onnx.ValueInfoProto.create({
        name: 'features',
        type: inputType,
      }),
    ],
    output: [
      onnx.ValueInfoProto.create({
        name: 'score',
        type: outputType,
      }),
    ],
  });

  const model = onnx.ModelProto.create({
    irVersion: onnx.Version.IR_VERSION,
    opsetImport: [
      onnx.OperatorSetIdProto.create({
        domain: '',
        version: 13,
      }),
    ],
    producerName: 'krumm-talent-assessment',
    producerVersion: modelVersion,
    domain: 'krumm.local',
    modelVersion: 2,
    docString: 'Edge-local metadata-only baseline report model for browser worker inference.',
    graph,
  });

  const encoded = onnx.ModelProto.encode(model).finish();
  await writeFile(outFile, Buffer.from(encoded));

  await writeFile(
    metaFile,
    JSON.stringify(
      {
        name: modelName,
        runtimeModelVersion: modelVersion,
        modelSizeMb,
        runtimeFeatureOrder: featureOrder,
        featureOrder,
        inputShape: [1, featureOrder.length],
        outputShape: [1, 1],
        description: 'Tiny baseline ONNX model used by the browser worker for metadata-only local report inference. It consumes aggregate features only and is not a validated hiring predictor.',
        contractVersion,
        contractFeatureOrder: featureOrder,
        calibrationStatus,
        privacy: {
          source: 'aggregate_metadata_only',
          rawVideoStored: false,
          rawFramesStored: false,
          landmarksStored: false,
          audioCaptured: false,
        },
        allowedSignalGroups,
        prohibitedClaims,
      },
      null,
      2
    )
  );

  console.log(`[model:build] wrote ${path.relative(projectRoot, outFile)}`);
  console.log(`[model:build] wrote ${path.relative(projectRoot, metaFile)}`);
}

main().catch((error) => {
  console.error('[model:build] failed', error);
  process.exitCode = 1;
});
