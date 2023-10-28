import { ApplicationFailure, proxyActivities, uuid4 } from "@temporalio/workflow";
import type * as activities from './activities';
import { createSubnet } from "./activities";

const {
  createVPC,
  createSecurityGroup,
  createLoadBalancer,
  createInstance
} = proxyActivities<typeof activities>({
  retry: {
    initialInterval: '1 second',
    maximumAttempts: 3,
  },
  startToCloseTimeout: '30 seconds'
});

type EnvArgs = {
  sgName: string;
  env: string
}

// Workflows
export async function initiateEnvironment(args: EnvArgs): Promise<string> {

  if (!args.env || !args.sgName){
    throw ApplicationFailure.create({ message: `VPC workflows missing parameters.`});
  }

  // Business Logic
  const vpcId = await createVPC();
  if (vpcId == ''){
    const message = `Failed to set up VPC for ${args.env}`;
    throw ApplicationFailure.create({ message });
  }

  const securityGroupId = await createSecurityGroup(args.env, args.sgName, vpcId);
  if (securityGroupId == ''){
    const message = `Failed to create security group for ${args.env}`;
    throw ApplicationFailure.create({ message });
  }

  const cidrBlocks: Array<string> = [];
  let subnetIds = [];
  for (let cidr of cidrBlocks){
    subnetIds.push(await createSubnet(vpcId, cidr));
  }


  const loadBalanccerArn = await createLoadBalancer(securityGroupId, subnetIds);

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


