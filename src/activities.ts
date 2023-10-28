import { 
    EC2Client, 
    CreateVpcCommand, 
    CreateSecurityGroupCommand,
    CreateSubnetCommand, 
} from "@aws-sdk/client-ec2";
import {
    Action,
    ActionTypeEnum,
    CreateListenerCommand,
    CreateLoadBalancerCommand, CreateLoadBalancerCommandOutput, CreateTargetGroupCommand, ElasticLoadBalancingV2Client, LoadBalancerSchemeEnum, ProtocolEnum, Tag
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
        throw ApplicationFailure.create({ message });
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
        throw ApplicationFailure.create({ message });
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
        CidrBlock: cidrBlock,
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
        throw ApplicationFailure.create({ message });
    }
};

type LoadBalancerInput = {
    Name: string;
    Subnets: Array<string>;
    Scheme: LoadBalancerSchemeEnum;
    SecurityGroups: Array<string>;
};

export async function createLoadBalancer(sgGroupId: string, subnetIds: Array<string>): Promise<string> {

    const client = new ElasticLoadBalancingV2Client({
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
            throw Error('No Load Balancer in Response');
        }
    } catch (err) {
        const message = `Error creating load balancer: ${err}`
        throw ApplicationFailure.create({ message });
    }
};

type TargetGroupInput = {
    Name: string;
    Protocol: ProtocolEnum;
    Port: number;
    VpcId: string;
}

export async function createTargetGroup(vpcId: string): Promise<string> {
    const client = new ElasticLoadBalancingV2Client({
        region: 'us-west-2',
        credentials: fromEnv()
    });
    
    const targetGroupParams: TargetGroupInput = {
        Name: 'pb-temporal-target-group',
        Protocol: 'HTTP',
        Port: 80,
        VpcId: vpcId
    };
    const command = new CreateTargetGroupCommand(targetGroupParams);

    try {
        const targetGroupResponse = await client.send(command);
        if (targetGroupResponse.TargetGroups){
            return targetGroupResponse.TargetGroups[0].TargetGroupArn ?? ''
        } else {
            throw Error('No Target Group in Response.')
        }
    } catch (err) {
        const message = `Error creating target group: ${err}`
        throw ApplicationFailure.create({ message }); 
    }
};

type ListenerInput = {
    LoadBalancerArn: string;
    Port: number;
    Protocol: ProtocolEnum;
    DefaultActions: Array<Action>;
}

export async function createListener(loadBalancerArn: string, targetGroupArn: string): Promise<void>{
    const client = new ElasticLoadBalancingV2Client({
        region: 'us-west-2',
        credentials: fromEnv()
    });

    const listenerParams:ListenerInput = {
        LoadBalancerArn: loadBalancerArn,
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: [
            {
                Type: 'forward',
                TargetGroupArn: targetGroupArn
            }
        ]
    };
    const command = new CreateListenerCommand(listenerParams);

    try {
        const listenersResponse = await client.send(command);
    } catch (err) {
        const message = `Error creating listener. ${err}`;
        throw ApplicationFailure.create({ message })
    }

}

// create instance activity
export async function createInstance(name: string): Promise<string> {

    return `Instance: ${name} created successfully.`
};


