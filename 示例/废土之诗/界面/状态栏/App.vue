<template>
  <div class="hud" v-if="data">
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
          <span class="chip" v-if="data.combat.inBattle">Round {{ data.combat.round }}</span>
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
          <span>词条 {{ (data.equipmentBonus?.notes || []).length }}</span>
        </div>
        <div class="enemy" v-if="data.combat.inBattle">
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
            @click="openDetail(entry)"
          >
            <span>{{ entry.label }}</span>
            <strong>{{ entry.name }}</strong>
          </button>
          <button
            v-for="entry in supplyEntries"
            :key="entry.key"
            type="button"
            class="item item-button supply"
            @click="openDetail(entry)"
          >
            <span>{{ entry.label }}</span>
            <strong>{{ entry.value }}</strong>
          </button>
        </div>
      </article>
    </section>

    <div v-if="selectedDetail" class="detail-backdrop" @click.self="closeDetail">
      <article class="detail-modal">
        <div class="detail-head">
          <div>
            <p class="detail-kicker">{{ selectedDetail.kindLabel }} | {{ selectedDetail.slotOrCategory }}</p>
            <h3>{{ selectedDetail.name }}</h3>
            <p class="hint" v-if="selectedDetail.grade">{{ selectedDetail.grade }}</p>
          </div>
          <button type="button" class="close-button" @click="closeDetail">关闭</button>
        </div>

        <p class="detail-summary">{{ selectedDetail.summary }}</p>
        <p class="detail-flavor" v-if="selectedDetail.flavor">{{ selectedDetail.flavor }}</p>

        <div class="detail-stats" v-if="selectedDetail.stats.length">
          <div v-for="stat in selectedDetail.stats" :key="stat.label" class="detail-stat">
            <span>{{ stat.label }}</span>
            <strong>{{ stat.value }}</strong>
          </div>
        </div>

        <div class="effects-block" v-if="selectedDetail.effects.length">
          <h4>效果词条</h4>
          <div class="effects-list">
            <div v-for="effect in selectedDetail.effects" :key="effect.name" class="effect-card">
              <strong>{{ effect.name }}</strong>
              <p>{{ effect.description }}</p>
            </div>
          </div>
        </div>

        <div class="effects-block" v-if="selectedDetail.kind === 'equipment' && bonusNotes.length">
          <h4>当前装备总加成摘要</h4>
          <div class="effects-list compact">
            <div v-for="note in bonusNotes" :key="note" class="effect-card">
              <p>{{ note }}</p>
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDataStore } from './store';

type EffectItem = {
  name: string;
  description: string;
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

const equipmentEntries = computed<DetailEntry[]>(() => {
  if (!data.value) return [];

  return Object.entries(equipmentLabels).map(([key, label]) => {
    const name = data.value.equipment?.[key] || '空';
    const meta = data.value.equipmentMeta?.[key] || {};

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
    const meta = data.value.supplyMeta?.[key] || {};
    const value = data.value.player?.[key] ?? 0;

    return {
      key,
      kind: 'supply',
      kindLabel: '道具',
      label,
      name: meta.name || label,
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
