#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8').trim();
}

function findGitDir(startDir) {
  let current = startDir;
  while (true) {
    const gitPath = path.join(current, '.git');
    if (fs.existsSync(gitPath)) {
      return gitPath;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error('找不到 .git 目录。');
    }
    current = parent;
  }
}

function resolveGitDir(gitPath) {
  const stat = fs.statSync(gitPath);
  if (stat.isDirectory()) {
    return gitPath;
  }

  const raw = readText(gitPath);
  const match = raw.match(/^gitdir:\s*(.+)$/i);
  if (!match) {
    throw new Error('.git 文件格式无法识别。');
  }
  return path.resolve(path.dirname(gitPath), match[1]);
}

function readPackedRef(gitDir, refName) {
  const packedRefsPath = path.join(gitDir, 'packed-refs');
  if (!fs.existsSync(packedRefsPath)) return null;

  const lines = readText(packedRefsPath).split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.startsWith('#') || line.startsWith('^')) continue;
    const [hash, name] = line.split(' ');
    if (name === refName) return hash;
  }
  return null;
}

function readCommitHash() {
  const gitDir = resolveGitDir(findGitDir(process.cwd()));
  const head = readText(path.join(gitDir, 'HEAD'));

  if (!head.startsWith('ref:')) {
    return head;
  }

  const refName = head.slice(5).trim();
  const refPath = path.join(gitDir, ...refName.split('/'));
  if (fs.existsSync(refPath)) {
    return readText(refPath);
  }

  const packed = readPackedRef(gitDir, refName);
  if (packed) {
    return packed;
  }

  throw new Error(`找不到引用 ${refName} 对应的提交号。`);
}

function main() {
  let commit;
  try {
    commit = readCommitHash().slice(0, 7);
  } catch (error) {
    console.error(`[statusbar:url] ${error instanceof Error ? error.message : '无法读取当前 git 提交号。'}`);
    process.exit(1);
  }

  const url =
    `https://cdn.jsdelivr.net/gh/zehero1250-afk/HAO1250@${commit}` +
    '/dist/%E5%BA%9F%E5%9C%9F%E4%B9%8B%E8%AF%97/%E7%95%8C%E9%9D%A2/%E7%8A%B6%E6%80%81%E6%A0%8F/index.html';

  const snippet = [
    '<body>',
    '<script>',
    `$('body').load('${url}')`,
    '</script>',
    '</body>',
  ].join('\n');

  console.log(`[statusbar:url] 当前提交: ${commit}`);
  console.log('[statusbar:url] 状态栏地址:');
  console.log(url);
  console.log('');
  console.log('[statusbar:url] 酒馆正则替换内容:');
  console.log(snippet);
}

main();
