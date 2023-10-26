import { proxyActivities, uuid4 } from "@temporalio/workflow";
import type * as activities from './activities';

const {
  createVPC,
  createSecurityGroup,
  createInstance
} = proxyActivities<typeof activities>({
  retry: {
    initialInterval: '50 milliseconds',
    maximumAttempts: 2,
  },
  startToCloseTimeout: '30 seconds'
});

// Workflows
export async function infraSetup(): Promise<string> {

  console.log('Starting infrastructure setup...');
  const vpcResult = await createVPC();

  if (vpcResult === 'SUCCESS'){
    console.log('VPC created successfully.')
    console.log('Starting security group activity...')

    const sgName = `PB-Temporal-SG-${uuid4()}`;
    const env = 'Dev';

    const sgResult = await createSecurityGroup(sgName, env);
    console.log(sgResult);

    return 'Infrastructure set up complete.';
  } else {
    const message = 'Infrastructure setup failed';
    console.error(message);
    return message;
  }
};

// Workflow to add an instance to infrastructure
export async function addInstance(instanceName: string): Promise<string> {
  
  return `Instance: successfully created.`;
};

// Workflow to return current state of my infrastructure
export async function getInfraState(): Promise<string> {

  return 'Infra state: ';
}

