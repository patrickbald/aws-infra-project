import { ApplicationFailure, proxyActivities, sleep, uuid4 } from "@temporalio/workflow";
import type * as activities from './activities';
import { EC2Client } from "@aws-sdk/client-ec2";

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
    maximumAttempts: 3,
  },
  startToCloseTimeout: '1 minute'
});

type EnvArgs = {
  sgName: string;
  env: string
}

type EnvOutput = {
  VpcId: string;
  LoadBalancerArn: string;
  SecurityGroup: string;
  SubnetIds: Array<string>;
  TargetGroupArn: string;
}

// Workflow
export async function initiateEnvironment(args: EnvArgs): Promise<EnvOutput> {

  if (!args.env || !args.sgName){
    throw ApplicationFailure.create({ message: `VPC workflows missing parameters.`});
  }

  // Business Logic
  console.log(`Initiating environment: ${args.env}`)

  const vpcId = await createVPC();

  type SubnetAZ = {
      Subnet: string;
      Az: string;
      Tag: string;
  };

  const cidrBlocks:Array<SubnetAZ> = [
    {Subnet: '172.1.0.0/20', Az: 'us-west-2a', Tag: 'us-west-2a-public'}, 
    {Subnet: '172.1.16.0/20', Az: 'us-west-2b', Tag: 'us-west-2b-public'}, 
    {Subnet: '172.1.128.0/20', Az: 'us-west-2a', Tag: 'us-west-2a-private'},
    {Subnet: '172.1.144.0/20', Az: 'us-west-2b', Tag: 'us-west-2b-private'}
  ];
  let subnetIds:Array<string> = [];
  for (let subnet of cidrBlocks){
    subnetIds.push(await createSubnet(vpcId, subnet.Subnet, subnet.Az, subnet.Tag));
  }

  const gatewayId = await createGateway(vpcId);

  const routeTableId = await createRouteTable(vpcId);
  await addRoute(routeTableId, gatewayId);

  for (let subnet of subnetIds){
    await associateRouteTable(routeTableId, subnet);
  }

  const sgName = `pb-temporal-1`;
  const securityGroupId = await createSecurityGroup(args.env, sgName, vpcId);

  const loadBalancerArn = await createLoadBalancer(securityGroupId, subnetIds.slice(0, 2));
  if (loadBalancerArn == ''){
    const message = 'No Load Balancer Arn';
    throw ApplicationFailure.create({ message });
  }

  const targetGroupArn = await createTargetGroup(vpcId);
  if (targetGroupArn === ''){
    const message = 'No Target Group Arn';
    throw ApplicationFailure.create({ message })
  }

  await createListener(loadBalancerArn, targetGroupArn);

  console.log('Environment setup complete.')

  return {
    VpcId: vpcId,
    LoadBalancerArn: loadBalancerArn,
    SecurityGroup: securityGroupId,
    SubnetIds: subnetIds,
    TargetGroupArn: targetGroupArn
  }
};

type InstanceArgs = {
  SecurityGroupId: string;
  SubnetId: string
  TargetGroupArn: string;
};

// Workflow to add an instance to infrastructure
export async function addInstance(args: InstanceArgs): Promise<string> {

  const instanceId = await createInstance(args.SecurityGroupId, args.SubnetId);
  console.log(`Instance ID: ${instanceId}`);

  await sleep('1 minute');

  await registerInstance(instanceId, args.TargetGroupArn);
  
  return `Instance: successfully created.`;
};


