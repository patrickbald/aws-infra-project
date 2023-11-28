import { Client } from '@temporalio/client';
import { addInstanceWorkflow } from './workflows';
import { INSTANCE_TASK_QUEUE } from './config';

async function run(){
    const client = new Client();

    const instanceResult = await client.workflow.execute(addInstanceWorkflow, {
        args: [{ SecurityGroupId: 'sg-0d4865f60d66c00e0', SubnetId: 'subnet-07dd8c707fb48c30d', TargetGroupArn: 'arn:aws:elasticloadbalancing:us-west-2:506214396992:targetgroup/temporal-target-group/4b3cd7812e6c6145' }],
        taskQueue: INSTANCE_TASK_QUEUE,
        workflowId: 'add-instance'
    });
    console.log(instanceResult);
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});