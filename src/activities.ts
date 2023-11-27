import { 
    EC2Client, 
    CreateVpcCommand, 
    CreateSecurityGroupCommand,
    CreateSubnetCommand,
    CreateInternetGatewayCommand,
    AttachInternetGatewayCommand,
    AuthorizeSecurityGroupIngressCommand,
    RunInstancesCommand,
    _InstanceType,
    CreateRouteCommand,
    CreateRouteTableCommand,
    AssociateRouteTableCommand,
    DescribeInstancesCommand,
    TerminateInstancesCommand
} from "@aws-sdk/client-ec2";
import {
    CreateListenerCommand,
    CreateLoadBalancerCommand, 
    CreateTargetGroupCommand, 
    ElasticLoadBalancingV2Client, 
    RegisterTargetsCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { fromEnv } from "@aws-sdk/credential-providers";
import { ApplicationFailure } from "@temporalio/workflow";
import { 
    AssociateInput,
    CreateRouteInput,
    DescribeInput,
    GatewayInput, 
    IngressInput, 
    InstanceInput, 
    ListenerInput, 
    LoadBalancerInput, 
    RegisterInput, 
    RouteInput, 
    SecurityGroupInput, 
    SubnetInput,
    TargetGroupInput,
    VPCInput
} from "./types";

export async function createVPC(env: string): Promise<string> {

    const client = new EC2Client({
        region: 'us-west-2',
        credentials: fromEnv()
    });

    const vpcParams: VPCInput = {
        CidrBlock: '172.1.0.0/16',
        DryRun: false,
        TagSpecifications: [
            {
                ResourceType: 'vpc',
                Tags: [
                    {
                        Key: 'Name',
                        Value: `Temporal-${env}`
                    }
                ]
            }
        ]
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

export async function createSecurityGroup(env: string, vpcId: string): Promise<string> {

    const client = new EC2Client({
        region: 'us-west-2',
        credentials: fromEnv()
    });
    const sgParams: SecurityGroupInput = {
        Description: `Security group for ${env}.`,
        GroupName: `temporal-sg-${env}`,
        VpcId: vpcId,
    };
    const command = new CreateSecurityGroupCommand(sgParams);

    try {
        const { GroupId } = await client.send(command);
        if (GroupId == undefined){
            throw Error('No Security Group Id');
        };

        const inboundParams: IngressInput = {
            GroupId: GroupId,
            IpPermissions: [
                {
                    FromPort: 80,
                    IpProtocol: "tcp",
                    ToPort: 80,
                    IpRanges: [
                        {
                        CidrIp: "172.1.0.0/20"
                        },
                        {
                            CidrIp: "0.0.0.0/0"
                        }
                    ]
                }
            ]
        };

        const inboundCommand = new AuthorizeSecurityGroupIngressCommand(inboundParams);
        await client.send(inboundCommand);

        return GroupId;
    } catch (err) {
        const message = `Error creating security group: ${err}`;
        throw ApplicationFailure.create({ message });
    }
};

export async function createGateway(vpcId: string, env: string): Promise<string> {
    const client = new EC2Client({
        region: 'us-west-2',
        credentials: fromEnv()
    });

    const command = new CreateInternetGatewayCommand({});

    try {
        const { InternetGateway } = await client.send(command);
        const gatewayId = InternetGateway?.InternetGatewayId;
        if (!gatewayId){
            throw Error('No Gateway Id.');
        }

        const gatewayParams: GatewayInput = {
            VpcId: vpcId,
            InternetGatewayId: gatewayId,
            TagSpecifications: [
                {
                    ResourceType: 'internet-gateway',
                    Tags: [
                        {
                            Key: 'Name',
                            Value: `temporal-ig-${env}`
                        }
                    ]
                }
            ]
        }
        const attachCommand = new AttachInternetGatewayCommand(gatewayParams);
        await client.send(attachCommand);
        return gatewayId;
    } catch (err) {
        const message = `Error creating Internet Gateway: ${err}`;
        throw ApplicationFailure.create({ message });
    }
};

export async function createRouteTable(vpcId: string): Promise<string>{
    const client = new EC2Client({
        region: 'us-west-2',
        credentials: fromEnv()
    });
    
    const routeTableParams: CreateRouteInput = {
        VpcId: vpcId,
        TagSpecifications: [{
            ResourceType: 'route-table',
            Tags: [
                {
                    Key: 'Name',
                    Value: 'temporal-route-table'
                }
            ]
        }]
    };
    const command = new CreateRouteTableCommand(routeTableParams);

    try {
        const { RouteTable } = await client.send(command);
        if (!RouteTable?.RouteTableId){
            throw Error('No Route Table Id');
        }

        return RouteTable?.RouteTableId;
    } catch (err) {
        const message = `Error creating route table: ${err}`;
        throw ApplicationFailure.create({ message });
    }
};

export async function addRoute(routeTableId: string, gatewayId: string): Promise<void>{
    const client = new EC2Client({
        region: 'us-west-2',
        credentials: fromEnv()
    });

    const routeParams: RouteInput = {
        DestinationCidrBlock: '0.0.0.0/0',
        GatewayId: gatewayId,
        RouteTableId: routeTableId
    };

    const command = new CreateRouteCommand(routeParams);

    try {
        await client.send(command);
    } catch (err) {
        const message = `Error adding route: ${err}`;
        throw ApplicationFailure.create({ message });
    }
};

export async function associateRouteTable(routeTableId: string, subnetId: string): Promise<void>{
    const client = new EC2Client({
        region: 'us-west-2',
        credentials: fromEnv()
    });

    const associateParams: AssociateInput = {
        RouteTableId: routeTableId,
        SubnetId: subnetId
    };
    const command = new AssociateRouteTableCommand(associateParams);

    try {
        await client.send(command);
    } catch (err) {
        const message = `Error associating route table to subnet: ${err}`;
        throw ApplicationFailure.create({ message });
    }
};

export async function createSubnet(vpcId: string, cidrBlock: string, az: string, tagValue: string): Promise<string> {
    const client = new EC2Client({
        region: 'us-west-2',
        credentials: fromEnv()
    });
    
    const subnetParams: SubnetInput = {
        CidrBlock: cidrBlock,
        VpcId: vpcId,
        AvailabilityZone: az,
        TagSpecifications: [
            {
                ResourceType: 'subnet',
                Tags: [
                    {
                        Key: 'Name',
                        Value: tagValue
                    }
                ]
            }
        ]
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

export async function createLoadBalancer(env: string, sgGroupId: string, subnetIds: Array<string>): Promise<string> {

    const client = new ElasticLoadBalancingV2Client({
        region: 'us-west-2',
        credentials: fromEnv()
    });

    const lbParams: LoadBalancerInput = {
        Name: `Temporal-Load-Balancer-${env}`,
        Subnets: subnetIds,
        Scheme: 'internet-facing',
        SecurityGroups: [sgGroupId],
    };
    const command = new CreateLoadBalancerCommand(lbParams);

    try {
        const res = await client.send(command);
        if (res.LoadBalancers && res.LoadBalancers[0].LoadBalancerArn){
            return res.LoadBalancers[0].LoadBalancerArn
        } else {
            throw ApplicationFailure.create({ message: 'No Load Balancer in Response' });
        }
    } catch (err) {
        const message = `Error creating load balancer: ${err}`
        throw ApplicationFailure.create({ message });
    }
};

export async function createTargetGroup(vpcId: string): Promise<string> {
    const client = new ElasticLoadBalancingV2Client({
        region: 'us-west-2',
        credentials: fromEnv()
    });
    
    const targetGroupParams: TargetGroupInput = {
        Name: 'temporal-target-group',
        Protocol: 'HTTP',
        Port: 80,
        VpcId: vpcId
    };
    const command = new CreateTargetGroupCommand(targetGroupParams);

    try {
        const targetGroupResponse = await client.send(command);
        if (targetGroupResponse.TargetGroups && targetGroupResponse.TargetGroups[0].TargetGroupArn){
            return targetGroupResponse.TargetGroups[0].TargetGroupArn
        } else {
            throw ApplicationFailure.create({ message: 'No Target Group in Response.' })
        }
    } catch (err) {
        const message = `Error creating target group: ${err}`
        throw ApplicationFailure.create({ message }); 
    }
};

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
        await client.send(command);
    } catch (err) {
        const message = `Error creating listener. ${err}`;
        throw ApplicationFailure.create({ message })
    }

}

export async function createInstance(securityGroupId: string, subnetId: string): Promise<string> {

    const client = new EC2Client({
        region: 'us-west-2',
        credentials: fromEnv() 
    });

    const instanceParams: InstanceInput = {
        ImageId: 'ami-0c103e518ca8d895d',
        InstanceType: 't2.micro',
        SecurityGroupIds: [securityGroupId],
        SubnetId: subnetId,
        MaxCount: 1,
        MinCount: 1,
        DryRun: false
    };
    const command = new RunInstancesCommand(instanceParams);
    
    try {
        const instanceResponse = await client.send(command);
        if (!instanceResponse.Instances){
            throw ApplicationFailure.create({ message: 'No instances returned.' });
        }

        return instanceResponse.Instances[0].InstanceId ?? ''
    } catch (err) {
        const message = `Error creating instance: ${err}`;
        throw ApplicationFailure.create({ message });
    }
};

export async function registerInstance(instanceId: string, targetGroup: string): Promise<void>{
    const client = new ElasticLoadBalancingV2Client({
        region: 'us-west-2',
        credentials: fromEnv()
    });
    
    const registerParams: RegisterInput = {
        TargetGroupArn: targetGroup,
        Targets: [{
            Id: instanceId
        }]
    }

    const command = new RegisterTargetsCommand(registerParams);

    try {
        await client.send(command);
    } catch (err) {
        const message = `Error registering target instance: ${err}`;
        throw ApplicationFailure.create({ message });
    }
};

export async function getInstanceState(instanceId: string): Promise<boolean>{
    const client = new EC2Client({
        region: 'us-west-2',
        credentials: fromEnv() 
    }); 
    const describeParams: DescribeInput = {
        InstanceIds: [
          instanceId
        ]
      };
    
    const command = new DescribeInstancesCommand(describeParams);

    try {
        const res = await client.send(command);

        if (!res.Reservations){
            throw ApplicationFailure.create({ message: 'No Instance Reservations' });
        }
        if (!res.Reservations[0].Instances){
            throw ApplicationFailure.create({ message: 'No instances returned in Reservation' })
        }

        return res.Reservations[0].Instances[0].State?.Name == 'running';
    } catch (err) {
        throw ApplicationFailure.create({ message: 'Failure describing instance' });
    }
};

export async function deleteInstance(instanceId: string): Promise<boolean>{

    const client = new EC2Client({
        region: 'us-west-2',
        credentials: fromEnv()
    });

    const command = new TerminateInstancesCommand({
        InstanceIds: [
            instanceId
        ]
    });

    try {
        await client.send(command);
    } catch (err) {
        const message = `Error deleting ec2 instance ${instanceId}: ${err}`;
        throw Error(message);
    }

    return true;
};

