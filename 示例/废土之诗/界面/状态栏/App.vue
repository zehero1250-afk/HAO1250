<template>
  <div v-if="data" class="hud">
    <section class="hero-card">
      <div class="hero-main">
        <div>
          <p class="eyebrow">{{ data.player.profession }}</p>
          <h1>{{ data.player.name }}</h1>
          <p class="meta">
            Lv.{{ data.player.level }} | {{ data.world.location }} | {{ data.world.time }} | {{ data.world.weather }}
          </p>
        </div>
        <div class="chips">
          <span class="chip">{{ data.world.exploration }}</span>
          <span class="chip danger">危险 {{ data.world.danger }}</span>
          <span v-if="data.combat.inBattle" class="chip">Round {{ data.combat.round }}</span>
        </div>
      </div>

      <div class="bars">
        <div class="bar-block">
          <div class="bar-label"><span>HP</span><span>{{ data.player.hp }}/{{ data.player.maxHp }}</span></div>
          <div class="bar">
            <div class="fill hp" :style="{ width: percent(data.player.hp, data.player.maxHp) }" />
          </div>
        </div>
        <div class="bar-block">
          <div class="bar-label"><span>体力</span><span>{{ data.player.stamina }}/100</span></div>
          <div class="bar">
            <div class="fill stamina" :style="{ width: `${data.player.stamina}%` }" />
          </div>
        </div>
        <div class="bar-block">
          <div class="bar-label"><span>经验</span><span>{{ data.player.exp }}/{{ data.player.expToNext }}</span></div>
          <div class="bar">
            <div class="fill exp" :style="{ width: percent(data.player.exp, data.player.expToNext) }" />
          </div>
        </div>
      </div>
    </section>

    <section class="grid">
      <article class="panel">
        <h2>战斗面板</h2>
        <div class="stats-row">
          <span>ATK {{ data.player.atk }}</span>
          <span>DEF {{ data.player.def }}</span>
          <span>SPD {{ data.player.speed }}</span>
          <span>CRIT {{ data.player.crit }}%</span>
        </div>
        <div class="stats-row secondary">
          <span>基础ATK {{ data.player.baseStats?.atk ?? data.player.atk }}</span>
          <span>装备+ {{ data.equipmentBonus?.atk ?? 0 }} / {{ data.equipmentBonus?.def ?? 0 }}</span>
          <span>生命+ {{ data.equipmentBonus?.maxHp ?? 0 }}</span>
          <span>词条 {{ bonusNotes.length }}</span>
        </div>
        <div v-if="data.combat.inBattle" class="enemy">
          <div class="enemy-head">
            <strong>{{ data.combat.enemy.name }}</strong>
            <span>{{ data.combat.enemy.category }} | 威胁 {{ data.combat.enemy.threat }}</span>
          </div>
          <p class="sub">敌人等级：Lv.{{ data.combat.enemy.level }} | 击杀经验：{{ data.combat.enemy.expReward }}</p>
          <div class="bar">
            <div class="fill enemy-fill" :style="{ width: percent(data.combat.enemy.hp, data.combat.enemy.maxHp) }" />
          </div>
          <p class="sub">敌方生命 {{ data.combat.enemy.hp }}/{{ data.combat.enemy.maxHp }}</p>
          <p class="hint">敌方意图：{{ data.combat.enemy.intent }}</p>
        </div>
        <div v-else class="empty-state">当前无敌对目标</div>
        <p class="hint">上次行动：{{ data.combat.lastAction }}</p>
        <p class="hint">最近判定：{{ data.combat.lastCheck }}</p>
      </article>

      <article class="panel">
        <h2>等级系统</h2>
        <p class="hint">等级上限：{{ data.progression.levelCap }}</p>
        <p class="hint">经验成长系数：{{ data.progression.expGrowthRate }}</p>
        <p class="hint">基础升级经验：{{ data.progression.baseExpToNext }}</p>
        <p class="hint">当前等级：{{ data.player.level }}</p>
        <p class="hint">当前经验：{{ data.player.exp }}/{{ data.player.expToNext }}</p>
      </article>

      <article class="panel">
        <h2>生存状态</h2>
        <p class="hint">饥饿：{{ data.player.hunger }}</p>
        <p class="hint">干渴：{{ data.player.thirst }}</p>
        <p class="hint">辐射：{{ data.player.radiation }}</p>
        <p class="hint">伤势：{{ data.player.injury }}</p>
        <p class="hint">营地危险：{{ data.status.campDanger }}</p>
      </article>

      <article class="panel inventory-panel">
        <div class="section-head">
          <h2>装备与补给</h2>
          <span class="hint">点击查看详情</span>
        </div>
        <div class="list">
          <button
            v-for="entry in equipmentEntries"
            :key="entry.key"
            type="button"
            class="item item-button"
            @click.stop.prevent="openDetail(entry)"
          >
            <span>{{ entry.label }}</span>
            <strong>{{ entry.name }}</strong>
          </button>
          <button
            v-for="entry in supplyEntries"
            :key="entry.key"
            type="button"
            class="item item-button supply"
            @click.stop.prevent="openDetail(entry)"
          >
            <span>{{ entry.label }}</span>
            <strong>{{ entry.value }}</strong>
          </button>
        </div>
      </article>
    </section>

    <Teleport to="body">
      <div v-if="selectedDetail" class="detail-backdrop" @click.self="closeDetail">
        <article class="detail-modal" @click.stop>
          <div class="detail-head">
            <div>
              <p class="detail-kicker">{{ selectedDetail.kindLabel }} | {{ selectedDetail.slotOrCategory }}</p>
              <h3>{{ selectedDetail.name }}</h3>
              <p v-if="selectedDetail.grade" class="hint">{{ selectedDetail.grade }}</p>
            </div>
            <button type="button" class="close-button" @click.stop.prevent="closeDetail">关闭</button>
          </div>

          <p class="detail-summary">{{ selectedDetail.summary }}</p>
          <p v-if="selectedDetail.flavor" class="detail-flavor">{{ selectedDetail.flavor }}</p>

          <div v-if="selectedDetail.stats.length" class="detail-stats">
            <div v-for="stat in selectedDetail.stats" :key="stat.label" class="detail-stat">
              <span>{{ stat.label }}</span>
              <strong>{{ stat.value }}</strong>
            </div>
          </div>

          <div v-if="selectedDetail.effects.length" class="effects-block">
            <h4>效果词条</h4>
            <div class="effects-list">
              <div v-for="effect in selectedDetail.effects" :key="effect.name" class="effect-card">
                <strong>{{ effect.name }}</strong>
                <p>{{ effect.description }}</p>
              </div>
            </div>
          </div>

          <div v-if="selectedDetail.kind === 'equipment' && bonusNotes.length" class="effects-block">
            <h4>当前装备总加成摘要</h4>
            <div class="effects-list compact">
              <div v-for="note in bonusNotes" :key="note" class="effect-card">
                <p>{{ note }}</p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDataStore } from './store';

