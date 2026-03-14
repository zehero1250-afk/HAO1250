#!/usr/bin/env node
import { execSync } from 'node:child_process';

function run(cmd, options = {}) {
  execSync(cmd, { stdio: 'inherit', ...options });
}

function read(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

function getTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function main() {
  try {
    const inRepo = read('git rev-parse --is-inside-work-tree');
    if (inRepo !== 'true') {
      console.error('[ship] 当前目录不是 git 仓库。');
      process.exit(1);
    }
  } catch {
    console.error('[ship] 无法识别 git 仓库，请确认你在项目根目录运行。');
    process.exit(1);
  }

  const messageFromArgs = process.argv.slice(2).join(' ').trim();
  const commitMessage = messageFromArgs || `chore: sync local updates (${getTimestamp()})`;

  const hasChanges = read('git status --porcelain').length > 0;
  if (hasChanges) {
    console.log('[ship] 检测到本地改动，正在提交...');
    run('git add -A');
    try {
      run(`git commit -m "${commitMessage.replaceAll('"', '\\"')}"`);
    } catch {
      // `git add` 后仍无可提交内容时，继续执行同步流程
      console.log('[ship] 没有可提交的变更，继续同步远端...');
    }
  } else {
    console.log('[ship] 本地无改动，直接同步远端...');
  }

  try {
    run('git pull --rebase origin main');
  } catch {
    console.error('[ship] pull --rebase 失败。请先处理冲突后再执行一次 pnpm ship。');
    process.exit(1);
  }

  run('git push origin main');
  console.log('[ship] 已完成：commit/pull --rebase/push');
}

main();
