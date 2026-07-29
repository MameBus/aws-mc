import { DescribeInstancesCommand, EC2Client, InstanceState$, StartInstancesCommand, waitUntilInstanceRunning } from "@aws-sdk/client-ec2";
import { PORT } from "./config";

// Environment vars
const awsRegion = process.env["REGION"];
const serverInstanceId = process.env["INSTANCE_ID"];

console.log(`Picked up region: ${awsRegion} and instance id: ${serverInstanceId}`);

if (awsRegion == undefined || serverInstanceId == undefined) {
    throw new Error("Missing REGION or INSTANCE_ID environment variables");
}

// Config
const WAIT_TIMEOUT = 120;

// Variables
const ec2Client = new EC2Client({
    region: awsRegion
});

const instanceIds = [
    serverInstanceId
];

async function getInstanceDetails() {
    const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds
    });
    const response = await ec2Client.send(command);
    const instance = response.Reservations?.[0].Instances?.[0];
    return instance;
}

// Check if the server is currently running and open to connections
export async function isServerRunning() {
    console.log("Checking is running");
    const instance = await getInstanceDetails();

    if (instance == undefined) {
        throw new Error("Couldn't find instance");
    }

    if (instance.State?.Name == "pending") {
        console.log("Starting up... Doing wait");
        await waitUntilRunning();
        return true;
    }
    else if (instance.State?.Name == "running") {
        console.log("Running");
        return true;
    }
    console.log("Not running");
    return false;
}

// Start up the ec2 instance
export async function startServer() {
    console.log("Starting instance");
    const command = new StartInstancesCommand({
        InstanceIds: instanceIds
    });

    const response = await ec2Client.send(command);
    console.log(response);
    await waitUntilRunning();
}

// Wait for the ec2 instance to be running
async function waitUntilRunning() {
    console.log("Waiting for instance to be running...");
    const options = {
        maxWaitTime: WAIT_TIMEOUT,
        client: ec2Client
    }
    const input = {
        InstanceIds: instanceIds
    }
    await waitUntilInstanceRunning(options, input);
    console.log("Running");
}

// Send a signal to the server to do it's shut down procedure
export async function stopServer() {
    
}

export async function getConnectionDetails() {
    // Just need to grab the ec2 public IP (i.e. hostname)
    console.log("Getting instance host name");
    const instance = await getInstanceDetails();
    const hostName = instance?.PublicIpAddress;
    if (hostName == undefined) {
        throw new Error("Could not determine host name");
    }
    console.log(`Found hostname as ${hostName}`);

    return {
        host: hostName,
        port: PORT
    };
}
