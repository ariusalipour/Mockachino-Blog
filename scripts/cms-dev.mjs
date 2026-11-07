import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchSnapshot, syncSnapshot } from './cms-sync.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const pollInterval = 15_000;

function digestCollections(snapshot) {
  return createHash('sha256').update(JSON.stringify(snapshot.collections)).digest('hex');
}

async function loadLocalEnv() {
  try { process.loadEnvFile(path.join(projectRoot, '.env')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}

async function main() {
  await loadLocalEnv();

  let lastDigest = null;
  if (process.env.CMS_URL) {
    const snapshot = await fetchSnapshot(process.env.CMS_URL, process.env.CMS_API_TOKEN);
    const counts = await syncSnapshot(snapshot, projectRoot);
    lastDigest = digestCollections(snapshot);
    console.log('Synced published CMS content:', counts);
  } else {
    console.log('CMS_URL unset; using checked-in Astro content without polling.');
  }

  const args = process.argv.slice(2);
  const child = spawn(process.execPath, [path.join(projectRoot, 'node_modules/astro/astro.js'), 'dev', ...args], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env,
  });

  let stopped = false;
  let pollTimer;
  let pollInFlight = false;

  const poll = async () => {
    if (stopped || pollInFlight || !process.env.CMS_URL) return;
    pollInFlight = true;
    try {
      const snapshot = await fetchSnapshot(process.env.CMS_URL, process.env.CMS_API_TOKEN);
      if (stopped) return;
      const digest = digestCollections(snapshot);
      if (digest !== lastDigest) {
        const counts = await syncSnapshot(snapshot, projectRoot);
        lastDigest = digest;
        console.log('Synced changed published CMS content:', counts);
      }
    } catch (error) {
      // Keep the current content in place and retry on the next interval.
      if (!stopped) console.error(`CMS dev poll failed; keeping current content: ${error.message}`);
    } finally {
      pollInFlight = false;
      if (!stopped) pollTimer = setTimeout(poll, pollInterval);
    }
  };

  if (process.env.CMS_URL) pollTimer = setTimeout(poll, pollInterval);

  const stop = signal => {
    if (stopped) return;
    stopped = true;
    clearTimeout(pollTimer);
    if (child.exitCode === null && child.signalCode === null) child.kill(signal);
  };

  const onSigint = () => stop('SIGINT');
  const onSigterm = () => stop('SIGTERM');
  process.on('SIGINT', onSigint);
  process.on('SIGTERM', onSigterm);

  await new Promise((resolve, reject) => {
    child.once('error', error => {
      stopped = true;
      clearTimeout(pollTimer);
      process.off('SIGINT', onSigint);
      process.off('SIGTERM', onSigterm);
      reject(error);
    });
    child.once('exit', (code, signal) => {
      stopped = true;
      clearTimeout(pollTimer);
      process.off('SIGINT', onSigint);
      process.off('SIGTERM', onSigterm);
      if (signal) process.exitCode = signal === 'SIGINT' ? 130 : signal === 'SIGTERM' ? 143 : 1;
      else process.exitCode = code ?? 1;
      resolve();
    });
  });
}

main().catch(error => {
  console.error(`CMS dev startup failed: ${error.message}`);
  process.exitCode = 1;
});
