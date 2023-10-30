import { Client } from '@temporalio/client';
import { addInstance } from './workflows';

async function run(){
    const client = new Client();

    const instanceResult = await client.workflow.execute(addInstance, {
        args: [{ SecurityGroupId: 'sg-082633366fd1c72ce', SubnetId: 'subnet-09d566dd93a10033b', TargetGroupArn: 'arn:aws:elasticloadbalancing:us-west-2:506214396992:targetgroup/pb-temporal-target-group/e0c7266698ee5e13' }],
        taskQueue: 'aws-infra',
        workflowId: 'add-instance'
    });
    console.log(instanceResult);
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});