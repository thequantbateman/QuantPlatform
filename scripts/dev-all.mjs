import { spawn } from "node:child_process";

const children = [
  spawn("npm", ["run", "dev"], { stdio: "inherit" }),
  spawn("npm", ["run", "dev:quant"], { stdio: "inherit" }),
];
let stopping = false;
function stop(signal = "SIGTERM") { if (stopping) return; stopping = true; for (const child of children) if (!child.killed) child.kill(signal); }
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => stop(signal));
for (const child of children) child.on("exit", (code) => { if (!stopping) { stop(); process.exitCode = code ?? 1; } });
