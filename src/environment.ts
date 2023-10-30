import { Client } from '@temporalio/client';
import { initiateEnvironment } from './workflows';

async function run() {
  const client = new Client();

  const environment = await client.workflow.execute(initiateEnvironment, {
    args: [{ env: 'Dev' }],
    taskQueue: 'aws-infra',
    workflowId: 'initiate-env-1'
  });
  console.log(environment);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

