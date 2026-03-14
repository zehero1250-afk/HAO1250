/**
 * 将构建产出的状态栏 index.html 复制到角色卡正则文件，
 * 并用 ```html ... ``` 包裹，以便酒馆前端正确显示界面。
 * 这样监听推送后即使用 dist 覆盖正则文件，反引号也会一并恢复，无需手补。
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const src = path.join(root, 'dist', '黄晓林角色卡', '界面', '状态栏', 'index.html');
const dest = path.join(root, '示例', '黄晓林角色卡', '正则', '[界面]黄晓林DnD状态栏.txt');

if (!fs.existsSync(src)) {
  console.warn('copy-statusbar-to-regex: 未找到构建产物，跳过复制。请先执行 pnpm build。');
  process.exit(0);
}

const html = fs.readFileSync(src, 'utf-8');
const wrapped = '```html\n' + html + '\n```';

try {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, wrapped, 'utf-8');
  console.info('copy-statusbar-to-regex: 已更新 示例/黄晓林角色卡/正则/[界面]黄晓林DnD状态栏.txt（含 ``` 包裹）');
} catch (error) {
  console.warn('copy-statusbar-to-regex: 写入失败，已跳过，不影响本次构建。');
  console.warn(error?.message || error);
}
