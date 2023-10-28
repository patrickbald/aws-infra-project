import { ApplicationFailure, proxyActivities, uuid4 } from "@temporalio/workflow";
import type * as activities from './activities';
import { env } from "process";

const {
  createVPC,
  createSecurityGroup,
  createLoadBalancer,
  createListener, 
  createSubnet,
  createTargetGroup,
  createInstance
} = proxyActivities<typeof activities>({
  retry: {
    initialInterval: '1 second',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
  startToCloseTimeout: '1 minute'
});

type EnvArgs = {
  sgName: string;
  env: string
}

// Workflow
export async function initiateEnvironment(args: EnvArgs): Promise<string> {

  if (!args.env || !args.sgName){
    throw ApplicationFailure.create({ message: `VPC workflows missing parameters.`});
  }

  // Business Logic
  console.log(`Initiating environment: ${env}`)

  const vpcId = await createVPC();

  const securityGroupId = await createSecurityGroup(args.env, args.sgName, vpcId);

  const cidrBlocks:Array<string> = ['172.1.32.0/16',  '172.1.64.0/16'];
  let subnetIds:Array<string> = [];
  for (let cidr of cidrBlocks){
    subnetIds.push(await createSubnet(vpcId, cidr));
  }

  const loadBalancerArn = await createLoadBalancer(securityGroupId, subnetIds);
  if (loadBalancerArn == ''){
    const message = 'No Load Balancer Dns';
    throw ApplicationFailure.create({ message });
  }

  const targetGroupArn = await createTargetGroup(vpcId);
  if (targetGroupArn === ''){
    const message = 'No Target Group Arn';
    throw ApplicationFailure.create({ message })
  }

  await createListener(loadBalancerArn, targetGroupArn);

  console.log('Environment setup complete.')

  return vpcId;
};

type InstanceArgs = {
  name: string
};

// Workflow to add an instance to infrastructure
export async function addInstance(args: InstanceArgs): Promise<string> {
  
  return `Instance: successfully created.`;
};

// Workflow to remove instance from environment
export async function removeInstance(): Promise<string> {

  return 'Instance successfully removed.';
}


