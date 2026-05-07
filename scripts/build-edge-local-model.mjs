import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(projectRoot, 'public', 'models');
const outFile = path.join(outDir, 'edge-local-report.onnx');
const metaFile = path.join(outDir, 'edge-local-report.meta.json');
const featureOrder = [
  'avgScore',
  'meanDuration',
  'meanConfidence',
  'readinessMean',
  'telemetryCoverage',
  'stabilityScore',
  'numGames',
];

async function main() {
  const pkg = await import('onnx-proto');
  const onnx = (pkg.default || pkg['module.exports']).onnx;

  await mkdir(outDir, { recursive: true });

  const FLOAT = onnx.TensorProto.DataType.FLOAT;

  const weights = onnx.TensorProto.create({
    name: 'weights',
    dims: [featureOrder.length, 1],
    dataType: FLOAT,
    floatData: [
      0.24,
      -0.02,
      0.18,
      0.12,
      0.16,
      0.10,
      0.06,
    ],
  });

  const bias = onnx.TensorProto.create({
    name: 'bias',
    dims: [1],
    dataType: FLOAT,
    floatData: [-1.15],
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
    producerVersion: '1.0.0',
    domain: 'krumm.local',
    modelVersion: 1,
    docString: 'Edge-local report model for demo inference.',
    graph,
  });

  const encoded = onnx.ModelProto.encode(model).finish();
  await writeFile(outFile, Buffer.from(encoded));

  await writeFile(
    metaFile,
    JSON.stringify(
      {
        name: 'edge-local-report',
        featureOrder,
        inputShape: [1, featureOrder.length],
        outputShape: [1, 1],
        description: 'Tiny linear ONNX model used by the browser worker for demo report inference.',
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
