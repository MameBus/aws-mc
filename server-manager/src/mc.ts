import { execFileAsync } from "./util";

export async function isMcRunning() {
    const { stdout } = await execFileAsync("systemctl", [
        "is-active",
        "minecraft.service"
    ]);

    return stdout.includes('active');
}

export async function startMc() {
    await execFileAsync("systemctl", [
        "start",
        "minecraft"
    ]);
}

export async function stopMc() {
    await execFileAsync("systemctl", [
        "stop",
        "minecraft"
    ]);
}
