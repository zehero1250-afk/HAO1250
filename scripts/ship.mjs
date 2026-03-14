#!/usr/bin/env node
import { execSync, spawnSync } from 'node:child_process';

function run(cmd, options = {}) {
  execSync(cmd, { stdio: 'inherit', ...options });
}

function read(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

function runCaptured(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: false,
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  return result;
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
      console.log('[ship] 没有可提交的变更，继续同步远端...');
    }
  } else {
    console.log('[ship] 本地无改动，直接同步远端...');
  }

  const pullResult = runCaptured('git', ['pull', '--rebase', 'origin', 'main']);
  if (pullResult.status !== 0) {
    const combinedOutput = `${pullResult.stdout || ''}\n${pullResult.stderr || ''}`;
    if (/SSL_read|unexpected eof|Failed to connect|Could not resolve host|Connection timed out/i.test(combinedOutput)) {
      console.error('[ship] git pull --rebase 因网络或 SSL 中断失败；你的本地提交通常已经成功。网络恢复后直接执行 `git push origin main` 或重新运行 `pnpm ship` 即可。');
    } else if (/rebase-merge directory|another rebase|Resolve all conflicts|could not apply|CONFLICT/i.test(combinedOutput)) {
      console.error('[ship] git pull --rebase 遇到 rebase/冲突状态，请先执行 `git status`，再根据提示 `git rebase --continue`、`git rebase --abort` 或处理冲突。');
    } else {
      console.error('[ship] git pull --rebase 失败，请先执行 `git status` 查看当前仓库状态。');
    }
    process.exit(1);
  }

  run('git push origin main');
  console.log('[ship] 已完成：commit/pull --rebase/push');
}

main();
