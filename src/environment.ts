import { Client } from '@temporalio/client';
import { initiateEnvironment } from './workflows';

async function run() {
  const client = new Client();

  const environment = await client.workflow.execute(initiateEnvironment, { // Start vs Execute?
    args: [{ sgName: 'pb-temporal-1', env: 'Dev' }],
    taskQueue: 'aws-infra',
    workflowId: 'initiate-env-1' // Does this need to be unique?
  });
  console.log(environment);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

