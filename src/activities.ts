import { EC2Client, CreateVpcCommand, CreateSecurityGroupCommand } from "@aws-sdk/client-ec2";
import { fromEnv } from "@aws-sdk/credential-providers";

// Create vpc activity
export async function createVPC(): Promise<string> {

    const client = new EC2Client({
        region: 'us-west-2',
        credentials: fromEnv()
    });

    const vpcInput = {};
    const command = new CreateVpcCommand(vpcInput);

    try {
        await client.send(command);
        return 'SUCCESS'
    } catch (err) {
        const message = `Error creating VPC: ${err}`;
        console.error(message)
        throw Error(message);
    }
};

// Create security group
export async function createSecurityGroup(name: string, env: string): Promise<string> {

    const client = new EC2Client({
        region: 'us-west-2',
        credentials: fromEnv()
    });
    const sgInput = {
        Description: '',
        GroupName: '',
        VpcId: ''
    };
    
    const command = new CreateSecurityGroupCommand(sgInput);

    try {
        await client.send(command);
        console.log('Security Group created successfully.');
        return 'SUCCESS';
    } catch (err) {
        const message = `Error creating security group: ${err}`;
        console.error(message);
        throw Error(message);
    }
};

// create instance activity
export async function createInstance(name: string): Promise<string> {

    return `Instance: ${name} created successfully.`
};


