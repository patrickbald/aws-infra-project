import { Client } from '@temporalio/client';
import { initiateEnvironmentWorkflow } from './workflows';
import { ENVIRONMENT_TASK_QUEUE } from './config';

async function run() {
  const client = new Client(); // Temporal Client

  // create aws client ?? 

  const environment = await client.workflow.execute(initiateEnvironmentWorkflow, {
    args: [{ env: 'Dev' }],
    taskQueue: ENVIRONMENT_TASK_QUEUE,
    workflowId: 'initiate-env-1'
  });
  console.log(environment);

  // run add instance activity 

};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

