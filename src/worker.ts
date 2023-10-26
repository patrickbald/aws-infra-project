import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_SERVICE_URL
  });

  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    connection,
    taskQueue: 'aws-infra',
  });

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
