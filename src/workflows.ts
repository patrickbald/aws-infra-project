import { ApplicationFailure, 
  proxyActivities, sleep, workflowInfo, log } from "@temporalio/workflow";
import { EnvArgs, EnvOutput, InstanceArgs, SubnetAZ } from "./types";

import type * as activities from './activities';
import { CIDRBlocks } from "./config";
const {
  createVPC,
  createSecurityGroup,
  createLoadBalancer,
  createListener, 
  createSubnet,
  createTargetGroup,
  createGateway,
  createInstance,
  registerInstance,
  createRouteTable,
  addRoute,
  associateRouteTable
} = proxyActivities<typeof activities>({
  retry: {
    initialInterval: '1 second',
    backoffCoefficient: 2,
    maximumAttempts: 1,
  },
  startToCloseTimeout: '1 minute'
});

// Workflow
export async function initiateEnvironmentWorkflow(args: EnvArgs): Promise<EnvOutput> {

  log.info(`Initiate Environment invoked`, { env: args.env });

  if (!args.env){
    throw ApplicationFailure.create({ message: `VPC workflows missing parameters.`});
  };

  const vpcId = await createVPC(args.env);
  log.debug(`VPC created successfully.`, { vpcid: vpcId });

  let subnetIds:Array<string> = [];
  // TODO can we do promise.all instead of awaiting each subnet response
  for (let subnet of CIDRBlocks){
    subnetIds.push(await createSubnet(vpcId, subnet.Subnet, subnet.Az, subnet.Tag)); // remove await
  };

  log.debug(`Subnets created successfully`, { subnets: subnetIds });

  // promise.all

  const gatewayId = await createGateway(vpcId, args.env);
  const routeTableId = await createRouteTable(vpcId);
  await addRoute(routeTableId, gatewayId);

  // TODO can we do this with promise.all instead of awaiting each one
  for (let subnet of subnetIds.slice(0,2)){
      await associateRouteTable(routeTableId, subnet);
  }

  const securityGroupId = await createSecurityGroup(args.env, vpcId);

  const loadBalancerArn = await createLoadBalancer(args.env, securityGroupId, subnetIds.slice(0, 2));

  const targetGroupArn = await createTargetGroup(vpcId);
  if (targetGroupArn === ''){
    const message = 'No Target Group Arn';
    throw ApplicationFailure.create({ message });
  }

  await createListener(loadBalancerArn, targetGroupArn);

  log.info('Environment setup complete.', { });

  return {
    VpcId: vpcId,
    LoadBalancerArn: loadBalancerArn,
    SecurityGroup: securityGroupId,
    SubnetIds: subnetIds,
    TargetGroupArn: targetGroupArn
  }
};

// Workflow to add an instance to infrastructure
export async function addInstanceWorkflow(args: InstanceArgs): Promise<string> {

  const instanceId = await createInstance(args.SecurityGroupId, args.SubnetId);

  // TODO instead of sleeping, poll for instance creation 
  await sleep('1 minute');

  await registerInstance(instanceId, args.TargetGroupArn);
  
  return `Instance successfully created: ${instanceId}`;
};


