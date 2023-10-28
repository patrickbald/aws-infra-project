import { Client } from '@temporalio/client';
import { addInstance } from './workflows';

async function run(){
    const client = new Client();

    const instanceResult = await client.workflow.execute(addInstance, {
        args: [{ name: 'instance-1'}],
        taskQueue: 'aws-infra',
        workflowId: 'add-instance'
    });
    console.log(instanceResult);
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});