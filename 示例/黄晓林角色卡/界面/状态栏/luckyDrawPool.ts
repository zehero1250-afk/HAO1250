/**
 * 从世界书 YAML（武器装备池1、武器装备道具池2）解析装备与道具池，
 * 用于幸运大抽奖：本期奖池 4 件从神器及以上随机；单抽/十连从全池按品级权重抽取，100 次保底史诗。
 */
import pool1Raw from '../../世界书/武器装备池1.yaml?raw';
import pool2Raw from '../../世界书/武器装备道具池2.yaml?raw';

export type 品级 = '普通' | '精品' | '稀有' | '史诗' | '神器' | '传说';
export type PoolItem = {
  名称: string;
  类型: '装备' | '道具';
  品级: 品级;
  装备子类型?: '武器' | '防具' | '饰物';
  /** 世界书中的部位（主手/副手/躯干/头具/护足等），装备类才有 */
  部位?: string;
  /** 对应 schema 已装备键（MainHand/OffHand/Body/Head/Feet 等），打包与展示用 */
  可装备部位?: string;
  /** 世界书中的描述（CSV 最后一列），打包进物品栏后详情弹窗显示 */
  描述?: string;
  /** 世界书词条列解析为数组，弹窗「效果」用 */
  词条?: string[];
  /** 世界书数值列解析，弹窗「伤害骰/基础攻击/基础防御」用 */
  伤害骰?: string;
  攻击力?: number;
  固定伤害?: number;
  防御?: number;
};

const 品级列表: 品级[] = ['传说', '神器', '史诗', '稀有', '精品', '普通'];

/** 解析 CSV 行（支持 "xxx"yyy 形式：引号后到逗号同属当前字段） */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let end = i + 1;
      while (end < line.length && line[end] !== '"') end++;
      let fieldContent = end < line.length ? line.slice(i + 1, end).replace(/""/g, '"') : line.slice(i + 1);
      end = end < line.length ? end + 1 : line.length;
      const nextComma = line.indexOf(',', end);
      if (nextComma === -1) {
        fieldContent += line.slice(end);
        i = line.length;
      } else {
        fieldContent += line.slice(end, nextComma);
        i = nextComma + 1;
      }
      out.push(fieldContent.trim());
    } else {
      const comma = line.indexOf(',', i);
      if (comma === -1) {
        out.push(line.slice(i).trim());
        break;
      }
      out.push(line.slice(i, comma).trim());
      i = comma + 1;
    }
  }
  return out;
}

/** 世界书部位 -> 装备子类型 */
function 部位到子类型(部位: string): '武器' | '防具' | '饰物' {
  if (部位 === '主手' || 部位 === '副手') return '武器';
  if (部位 === '饰物一' || 部位 === '饰物二') return '饰物';
  return '防具';
}

/** 世界书部位 -> schema 可装备部位（已装备键） */
const 部位到可装备部位: Record<string, string> = {
  主手: 'MainHand',
  副手: 'OffHand',
  躯干: 'Body',
  头具: 'Head',
  护足: 'Feet',
  护手: 'Hands',
  护腕: 'Wrists',
  披挂: 'Back',
  腰挂: 'Waist',
  颈饰: 'Neck',
  饰物一: 'Trinket1',
  饰物二: 'Trinket2',
};

/** 判断是否为表头行（跳过） */
function isHeaderLine(line: string): boolean {
  return line.includes('序号,') && (line.includes('装备名称') || line.includes('消耗品名称'));
}

/** 解析世界书「数值」列，得到 伤害骰/攻击力 或 防御 */
function parse数值(数值列: string): { 伤害骰?: string; 攻击力?: number; 防御?: number } {
  const t = (数值列 || '').trim();
  if (!t) return {};
  const 防御Match = t.match(/防御\s*\+\s*(\d+)/);
  if (防御Match) return { 防御: parseInt(防御Match[1], 10) };
  const 武器Match = t.match(/(\d+d\d+(?:\+\d+)?)\s*\/\s*(\d+)/);
  if (武器Match) return { 伤害骰: 武器Match[1], 攻击力: parseInt(武器Match[2], 10) };
  const 仅骰子 = t.match(/^(\d+d\d+(?:\+\d+)?)$/);
  if (仅骰子) return { 伤害骰: 仅骰子[1] };
  return {};
}

