import { Client } from '@temporalio/client';
import { teardownWorkflow } from './workflows';
import { TEARDOWN_TASK_QUEUE } from './config';

async function teardown() {
  const client = new Client();

  await client.workflow.start(teardownWorkflow, {
    args: [{ instanceId: '' }],
    taskQueue: TEARDOWN_TASK_QUEUE,
    workflowId: 'teardown-env',
    workflowExecutionTimeout: '1 hour'
  });

  await client.connection.close();
};

teardown().catch((err) => {
  console.error(err);
  process.exit(1);
});