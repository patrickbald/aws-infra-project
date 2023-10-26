import { EC2Client, CreateVpcCommand } from "@aws-sdk/client-ec2";


// Create vpc activity
export async function createVPC(): Promise<string> {

    return 'SUCCESS';
};

// create security group vpc
export async function createSecurityGroup(name: string, env: string): Promise<string> {

    return `Security group ${name} created successfully in ${env}.`
};

// create instance activity
export async function createInstance(name: string): Promise<string> {

    return `Instance: ${name} created successfully.`
};


