import net from "node:net";
import { scheduleJob } from "node-schedule";
import { getConnectionDetails, isServerRunning, startServer, stopServer } from "./aws";
import { PORT, TIME_BEFORE_SHUTDOWN } from "./config";

// The server we listen on
const server = net.createServer(async (clientSocket) => {
    console.log("Client connected");

    // Make sure the server is running first
    const running = await isServerRunning();
    if (!running) {
        await startServer();
    }

    // Grab the server connection details
    const connectionDetails = await getConnectionDetails();

    try {
        const serverSocket = net.createConnection(connectionDetails);

        // Some hooks for handling crap
        serverSocket.on("connect", () => {
            // Proxy the connection from client to server
            clientSocket.pipe(serverSocket);
            serverSocket.pipe(clientSocket);
        });

        // The server has errored
        serverSocket.on("error", (e) => {
            console.log(`Server side error ${e.message}`);
            clientSocket.destroy();
        });

        // The client has errored
        clientSocket.on("error", (e) => {
            console.log(`Client side error ${e.message}`);
            serverSocket.destroy();
        });

        // Client has closed connection
        clientSocket.on("close", () => {
            // Kill the server socket
            serverSocket.destroy();

            // Schedule a job to check if the server should shut down
            scheduleJob(TIME_BEFORE_SHUTDOWN, () => {
                stopServer();
            });
        });
    } catch (e) {
        console.log(`Error with the connection ${(e as Error).message}`);
        clientSocket.destroy();
    }
});

// Start up the server
server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