type EffectItem = {
  name: string;
  description: string;
};

type ItemMetaSource = {
  slot?: string;
  category?: string;
  grade?: string;
  summary?: string;
  flavor?: string;
  maxHp?: number;
  atk?: number;
  def?: number;
  speed?: number;
  crit?: number;
  effects?: EffectItem[];
};

type DetailEntry = {
  key: string;
  kind: 'equipment' | 'supply';
  kindLabel: string;
  label: string;
  name: string;
  value?: string | number;
  slotOrCategory: string;
  grade?: string;
  summary: string;
  flavor: string;
  stats: Array<{ label: string; value: string }>;
  effects: EffectItem[];
};

const store = useDataStore();
const data = computed(() => store.data);
const selectedDetail = ref<DetailEntry | null>(null);

const equipmentLabels = {
  mainWeapon: '主武器',
  subWeapon: '副武器',
  head: '头部',
  chest: '躯干',
  hands: '手部',
  legs: '腿部',
  accessory1: '饰品1',
  accessory2: '饰品2',
} as const;

const supplyLabels = {
  ammo: '子弹',
  medkit: '医疗包',
  scrap: '废料',
  gold: '金币',
} as const;

const equipmentFallbackMeta: Record<string, ItemMetaSource> = {
  锈迹手枪: {
    slot: '主武器',
    grade: '普通',
    summary: '用旧船零件和废弃击发件拼出来的手枪，膛线磨损明显，但近距离仍有足够威慑力。',
    flavor: '枪身带着海风和铁锈味，握把边缘被反复打磨过，留下陈春璃自己修整的痕迹。',
    atk: 2,
    crit: 1,
    effects: [{ name: '粗糙膛线', description: '近距离射击时更容易打出致命命中，但连续射击稳定性一般。' }],
  },
  应急短刀: {
    slot: '副武器',
    grade: '普通',
    summary: '从旧船厨房和维修间拼出的应急短刀，适合贴身防卫和切割杂物。',
    flavor: '刀脊磨得很亮，刃口带着被反复修补的细纹，像废土里最朴素的求生工具。',
    atk: 1,
    speed: 1,
    effects: [{ name: '贴身防卫', description: '敌人近身时更容易快速反击，适合近距离补刀。' }],
  },
  破布头巾: {
    slot: '头部',
    grade: '普通',
    summary: '用旧布条缠成的头巾，挡不住重击，但能稍微缓冲风沙和碎屑。',
    flavor: '褪色布料吸饱了海盐和日晒味，边角缝线粗糙却很耐用。',
    def: 1,
    effects: [{ name: '碎屑缓冲', description: '面对轻微擦伤和飞溅碎片时，能减少一些干扰。' }],
  },
  废铁拼接护甲: {
    slot: '躯干',
    grade: '精制',
    summary: '由废船钢板和皮带拼接而成的胸甲，沉重但结实，是村民里少有的正经防具。',
    flavor: '钢片之间能看到反复铆接和补丁的痕迹，撞上去会发出闷响，像一身勉强撑起的安全感。',
    maxHp: 4,
    def: 1,
    effects: [{ name: '冲击削减', description: '受击时能吸收一部分正面冲击，提升生存余量。' }],
  },
  磨损手套: {
    slot: '手部',
    grade: '普通',
    summary: '掌心磨得起毛的旧手套，能保护双手，也让换弹和拆装更顺手。',
    flavor: '皮革边缘发硬开裂，却仍保留着长期使用后的贴手感。',
    speed: 1,
    effects: [{ name: '熟手触感', description: '换弹、拆装与抓握动作更稳定，减少细小失误。' }],
  },
  旧工装裤: {
    slot: '腿部',
    grade: '普通',
    summary: '结实耐磨的旧工装裤，方便在废船和礁滩之间快速活动。',
    flavor: '膝盖位置缝过几次补丁，裤脚沾着长期行走后的泥与盐。',
    speed: 1,
    effects: [{ name: '灵活移动', description: '在复杂地形中行动更利索，短距离腾挪更轻快。' }],
  },
  旧世界指南针: {
    slot: '饰品1',
    grade: '精制',
    summary: '旧时代留下的黄铜指南针，指针偶尔发飘，但在荒地里依旧很珍贵。',
    flavor: '金属盖板上布满细密划痕，打开时会发出轻轻一声脆响。',
    crit: 1,
    effects: [{ name: '方位校准', description: '保持方向感与判断力，在关键出手时更容易抓住时机。' }],
  },
  空: {
    slot: '饰品2',
    grade: '无',
    summary: '这个装备栏当前没有放入任何物品。',
    flavor: '空着的卡槽提醒着你，未来还有很多可以拾荒和升级的空间。',
    effects: [],
  },
};

