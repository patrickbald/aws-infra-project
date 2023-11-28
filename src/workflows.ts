import { 
  ApplicationFailure, 
  proxyActivities, 
  sleep, 
  workflowInfo, 
  log, 
  Trigger,
  setHandler,
  defineSignal} from "@temporalio/workflow";
import { EnvArgs, EnvOutput, InstanceArgs, TeardownArgs } from "./types";
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
  associateRouteTable,
  getInstanceState,
  deleteInstance
} = proxyActivities<typeof activities>({
  retry: {
    maximumAttempts: 1,
  },
  startToCloseTimeout: '1 minute'
});

// Workflow to create VPC and networking infrastructure
export async function initiateEnvironmentWorkflow(args: EnvArgs): Promise<EnvOutput> {

  log.info(`Initiate Environment invoked`, { env: args.env });

  if (!args.env){
    throw ApplicationFailure.create({ message: `VPC workflows missing parameters.`});
  };

  const vpcId = await createVPC(args.env);

  let subnetPromises:Array<Promise<string>> = [];
  for (let subnet of CIDRBlocks){
    subnetPromises.push(createSubnet(vpcId, subnet.Subnet, subnet.Az, subnet.Tag));
  };
  const subnets = await Promise.all(subnetPromises).catch((err) => {
    throw ApplicationFailure.create({ message: `Failed creating subnets: ${err}`});
  });

  const gatewayId = await createGateway(vpcId, args.env);

  const routeTableId = await createRouteTable(vpcId);

  await addRoute(routeTableId, gatewayId);

  let associateSubnetPromises: Array<Promise<void>> = [];
  for (let subnet of subnets.slice(0,2)){
      associateSubnetPromises.push(associateRouteTable(routeTableId, subnet));
  }
  await Promise.all(associateSubnetPromises).catch((err) => {
    throw ApplicationFailure.create({ message: `Failure associating subnets with route table: ${err}`});
  })

  const securityGroupId = await createSecurityGroup(args.env, vpcId);

  const loadBalancerArn = await createLoadBalancer(args.env, securityGroupId, subnets.slice(0,2));

  const targetGroupArn = await createTargetGroup(vpcId);

  await createListener(loadBalancerArn, targetGroupArn);

  log.info('Environment setup complete.', { });

  return {
    VpcId: vpcId,
    LoadBalancerArn: loadBalancerArn,
    SecurityGroup: securityGroupId,
    SubnetIds: subnets,
    TargetGroupArn: targetGroupArn
  }
};

// Workflow to add an instance to infrastructure
export async function addInstanceWorkflow(args: InstanceArgs): Promise<string> {

  const instanceId = await createInstance(args.SecurityGroupId, args.SubnetId);
  let created = false;

  while (!created){
    await sleep('10 seconds');
    created = await getInstanceState(instanceId);
  };

  await registerInstance(instanceId, args.TargetGroupArn);
  
  return `Instance successfully created: ${instanceId}`;
};

// New additions: teardown workflow with signal from approve script

export const approveTeardownSignal = defineSignal('approveTeardown');

export async function teardownWorkflow(args: TeardownArgs): Promise<string> {
  
  const { workflowId } = workflowInfo();
  log.info(`Teardown workflow Id: ${workflowId}`, {});

  const isApproved = new Trigger<boolean>();
  setHandler(approveTeardownSignal, () => isApproved.resolve(true));
  const approvalTime = '1 minute';

  const userApproved = await Promise.race([
    isApproved,
    sleep(approvalTime),
  ]);

  if (!userApproved){
    throw new ApplicationFailure(`Teardown not approved within ${approvalTime}`);
  };

  // Go ahead with teardown ...
  await deleteInstance(args.instanceId);

  return 'Environment teardown successful';
};


