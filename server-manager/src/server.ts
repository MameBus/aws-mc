import express, { Request, Response } from "express";
import { isMcRunning, startMc, stopMc } from "./mc";
import { doBackup } from "./aws";
import { sleep } from "./util";
const app = express();
const port = 8360;

// Tracking if we're currently commited to backing up, signals that we cannot start the server up right now
var backingUp = false;

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());

// Route for starting the mc server back up
app.post('/start', async (req: Request, res: Response) => {
    // If we're currently backing up we need to wait for it to be done backing up
    while (backingUp) {
        console.log("Currently backing up... waiting 0.5s to check again");
        await sleep(500);
    }
    console.log("Good to start");
    startMc();
});

// Route for handling the shutdown procedure, closes down the server, backs up the world, shuts down the ec2 instance
app.post('/shutdown', async (req: Request, res: Response) => {
    // Make sure we aren't already performing a backup
    if (backingUp) {
        console.log("Already backing up... aborting.");
        return;
    }
    
    console.log("Initialising shutdown + backup");
    backingUp = true;

    // Shut down the server
    stopMc();

    // Backup the world
    await doBackup();

    // Release our hold on backing up
    backingUp = false;
});

// Route for checking if the mc server is currently running
app.get('/running', (req: Request, res: Response) => {
    const isRunning = isMcRunning();
    console.log(`Is running is ${isRunning}`);
    res.send(isRunning);
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
