/**
 * 将 示例/废土之诗 导出为 chara_card_v3 的 JSON 角色卡
 * 运行: node scripts/export-wasteland-char-card.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const wastelandDir = path.join(root, '示例', '废土之诗');
const worldbookDir = path.join(wastelandDir, '世界书');

const defaultEntryExtensions = {
  position: 4,
  exclude_recursion: true,
  display_index: 0,
  probability: 100,
  useProbability: true,
  depth: 0,
  selectiveLogic: 0,
  outlet_name: '',
  group: '',
  group_override: false,
  group_weight: 100,
  prevent_recursion: true,
  delay_until_recursion: false,
  scan_depth: null,
  match_whole_words: null,
  use_group_scoring: false,
  case_sensitive: null,
  automation_id: '',
  role: 0,
  vectorized: false,
  sticky: null,
  cooldown: null,
  delay: null,
  match_persona_description: false,
  match_character_description: false,
  match_character_personality: false,
  match_character_depth_prompt: false,
  match_scenario: false,
  match_creator_notes: false,
  triggers: [],
  ignore_budget: false,
};

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return '';
  }
}

function resolveWorldbookFile(fileRef) {
  // fileRef 如 "世界书/废船村" 或 "世界书/变量/initvar"
  const base = path.join(wastelandDir, fileRef.replace(/\//g, path.sep));
  for (const ext of ['.yaml', '.yml', '.txt']) {
    const p = base + ext;
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  }
  return '';
}

function flattenIndexEntries(entries, out = []) {
  for (const item of entries || []) {
    if (item['文件夹'] === '变量' && item['条目']) {
      flattenIndexEntries(item['条目'], out);
    } else if (item['名称'] != null) {
      out.push(item);
    }
  }
  return out;
}

function buildCharacterBookEntries(indexYaml) {
  const entries = [];
  const list = flattenIndexEntries(indexYaml?.条目 || []);
  let insertionOrder = 14720;
  for (let id = 0; id < list.length; id++) {
    const item = list[id];
    const name = item['名称'] || '';
    const fileRef = item['文件'] || '';
    const enabled = item['启用'] !== false;
    const insert = item['插入位置'] || {};
    const posType = insert['类型'] || '指定深度';
    const position = posType === '角色定义之前' ? 'before_char' : 'after_char';
    const depth = insert['深度'] ?? 0;
    const order = insert['顺序'] ?? insertionOrder;

    const content = fileRef ? resolveWorldbookFile(fileRef) : '';
    const isSeparator = name === '===变量开始===' || name === '===变量结束===';

    entries.push({
      id,
      keys: [],
      secondary_keys: [],
      comment: name,
      content,
      constant: !!item['激活策略']?.类型?.includes('蓝灯') || isSeparator,
      selective: false,
      insertion_order: order,
      enabled: isSeparator ? false : enabled,
      position,
      use_regex: true,
      extensions: {
        ...defaultEntryExtensions,
        display_index: id,
        position: position === 'before_char' ? 0 : 4,
        depth,
        exclude_recursion: !!item['递归']?.['不可被其他条目激活'],
        prevent_recursion: !!item['递归']?.['不可激活其他条目'],
        vectorized: !item['激活策略']?.类型?.includes('蓝灯') && !isSeparator,
      },
    });
  }
  return entries;
}

function main() {
  const indexPath = path.join(wastelandDir, 'index.yaml');
  const indexRaw = readFileSafe(indexPath);
  const indexYaml = yaml.parse(indexRaw) || {};

  const firstMesPath = path.join(wastelandDir, '第一条消息', '0.txt');
  const firstMes = readFileSafe(firstMesPath).trim() || '（废土之诗故事开始。）';

  const characterBookEntries = buildCharacterBookEntries(indexYaml);

  const card = {
    name: '废土之诗',
    description: '诺亚战争后约六十五年的废土大陆，赏金猎人、聚落与变异生物并存。主角自歌丘岛废船村展开冒险。',
    first_mes: firstMes,
    creatorcomment: '含世界书设定、赏金猎人与猎人协会规则、MVU 变量与状态栏；世界书名称与角色卡相同',
    data: {
      name: '废土之诗',
      description: '诺亚战争后约六十五年的废土大陆，赏金猎人、聚落与变异生物并存。主角自歌丘岛废船村展开冒险。',
      first_mes: firstMes,
      creator_notes: '含世界书设定、赏金猎人与猎人协会规则、MVU 变量与状态栏；世界书名称与角色卡相同',
      creator: '',
      character_version: '1.0.0',
      alternate_greetings: [],
      extensions: {
        world: '废土之诗',
        regex_scripts: [
          {
            id: '2d2018ae-c085-4916-af05-6830110a8293',
            scriptName: '[不发送]去除变量更新',
            disabled: false,
            runOnEdit: false,
            findRegex: '/<update(?:variable)?>(?:(?!.*<\\/update(?:variable)?>).*$|.*<\\/update(?:variable)?>)/gsi',
            replaceString: '',
            trimStrings: [],
            placement: [1, 2],
            substituteRegex: 0,
            minDepth: null,
            maxDepth: 3,
            markdownOnly: false,
            promptOnly: true,
          },
          {
            id: 'ea96523f-a1cc-4634-b9d2-f28531adca6c',
            scriptName: '[折叠]变量更新中',
            disabled: false,
            runOnEdit: false,
            findRegex: '/<update(?:variable)?>(?!.*<\\/update(?:variable)?>)\\s*(.*)\\s*$/gsi',
            replaceString: '<details>\n<summary>变量更新中{{random::.::..::...}}</summary>\n$1\n</details>',
            trimStrings: [],
            placement: [1, 2],
            substituteRegex: 0,
            minDepth: null,
            maxDepth: null,
            markdownOnly: true,
            promptOnly: false,
          },
          {
            id: '06dec31f-c0a9-456c-8b88-1f9176a73039',
            scriptName: '[折叠]完整变量更新',
            disabled: false,
            runOnEdit: false,
            findRegex: '/<update(?:variable)?>\\s*(.*)\\s*<\\/update(?:variable)?>/gsi',
            replaceString: '<details>\n<summary>变量更新情况</summary>\n$1\n</details>',
            trimStrings: [],
            placement: [1, 2],
            substituteRegex: 0,
            minDepth: null,
            maxDepth: null,
            markdownOnly: true,
            promptOnly: false,
          },
          {
            id: 'b50d0bed-ff40-4a25-9ada-14feb4283324',
            scriptName: '[界面]状态栏',
            disabled: false,
            runOnEdit: false,
            findRegex: '<StatusPlaceHolderImpl/>',
            replaceString: '```\n<body>\n<script>\n$(\'body\').load(\'https://testingcf.jsdelivr.net/gh/StageDog/tavern_helper_template/dist/废土之诗/界面/状态栏/index.html\')\n</script>\n</body>\n```',
            trimStrings: [],
            placement: [2],
            substituteRegex: 0,
            minDepth: null,
            maxDepth: null,
            markdownOnly: true,
            promptOnly: false,
          },
        ],
        tavern_helper: {
          scripts: [
            {
              name: 'mvu',
              id: '22d70d1f-d0be-4061-911e-d0c57ab55053',
              enabled: true,
              type: 'script',
              content: "import 'https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js';",
              info: '',
              button: { enabled: true, buttons: [] },
              data: {},
            },
            {
              name: '变量结构',
              id: 'f65ab164-4268-4366-8228-16af904c2251',
              enabled: true,
              type: 'script',
              content: "import 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_helper_template/dist/废土之诗/脚本/变量结构/index.js';",
              info: '',
              button: { enabled: true, buttons: [] },
              data: {},
            },
          ],
          variables: {},
        },
        talkativeness: '0.5',
        fav: false,
        depth_prompt: { prompt: '', depth: 4, role: 'system' },
      },
      character_book: {
        name: '废土之诗',
        entries: characterBookEntries,
      },
      personality: '',
      scenario: '',
      mes_example: '',
      system_prompts: '',
      post_history_instructions: '',
      tags: [],
      group_only_greetings: [],
    },
    personality: '',
    scenario: '',
    mes_example: '',
    avatar: 'none',
    talkativeness: '0.5',
    fav: false,
    tags: [],
    spec: 'chara_card_v3',
    spec_version: '3.0',
    create_date: '',
  };

  const outPath = path.join(wastelandDir, '废土之诗.json');
  fs.writeFileSync(outPath, JSON.stringify(card, null, 2), 'utf8');
  console.log('已导出:', outPath);
  console.log('世界书条目数:', characterBookEntries.length);
}

main();
