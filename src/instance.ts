import { Client } from '@temporalio/client';
import { addInstance } from './workflows';

async function run(){
    const client = new Client();

    const instanceResult = await client.workflow.execute(addInstance, {
        args: [{ SecurityGroupId: 'sg-0fc61e9d02f1845c9', SubnetId: 'subnet-0f5f92d75f7870948', TargetGroupArn: 'arn:aws:elasticloadbalancing:us-west-2:506214396992:targetgroup/pb-temporal-target-group/20515ee816fa66f6' }],
        taskQueue: 'aws-infra',
        workflowId: 'add-instance'
    });
    console.log(instanceResult);
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});