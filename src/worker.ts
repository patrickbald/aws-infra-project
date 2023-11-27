import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities';
import { ENVIRONMENT_TASK_QUEUE, getConfig } from './config';

async function run() {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_SERVICE_URL
  });

  const configObj = getConfig();

  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    connection,
    namespace: configObj.namespace,
    taskQueue: ENVIRONMENT_TASK_QUEUE,
  });

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
