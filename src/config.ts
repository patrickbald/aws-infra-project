import { SubnetAZ } from "./types";

export interface ConfigObj {
  namespace: string
}

export function getConfig(): ConfigObj {
  return {
    namespace: 'default'
  }
}

export const ENVIRONMENT_TASK_QUEUE = 'aws-infra';
export const INSTANCE_TASK_QUEUE = ENVIRONMENT_TASK_QUEUE;
export const TEARDOWN_TASK_QUEUE = ENVIRONMENT_TASK_QUEUE;

export const CIDRBlocks:Array<SubnetAZ> = [
    {Subnet: '172.1.0.0/20', Az: 'us-west-2a', Tag: 'us-west-2a-public'}, 
    {Subnet: '172.1.16.0/20', Az: 'us-west-2b', Tag: 'us-west-2b-public'}, 
    {Subnet: '172.1.128.0/20', Az: 'us-west-2a', Tag: 'us-west-2a-private'},
    {Subnet: '172.1.144.0/20', Az: 'us-west-2b', Tag: 'us-west-2b-private'}
  ];