/** 解析世界书「词条」列，按 ； 或 ; 拆成多条（弹窗效果用） */
function parse词条(词条列: string): string[] {
  const t = (词条列 || '').trim();
  if (!t) return [];
  return t
    .split(/[；;]/)
    .map(s => s.trim())
    .filter(Boolean);
}

/** 解析武器装备池1：纯装备，传说/史诗/神器/稀有/精品/普通 分段 */
function parsePool1(): PoolItem[] {
  const items: PoolItem[] = [];
  let currentGrade: 品级 | null = null;
  const lines = pool1Raw.split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (t === '传说级') { currentGrade = '传说'; continue; }
    if (t === '史诗级') { currentGrade = '史诗'; continue; }
    if (t === '神器级') { currentGrade = '神器'; continue; }
    if (t === '稀有级') { currentGrade = '稀有'; continue; }
    if (t === '精品级') { currentGrade = '精品'; continue; }
    if (t === '普通级') { currentGrade = '普通'; continue; }
    if (isHeaderLine(t)) continue;
    if (!currentGrade) continue;
    const cols = parseCsvLine(t);
    if (cols.length < 3) continue;
    const 名称 = (cols[1] || '').trim();
    const 部位 = (cols[2] || '').trim();
    const 数值列 = cols.length > 3 ? (cols[3] || '').trim() : '';
    const 词条列 = cols.length > 4 ? (cols[4] || '').trim() : '';
    const 描述 = (cols[cols.length - 1] || '').trim();
    if (!名称) continue;
    const 数值解析 = parse数值(数值列);
    const 词条数组 = parse词条(词条列);
    items.push({
      名称,
      类型: '装备',
      品级: currentGrade,
      装备子类型: 部位 ? 部位到子类型(部位) : undefined,
      部位: 部位 || undefined,
      可装备部位: 部位 ? 部位到可装备部位[部位] : undefined,
      描述: 描述 || undefined,
      ...数值解析,
      ...(词条数组.length ? { 词条: 词条数组 } : {}),
    });
  }
  return items;
}

/** 解析武器装备道具池2：装备类 + 道具类 */
function parsePool2(): PoolItem[] {
  const items: PoolItem[] = [];
  const lines = pool2Raw.split(/\r?\n/);
  let mode: '装备' | '道具' = '装备';
  let currentGrade: 品级 | null = null;

  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (t === '装备类') { mode = '装备'; currentGrade = null; continue; }
    if (t === '道具类') { mode = '道具'; currentGrade = null; continue; }
    if (mode === '装备') {
      if (t === '传说级') { currentGrade = '传说'; continue; }
      if (t === '史诗级') { currentGrade = '史诗'; continue; }
      if (t === '神器级') { currentGrade = '神器'; continue; }
      if (t === '稀有级') { currentGrade = '稀有'; continue; }
      if (t === '精品级') { currentGrade = '精品'; continue; }
      if (t === '普通级') { currentGrade = '普通'; continue; }
      if (isHeaderLine(t)) continue;
      if (!currentGrade) continue;
      const cols = parseCsvLine(t);
      if (cols.length < 3) continue;
      const 名称 = (cols[1] || '').trim();
      const 部位 = (cols[2] || '').trim();
      const 数值列 = cols.length > 3 ? (cols[3] || '').trim() : '';
      const 词条列 = cols.length > 4 ? (cols[4] || '').trim() : '';
      const 描述 = (cols[cols.length - 1] || '').trim();
      if (!名称) continue;
      const 数值解析 = parse数值(数值列);
      const 词条数组 = parse词条(词条列);
      items.push({
        名称,
        类型: '装备',
        品级: currentGrade,
        装备子类型: 部位 ? 部位到子类型(部位) : undefined,
        部位: 部位 || undefined,
        可装备部位: 部位 ? 部位到可装备部位[部位] : undefined,
        描述: 描述 || undefined,
        ...数值解析,
        ...(词条数组.length ? { 词条: 词条数组 } : {}),
      });
      continue;
    }
    // 道具类
    if (t === '传说级消耗品') { currentGrade = '传说'; continue; }
    if (t === '史诗级消耗品') { currentGrade = '史诗'; continue; }
    if (t === '神器级消耗品') { currentGrade = '神器'; continue; }
    if (t === '稀有级消耗品') { currentGrade = '稀有'; continue; }
    if (t === '精品级消耗品') { currentGrade = '精品'; continue; }
    if (t === '普通消耗品') { currentGrade = '普通'; continue; }
    if (isHeaderLine(t)) continue;
    if (!currentGrade) continue;
    const cols = parseCsvLine(t);
    if (cols.length < 2) continue;
    const 名称 = (cols[1] || '').trim();
    const 词条列 = cols.length > 4 ? (cols[4] || '').trim() : '';
    const 描述 = (cols[cols.length - 1] || '').trim();
    if (!名称) continue;
    const 词条数组 = parse词条(词条列);
    items.push({
      名称,
      类型: '道具',
      品级: currentGrade,
      描述: 描述 || undefined,
      ...(词条数组.length ? { 词条: 词条数组 } : {}),
    });
  }
  return items;
}

