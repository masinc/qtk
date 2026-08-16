import { spawn } from "node:child_process";
import { platform } from "node:os";

const API_PORT = "3000";
const children: ReturnType<typeof spawn>[] = [];
let shuttingDown = false;
let exitCode = 0;

function start(name: string, args: string[]): void {
  const child = spawn("bun", args, { stdio: "inherit" });
  children.push(child);
  child.on("exit", (code) => {
    if (code !== 0) exitCode = code ?? 1;
    console.log(`[${name}] exited (code=${code})`);
    shutdown();
  });
}

function killTree(child: ReturnType<typeof spawn>): void {
  const pid = child.pid;
  if (pid === undefined || child.killed) return;
  if (platform() === "win32") {
    spawn("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    child.kill("SIGTERM");
  }
}

function shutdown(): void {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) killTree(child);
  process.exit(exitCode);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start("api", ["run", "cli.ts", "web", "--no-open", "--port", API_PORT]);
start("ui", ["run", "--filter", "@masinc/qtk-web", "dev"]);