const supplyFallbackMeta: Record<string, ItemMetaSource> = {
  ammo: {
    category: '补给',
    summary: '手枪弹药与临时装填子弹的总量，决定你能持续开火多久。',
    flavor: '每一发都来之不易，火药、弹壳和底火都带着废土里的稀缺意味。',
    effects: [{ name: '射击消耗', description: '远程攻击会持续消耗子弹，战斗后需要及时补充。' }],
  },
  medkit: {
    category: '医疗',
    summary: '基础医疗包，内含止血和包扎材料，用于战后应急恢复。',
    flavor: '药味很淡，绷带却被收拾得很整齐，显然是被人仔细节省着使用。',
    effects: [{ name: '应急处理', description: '可用于缓解受伤状态，稳定战后生命值。' }],
  },
  scrap: {
    category: '材料',
    summary: '来自废船、零件和损坏器件的废料，是制作与修补的基础资源。',
    flavor: '铁片、电缆、铆钉混杂在一起，看似零碎，却是废土里最实在的财富。',
    effects: [{ name: '制作素材', description: '可用于修理装备、制作武器和完成部分委托。' }],
  },
  gold: {
    category: '货币',
    summary: '流通用货币，可在聚落、猎人协会和商人之间交换补给或情报。',
    flavor: '在废土上，金币不仅是购买力，也是行动的底气。',
    effects: [{ name: '交易资源', description: '用于购买装备、补给、弹药和任务服务。' }],
  },
};

function percent(current: number, max: number) {
  if (!max) return '0%';
  return `${Math.max(0, Math.min(100, (current / max) * 100))}%`;
}

function collectStats(source: Record<string, unknown> | undefined) {
  if (!source) return [];
  const rows = [
    ['攻击', source.atk],
    ['防御', source.def],
    ['速度', source.speed],
    ['暴击', source.crit],
    ['生命', source.maxHp],
  ] as const;

  return rows
    .filter(([, value]) => Number(value || 0) > 0)
    .map(([label, value]) => ({
      label,
      value: label === '暴击' ? `+${value}%` : `+${value}`,
    }));
}