let cachedFull: PoolItem[] | null = null;
let cachedLegendaryOrArtifact: PoolItem[] | null = null;

export function getFullPool(): PoolItem[] {
  if (cachedFull === null) {
    cachedFull = [...parsePool1(), ...parsePool2()];
  }
  return cachedFull;
}

/** 神器及以上（用于本期奖池 4 件） */
export function getLegendaryOrArtifactPool(): PoolItem[] {
  if (cachedLegendaryOrArtifact === null) {
    cachedLegendaryOrArtifact = getFullPool().filter(
      (x) => x.品级 === '神器' || x.品级 === '传说'
    );
  }
  return cachedLegendaryOrArtifact;
}

/** 品级权重：稀有及以上几率依次降低（普通最高，传说最低） */
const 品级权重: Record<品级, number> = {
  普通: 35,
  精品: 28,
  稀有: 18,
  史诗: 10,
  神器: 6,
  传说: 3,
};

/** 按品级分组的池（用于加权抽取） */
function getPoolByGrade(): Map<品级, PoolItem[]> {
  const map = new Map<品级, PoolItem[]>();
  for (const g of 品级列表) map.set(g, []);
  for (const item of getFullPool()) {
    const list = map.get(item.品级);
    if (list) list.push(item);
  }
  return map;
}

let cachedByGrade: Map<品级, PoolItem[]> | null = null;
function poolByGrade(): Map<品级, PoolItem[]> {
  if (cachedByGrade === null) cachedByGrade = getPoolByGrade();
  return cachedByGrade;
}

/** 从全池中按品级权重随机抽一件；若 forceEpic 为 true 则必出史诗 */
export function drawWeightedOne(forceEpic: boolean): PoolItem | null {
  const byGrade = poolByGrade();
  if (forceEpic) {
    const 史诗列表 = byGrade.get('史诗') || [];
    if (史诗列表.length === 0) return null;
    return 史诗列表[Math.floor(Math.random() * 史诗列表.length)];
  }
  const totalWeight = 品级列表.reduce(
    (s, g) => s + 品级权重[g] * (byGrade.get(g)?.length ?? 0),
    0
  );
  if (totalWeight <= 0) return null;
  let r = Math.random() * totalWeight;
  for (const g of 品级列表) {
    const list = byGrade.get(g) || [];
    const w = 品级权重[g] * list.length;
    if (w <= 0) continue;
    if (r < w) {
      return list[Math.floor(Math.random() * list.length)];
    }
    r -= w;
  }
  const fallback = byGrade.get('普通') || [];
  return fallback.length ? fallback[Math.floor(Math.random() * fallback.length)] : null;
}

/** 转为奖池/本期奖池用的项，保留解析出的 描述 与 可装备部位 供打包与详情弹窗用 */
export function toDrawResult(item: PoolItem): PoolItem & { 描述?: string } {
  return { ...item, 描述: item.描述 ?? '' };
}
