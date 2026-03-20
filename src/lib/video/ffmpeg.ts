import { spawn } from 'node:child_process';

export function getFfmpegPath() {
  return process.env.FFMPEG_PATH || 'ffmpeg';
}

export function getFfprobePath() {
  return process.env.FFPROBE_PATH || 'ffprobe';
}

export async function runCommand(command: string, args: string[], cwd?: string) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr || `${command} exited with code ${code}`));
    });
  });
}
