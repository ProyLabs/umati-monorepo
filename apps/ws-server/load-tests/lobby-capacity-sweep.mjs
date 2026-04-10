import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const cwd = process.cwd();
const scriptPath = join(cwd, "load-tests", "lobby-capacity.js");

const parseNum = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const start = parseNum(process.env.SWEEP_START, 10);
const end = parseNum(process.env.SWEEP_END, 100);
const step = parseNum(process.env.SWEEP_STEP, 10);
const overflow = parseNum(process.env.OVERFLOW_PLAYERS, 5);
const stopOnFailure = (process.env.STOP_ON_FAILURE || "false") === "true";

if (step <= 0) {
  throw new Error("SWEEP_STEP must be > 0");
}

if (end < start) {
  throw new Error("SWEEP_END must be >= SWEEP_START");
}

const tempDir = mkdtempSync(join(tmpdir(), "umati-k6-sweep-"));
const results = [];

function metricRate(summary, metricName) {
  return summary?.metrics?.[metricName]?.values?.rate ?? null;
}

function metricCount(summary, metricName) {
  return summary?.metrics?.[metricName]?.values?.count ?? null;
}

function runSweepValue(maxPlayers) {
  const summaryPath = join(tempDir, `summary-${maxPlayers}.json`);
  const env = {
    ...process.env,
    MAX_PLAYERS: String(maxPlayers),
    OVERFLOW_PLAYERS: String(overflow),
  };

  const run = spawnSync(
    "k6",
    ["run", "--summary-export", summaryPath, scriptPath],
    {
      cwd,
      env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  let summary = null;
  try {
    summary = JSON.parse(readFileSync(summaryPath, "utf8"));
  } catch {
    summary = null;
  }

  const acceptedRate = metricRate(summary, "capacity_join_accepted_rate");
  const rejectedRate = metricRate(summary, "capacity_join_rejected_rate");
  const socketErrorRate = metricRate(summary, "capacity_socket_error_rate");
  const lobbyClosedRate = metricRate(summary, "capacity_lobby_closed_rate");
  const acceptedCount = metricCount(summary, "capacity_accepted_count");
  const rejectedCount = metricCount(summary, "capacity_rejected_count");

  const passed =
    run.status === 0 &&
    acceptedRate === 1 &&
    rejectedRate === 1 &&
    socketErrorRate === 0 &&
    lobbyClosedRate === 1;

  return {
    maxPlayers,
    exitCode: run.status ?? 1,
    passed,
    acceptedRate,
    rejectedRate,
    socketErrorRate,
    lobbyClosedRate,
    acceptedCount,
    rejectedCount,
    stderr: run.stderr.trim(),
  };
}

for (let maxPlayers = start; maxPlayers <= end; maxPlayers += step) {
  const result = runSweepValue(maxPlayers);
  results.push(result);

  const status = result.passed ? "PASS" : "FAIL";
  console.log(
    [
      `${status} MAX_PLAYERS=${result.maxPlayers}`,
      `accepted=${result.acceptedRate ?? "n/a"}`,
      `rejected=${result.rejectedRate ?? "n/a"}`,
      `socket_errors=${result.socketErrorRate ?? "n/a"}`,
      `closed=${result.lobbyClosedRate ?? "n/a"}`,
      `accepted_count=${result.acceptedCount ?? "n/a"}`,
      `rejected_count=${result.rejectedCount ?? "n/a"}`,
      result.exitCode !== 0 ? `exit=${result.exitCode}` : null,
    ]
      .filter(Boolean)
      .join(" | "),
  );

  if (!result.passed && result.stderr) {
    console.log(result.stderr.split("\n").slice(-8).join("\n"));
  }

  if (!result.passed && stopOnFailure) {
    break;
  }
}

const firstFailure = results.find((result) => !result.passed);
const highestPassing = [...results].reverse().find((result) => result.passed);

console.log("");
console.log("Sweep summary");
console.log(
  `Highest passing MAX_PLAYERS: ${highestPassing ? highestPassing.maxPlayers : "none"}`,
);
console.log(
  `First failing MAX_PLAYERS: ${firstFailure ? firstFailure.maxPlayers : "none"}`,
);

rmSync(tempDir, { recursive: true, force: true });