function mergeMeta(primary: ItemMetaSource | undefined, fallback: ItemMetaSource | undefined): ItemMetaSource {
  return {
    slot: primary?.slot || fallback?.slot || '',
    category: primary?.category || fallback?.category || '',
    grade: primary?.grade || fallback?.grade || '',
    summary: primary?.summary || fallback?.summary || '',
    flavor: primary?.flavor || fallback?.flavor || '',
    maxHp: Number(primary?.maxHp || fallback?.maxHp || 0),
    atk: Number(primary?.atk || fallback?.atk || 0),
    def: Number(primary?.def || fallback?.def || 0),
    speed: Number(primary?.speed || fallback?.speed || 0),
    crit: Number(primary?.crit || fallback?.crit || 0),
    effects:
      (Array.isArray(primary?.effects) && primary.effects.length ? primary.effects : undefined) ||
      (Array.isArray(fallback?.effects) ? fallback.effects : []),
  };
}

const equipmentEntries = computed<DetailEntry[]>(() => {
  if (!data.value) return [];

  return Object.entries(equipmentLabels).map(([key, label]) => {
    const name = data.value.equipment?.[key] || '空';
    const meta = mergeMeta(data.value.equipmentMeta?.[key], equipmentFallbackMeta[name]);

    return {
      key,
      kind: 'equipment',
      kindLabel: '装备',
      label,
      name,
      slotOrCategory: meta.slot || label,
      grade: meta.grade || '',
      summary: meta.summary || `${name} 当前暂无详细描述。`,
      flavor: meta.flavor || '',
      stats: collectStats(meta),
      effects: Array.isArray(meta.effects) ? meta.effects : [],
    };
  });
});

const supplyEntries = computed<DetailEntry[]>(() => {
  if (!data.value) return [];

  return Object.entries(supplyLabels).map(([key, label]) => {
    const meta = mergeMeta(data.value.supplyMeta?.[key], supplyFallbackMeta[key]);
    const value = data.value.player?.[key] ?? 0;

    return {
      key,
      kind: 'supply',
      kindLabel: '道具',
      label,
      name: data.value.supplyMeta?.[key]?.name || label,
      value,
      slotOrCategory: meta.category || '补给',
      summary: meta.summary || `${label} 当前暂无详细描述。`,
      flavor: meta.flavor || '',
      stats: [{ label: '持有', value: String(value) }],
      effects: Array.isArray(meta.effects) ? meta.effects : [],
    };
  });
});

const bonusNotes = computed<string[]>(() => data.value?.equipmentBonus?.notes || []);

function openDetail(entry: DetailEntry) {
  selectedDetail.value = entry;
}

function closeDetail() {
  selectedDetail.value = null;
}
</script>

<style scoped>
.hud {
  --bg-0: #070b10;
  --bg-1: #0c131c;
  --bg-2: #121b27;
  --line: rgba(131, 194, 234, 0.24);
  --line-strong: rgba(160, 228, 255, 0.45);
  --text-main: #eaf6ff;
  --text-sub: #93aabc;
  --cyan: #78d8ff;
  --teal: #59d8c6;
  --amber: #ffb36b;
  --danger: #ff9a62;
  position: relative;
  overflow: hidden;
  font-family: 'Bahnschrift', 'Segoe UI', 'Microsoft YaHei', sans-serif;
  color: var(--text-main);
  background:
    radial-gradient(circle at 10% -10%, rgba(72, 152, 201, 0.25), transparent 35%),
    radial-gradient(circle at 90% 0%, rgba(62, 108, 161, 0.22), transparent 40%),
    linear-gradient(150deg, var(--bg-0) 0%, var(--bg-1) 52%, var(--bg-2) 100%);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 14px;
  box-sizing: border-box;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.03),
    0 14px 40px rgba(3, 8, 16, 0.45);
}

.hud::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(transparent 94%, rgba(120, 216, 255, 0.08) 95%, transparent 96%);
  background-size: 100% 7px;
  opacity: 0.28;
}

.hero-card,
.panel,
.detail-modal {
  background: linear-gradient(165deg, rgba(17, 27, 39, 0.9), rgba(12, 18, 28, 0.94));
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px;
  backdrop-filter: blur(4px);
}

.hero-main,
.stats-row,
.item,
.bar-label,
.enemy-head,
.detail-head,
.section-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.chips,
.detail-stats,
.effects-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.bars,
.grid,
.list {
  display: grid;
  gap: 10px;
}

.grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 10px;
}

