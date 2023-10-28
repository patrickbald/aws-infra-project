import { 
    EC2Client, 
    CreateVpcCommand, 
    CreateSecurityGroupCommand,
    CreateSubnetCommand, 
} from "@aws-sdk/client-ec2";
import {
    CreateLoadBalancerCommand, CreateLoadBalancerCommandOutput, LoadBalancerSchemeEnum, Tag
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { fromEnv } from "@aws-sdk/credential-providers";
import { ApplicationFailure } from "@temporalio/workflow";

type VPCInput = {
    CidrBlock: string;
    DryRun: boolean
}

// Create vpc activity
export async function createVPC(): Promise<string> {

    const client = new EC2Client({
        region: 'us-west-2',
        credentials: fromEnv()
    });

    const vpcParams: VPCInput = {
        CidrBlock: '172.1.0.0/16',
        DryRun: false
    };
    const command = new CreateVpcCommand(vpcParams);

    try {
        const { Vpc } = await client.send(command);
        if (!Vpc?.VpcId){
            throw Error('No VPC Id');
        }
        return Vpc.VpcId;
    } catch (err) {
        const message = `Error creating VPC: ${err}`;
        console.error(message)
        throw Error(message);
    }
};

type SecurityGroupInput= {
    Description: string;
    GroupName: string;
    VpcId: string;
    DryRun: boolean
}   

// Create security group
export async function createSecurityGroup(name: string, env: string, vpcId: string): Promise<string> {

    const client = new EC2Client({
        region: 'us-west-2',
        credentials: fromEnv()
    });
    const sgParams: SecurityGroupInput = {
        Description: `Security group for ${env}.`,
        GroupName: `${name}-${env}`,
        VpcId: vpcId,
        DryRun: false
    };
    const command = new CreateSecurityGroupCommand(sgParams);

    try {
        const { GroupId } = await client.send(command);
        if (!GroupId){
            throw Error('No Security Group Id');
        }
        return GroupId;
    } catch (err) {
        const message = `Error creating security group: ${err}`;
        console.error(message);
        throw Error(message);
    }
};

type SubnetInput = {
    CidrBlock: string;
    VpcId: string;
}

export async function createSubnet(vpcId: string, cidrBlock: string): Promise<string> {
    const client = new EC2Client({
        region: 'us-west-2',
        credentials: fromEnv()
    });
    
    const subnetParams: SubnetInput = {
        CidrBlock: "",
        VpcId: vpcId
    };
    const command = new CreateSubnetCommand(subnetParams);

    try {
        const { Subnet } = await client.send(command);
        if (!Subnet?.SubnetId){
            throw Error('No Subnet Id.');
        }
        return Subnet.SubnetId;
    } catch (err) {
        const message = `Error creating subnet: ${err}`;
        console.error(message);
        throw Error(message);
    }
};

type LoadBalancerInput = {
    Name: string;
    Subnets: Array<string>;
    Scheme: LoadBalancerSchemeEnum;
    SecurityGroups: Array<string>;
};

export async function createLoadBalancer(sgGroupId: string, subnetIds: Array<string>): Promise<string> {

    const client = new EC2Client({
        region: 'us-west-2',
        credentials: fromEnv()
    });

    const lbParams: LoadBalancerInput = {
        Name: 'PB-Load-Balancer',
        Subnets: subnetIds,
        Scheme: 'internet-facing',
        SecurityGroups: [sgGroupId],
    };
    const command = new CreateLoadBalancerCommand(lbParams);

    try {
        const res = await client.send(command);
        if (res.LoadBalancers){
            return res.LoadBalancers[0].LoadBalancerArn ?? ''
        } else {
            throw Error('No Load Balancer Arn');
        }
    } catch (err) {
        const message = `Error creating load balancer: ${err}`
        throw ApplicationFailure.create({ message });
    }
};

// create instance activity
export async function createInstance(name: string): Promise<string> {

    return `Instance: ${name} created successfully.`
};


