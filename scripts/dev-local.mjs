import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

function run(command, args, { capture = false, env = process.env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env,
      stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
    });
    let output = "";
    if (capture) child.stdout.setEncoding("utf8").on("data", (chunk) => (output += chunk));
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) resolve(output);
      else reject(new Error(`${command} terminó con ${signal ?? `código ${code}`}`));
    });
  });
}

function parseEnvironment(output) {
  return Object.fromEntries(
    output.split(/\r?\n/).flatMap((line) => {
      const match = line.match(/^([A-Z_]+)=(?:"([^"]*)"|'([^']*)'|(.*))$/);
      return match ? [[match[1], match[2] ?? match[3] ?? match[4]]] : [];
    }),
  );
}

const supabaseCli = fileURLToPath(
  new URL("../node_modules/supabase/dist/supabase.js", import.meta.url),
);
const status = parseEnvironment(
  await run(process.execPath, [supabaseCli, "status", "--output", "env"], { capture: true }),
);
await run(process.execPath, [supabaseCli, "migration", "up", "--local"]);
const url = status.API_URL;
const key = status.PUBLISHABLE_KEY ?? status.ANON_KEY;
if (!url || !key) {
  throw new Error("Supabase local no devolvió API_URL y ANON_KEY. Revisa `supabase status`.");
}

const env = {
  ...process.env,
  SUPABASE_URL: url,
  SUPABASE_PUBLISHABLE_KEY: key,
  VITE_SUPABASE_URL: url,
  VITE_SUPABASE_PUBLISHABLE_KEY: key,
  VITE_FACE_API_URL: process.env.VITE_FACE_API_URL ?? "http://127.0.0.1:8765",
  SMARTACCESS_ALLOWED_ORIGINS:
    process.env.SMARTACCESS_ALLOWED_ORIGINS ??
    "http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173,http://127.0.0.1:5173",
};

const projectDir = fileURLToPath(new URL("../esp32-cam", import.meta.url));
const localPython = join(projectDir, "venv", "Scripts", "python.exe");
let faceApi;
if (process.env.SMARTACCESS_PYTHON || existsSync(localPython)) {
  faceApi = spawn(process.env.SMARTACCESS_PYTHON ?? localPython, ["-m", "server.app", "--api"], {
    cwd: projectDir,
    env,
    stdio: "inherit",
  });
  const healthUrl = `${env.VITE_FACE_API_URL.replace(/\/+$/, "")}/health`;
  const timeout = Date.now() + 30000;
  let ready = false;
  while (Date.now() < timeout && faceApi.exitCode === null) {
    try {
      const response = await fetch(healthUrl);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      // La API puede tardar unos instantes en abrir el puerto local.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  if (!ready) {
    faceApi.kill();
    throw new Error(
      "No se inició la API facial. Comprueba el entorno Python y el puerto SMARTACCESS_FACE_API_PORT.",
    );
  }
} else {
  console.warn(
    "API facial desactivada: crea esp32-cam/venv e instala esp32-cam/requirements.txt para habilitarla.",
  );
}

const vite = spawn(
  process.execPath,
  [fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url)), "dev"],
  { env, stdio: "inherit" },
);

let shuttingDown = false;
function stopChildren(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  faceApi?.kill(signal);
  vite.kill(signal);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => stopChildren(signal));
}

vite.on("error", (error) => {
  console.error("No se pudo iniciar Vite:", error);
  faceApi?.kill();
  process.exitCode = 1;
});
vite.on("exit", (code, signal) => {
  faceApi?.kill(signal ?? "SIGTERM");
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});
faceApi?.on("error", (error) => {
  console.error("No se pudo iniciar la API facial:", error);
  vite.kill();
  process.exitCode = 1;
});