.chip {
  border-radius: 999px;
  padding: 4px 9px;
  font-size: 11px;
  letter-spacing: 0.08em;
  border: 1px solid rgba(120, 216, 255, 0.28);
  background: rgba(120, 216, 255, 0.08);
  color: #c2ecff;
  text-transform: uppercase;
}

.danger {
  color: #ffd7b7;
  border-color: rgba(255, 179, 107, 0.42);
  background: rgba(255, 179, 107, 0.1);
}

.bar {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: rgba(5, 12, 20, 0.85);
  border: 1px solid rgba(124, 189, 226, 0.2);
  overflow: hidden;
}

.fill {
  height: 100%;
  border-radius: inherit;
  box-shadow: 0 0 10px rgba(120, 216, 255, 0.25);
}

.hp {
  background: linear-gradient(90deg, #4dc4ff, #8de7ff);
}

.stamina {
  background: linear-gradient(90deg, #31bf9f, #7aefd5);
}

.exp {
  background: linear-gradient(90deg, #4d92ff, #85b2ff);
}

.enemy-fill {
  background: linear-gradient(90deg, #ff9a62, #ffd08a);
}

.item {
  align-items: center;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(136, 193, 227, 0.16);
  background: rgba(9, 18, 28, 0.82);
}

.item-button {
  width: 100%;
  position: relative;
  z-index: 1;
  pointer-events: auto;
  color: inherit;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.18s ease,
    transform 0.18s ease,
    background 0.18s ease;
}

.item-button:hover {
  border-color: rgba(120, 216, 255, 0.35);
  background: rgba(17, 31, 46, 0.92);
  transform: translateY(-1px);
}

.item-button.supply strong {
  color: #ffd7b7;
}

.hint,
.sub,
.meta,
.eyebrow,
.detail-kicker {
  margin: 0;
  color: var(--text-sub);
  font-size: 12px;
}

.eyebrow,
.detail-kicker {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #b7d9ea;
}

h1 {
  margin: 4px 0 2px;
  font-size: 22px;
  letter-spacing: 0.05em;
  font-weight: 650;
}

h2,
h3,
h4 {
  margin: 0;
  letter-spacing: 0.08em;
  font-weight: 650;
  color: #c5e8f9;
}

h2 {
  font-size: 13px;
  text-transform: uppercase;
}

h3 {
  font-size: 22px;
}

h4 {
  font-size: 12px;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.meta,
.bar-label,
.item span,
.hint {
  letter-spacing: 0.02em;
}

.stats-row span,
.detail-stat {
  background: rgba(120, 216, 255, 0.08);
  border: 1px solid rgba(120, 216, 255, 0.18);
  border-radius: 6px;
  padding: 4px 8px;
  color: #d4f2ff;
}

.stats-row.secondary span {
  color: #9fd7ef;
}

.detail-stat {
  min-width: 88px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.empty-state {
  padding: 9px;
  border-radius: 8px;
  color: #9eb7c7;
  border: 1px dashed rgba(131, 194, 234, 0.28);
  background: rgba(10, 17, 27, 0.8);
}

.inventory-panel {
  position: relative;
}

.detail-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(4, 8, 14, 0.68);
  backdrop-filter: blur(8px);
}

.detail-modal {
  width: min(560px, 100%);
  max-height: min(78vh, 720px);
  overflow: auto;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.38),
    inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.close-button {
  appearance: none;
  border: 1px solid rgba(120, 216, 255, 0.22);
  background: rgba(120, 216, 255, 0.08);
  color: var(--text-main);
  border-radius: 999px;
  padding: 6px 12px;
  cursor: pointer;
}

.detail-summary {
  margin: 14px 0 8px;
  line-height: 1.6;
  color: var(--text-main);
}

.detail-flavor {
  margin: 0 0 14px;
  line-height: 1.6;
  color: #a7c0cf;
}

.effects-block + .effects-block {
  margin-top: 14px;
}

.effect-card {
  flex: 1 1 220px;
  min-width: 180px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba(136, 193, 227, 0.16);
  background: rgba(9, 18, 28, 0.84);
}

.effect-card strong {
  display: block;
  margin-bottom: 4px;
  color: #d8f3ff;
}

.effect-card p {
  margin: 0;
  line-height: 1.55;
  color: var(--text-sub);
}

.effects-list.compact .effect-card {
  flex-basis: 100%;
}

@media (max-width: 720px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .detail-head,
  .hero-main,
  .stats-row,
  .section-head {
    flex-direction: column;
  }

  .detail-modal {
    max-height: 82vh;
  }
}
</style>
