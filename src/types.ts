import { IpPermission, _InstanceType } from "@aws-sdk/client-ec2";
import { Action, LoadBalancerSchemeEnum, ProtocolEnum, TargetDescription } from "@aws-sdk/client-elastic-load-balancing-v2";

type EnvArgs = {
    env: string
  };
  
  type EnvOutput = {
    VpcId: string;
    LoadBalancerArn: string;
    SecurityGroup: string;
    SubnetIds: Array<string>;
    TargetGroupArn: string;
  };

type VPCInput = {
    CidrBlock: string;
    DryRun: boolean
}

type SecurityGroupInput = {
    Description: string;
    GroupName: string;
    VpcId: string;
};

type IngressInput = {
    GroupId: string;
    IpPermissions: Array<IpPermission>
};

type GatewayInput = {
    VpcId: string;
    InternetGatewayId: string;
};

type SubnetInput = {
    CidrBlock: string;
    VpcId: string;
    AvailabilityZone: string;
};

type LoadBalancerInput = {
    Name: string;
    Subnets: Array<string>;
    Scheme: LoadBalancerSchemeEnum;
    SecurityGroups: Array<string>;
};

type TargetGroupInput = {
    Name: string;
    Protocol: ProtocolEnum;
    Port: number;
    VpcId: string;
};

type ListenerInput = {
    LoadBalancerArn: string;
    Port: number;
    Protocol: ProtocolEnum;
    DefaultActions: Array<Action>;
};

type InstanceInput = {
    ImageId: string;
    InstanceType: _InstanceType;
    SecurityGroupIds: Array<string>;
    SubnetId: string;
    MaxCount: number;
    MinCount: number;
    DryRun: boolean;
};

type RegisterInput = {
    TargetGroupArn: string;
    Targets: Array<TargetDescription>;
};

type RouteInput = {
    DestinationCidrBlock: string;
    GatewayId: string;
    RouteTableId: string;
};

type CreateRouteInput = {
    VpcId: string;
};

type AssociateInput = {
    RouteTableId: string;
    SubnetId: string;
};

type InstanceArgs = {
    SecurityGroupId: string;
    SubnetId: string
    TargetGroupArn: string;
  };

export {
    VPCInput,
    SecurityGroupInput,
    IngressInput,
    GatewayInput,
    SubnetInput,
    LoadBalancerInput,
    TargetGroupInput,
    ListenerInput,
    InstanceInput,
    RegisterInput,
    RouteInput,
    CreateRouteInput,
    AssociateInput,
    EnvArgs, 
    EnvOutput,
    InstanceArgs
};