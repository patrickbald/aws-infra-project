import { Client } from '@temporalio/client';
import { infraSetup, addInstance } from './workflows';

async function run() {
  const client = new Client();

  const setupResult = await client.workflow.execute(infraSetup, { taskQueue: 'aws-infra', workflowId: '' });

  
  
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
