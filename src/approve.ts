import { Client } from '@temporalio/client';

async function approve(workflowId: string) {
  const client = new Client(); // Temporal Client

  const handle = client.workflow.getHandle(workflowId);
  await handle.signal('approveTeardown');

  await client.connection.close();
};

const workflowId = 'teardown-env';
approve(workflowId);