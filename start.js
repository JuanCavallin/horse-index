#!/usr/bin/env node
const { spawn, exec } = require('child_process');
const path = require('path');
const http = require('http');

const ROOT = __dirname;
const NGROK_PATH = process.env.NGROK_BIN || 'ngrok';

let backendProc, ngrokProc, expoProc;

function cleanup() {
  if (backendProc) backendProc.kill();
  if (ngrokProc) ngrokProc.kill();
  if (expoProc) expoProc.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

async function getNgrokUrl() {
  return new Promise((resolve) => {
    let attempts = 0;
    const check = () => {
      http.get('http://127.0.0.1:4040/api/tunnels', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const tunnels = JSON.parse(data);
            const tunnel = tunnels.tunnels?.find(t => t.proto === 'https');
            if (tunnel?.public_url) {
              resolve(tunnel.public_url);
            } else if (attempts++ < 30) {
              setTimeout(check, 1000);
            } else {
              console.error('Failed to get ngrok URL after 30s');
              cleanup();
            }
          } catch (e) {
            if (attempts++ < 30) setTimeout(check, 1000);
            else {
              console.error('Failed to parse ngrok response');
              cleanup();
            }
          }
        });
      }).on('error', () => {
        if (attempts++ < 30) setTimeout(check, 1000);
        else {
          console.error('Failed to connect to ngrok API');
          cleanup();
        }
      });
    };
    setTimeout(check, 1000);
  });
}

async function main() {
  console.log('Starting backend...');
  backendProc = spawn('npm', ['run', 'dev'], {
    cwd: path.join(ROOT, 'backend'),
    shell: true,
    stdio: 'inherit'
  });

  console.log('Starting ngrok...');
  ngrokProc = spawn(NGROK_PATH, ['http', '8000'], {
    cwd: ROOT,
    shell: true,
    stdio: 'pipe'
  });

  const tunnelUrl = await getNgrokUrl();
  console.log(`\n✓ Backend tunnel: ${tunnelUrl}\n`);

  console.log('Starting Expo with tunnel...');
  expoProc = spawn('npx', ['expo', 'start', '--tunnel'], {
    cwd: path.join(ROOT, 'frontend'),
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, EXPO_PUBLIC_API_URL: tunnelUrl }
  });
}

main().catch(err => {
  console.error('Error:', err);
  cleanup();
});
