import { Client } from '@temporalio/client';
import { initiateEnvironmentWorkflow } from './workflows';
import { ENVIRONMENT_TASK_QUEUE } from './config';
import { uuid4 } from '@temporalio/workflow';

async function run() {
  const client = new Client(); // Temporal Client

  const environment = await client.workflow.execute(initiateEnvironmentWorkflow, {
    args: [{ env: 'Dev' }],
    taskQueue: ENVIRONMENT_TASK_QUEUE,
    workflowId: `initiate-env`,
    workflowExecutionTimeout: '1 hour'
  });
  console.log(environment);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

