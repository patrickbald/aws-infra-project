import { Client } from '@temporalio/client';
import { infraSetup, addInstance } from './workflows';

async function run() {
  const client = new Client();

  const infraSetupResult = await client.workflow.execute(infraSetup, {
    args: [],
    taskQueue: 'aws-infra',
    workflowId: 'infa-setup-1' // Does this need to be unique?
  });
  console.log(infraSetupResult);

  const ec2Result = await client.workflow.execute(addInstance, {
    args: [`pb-instance-1`],
    taskQueue: 'aws-infra',
    workflowId: 'add-ec2-instance'
  });
  console.log(ec2Result);

};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

