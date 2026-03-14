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
          <div class="bar"><div class="fill hp" :style="{ width: percent(data.player.hp, data.player.maxHp) }" /></div>
        </div>
        <div class="bar-block">
          <div class="bar-label"><span>体力</span><span>{{ data.player.stamina }}/100</span></div>
          <div class="bar"><div class="fill stamina" :style="{ width: `${data.player.stamina}%` }" /></div>
        </div>
        <div class="bar-block">
          <div class="bar-label"><span>经验</span><span>{{ data.player.exp }}/{{ data.player.expToNext }}</span></div>
          <div class="bar"><div class="fill exp" :style="{ width: percent(data.player.exp, data.player.expToNext) }" /></div>
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

      <article class="panel">
        <h2>装备与补给</h2>
        <div class="list">
          <div class="item"><span>主武器</span><strong>{{ data.equipment.mainWeapon }}</strong></div>
          <div class="item"><span>副武器</span><strong>{{ data.equipment.subWeapon }}</strong></div>
          <div class="item"><span>头部</span><strong>{{ data.equipment.head }}</strong></div>
          <div class="item"><span>躯干</span><strong>{{ data.equipment.chest }}</strong></div>
          <div class="item"><span>手部</span><strong>{{ data.equipment.hands }}</strong></div>
          <div class="item"><span>腿部</span><strong>{{ data.equipment.legs }}</strong></div>
          <div class="item"><span>饰品1</span><strong>{{ data.equipment.accessory1 }}</strong></div>
          <div class="item"><span>饰品2</span><strong>{{ data.equipment.accessory2 }}</strong></div>
          <div class="item"><span>子弹</span><strong>{{ data.player.ammo }}</strong></div>
          <div class="item"><span>医疗包</span><strong>{{ data.player.medkit }}</strong></div>
          <div class="item"><span>废料</span><strong>{{ data.player.scrap }}</strong></div>
          <div class="item"><span>金币</span><strong>{{ data.player.gold }}</strong></div>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from './store';

const store = useDataStore();
const data = computed(() => store.data);

function percent(current: number, max: number) {
  if (!max) return '0%';
  return `${Math.max(0, Math.min(100, (current / max) * 100))}%`;
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
.panel {
  background: linear-gradient(165deg, rgba(17, 27, 39, 0.86), rgba(12, 18, 28, 0.9));
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px;
  backdrop-filter: blur(4px);
}

.hero-main,
.stats-row,
.item,
.bar-label,
.enemy-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-content: flex-start;
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

.hp { background: linear-gradient(90deg, #4dc4ff, #8de7ff); }
.stamina { background: linear-gradient(90deg, #31bf9f, #7aefd5); }
.exp { background: linear-gradient(90deg, #4d92ff, #85b2ff); }
.enemy-fill { background: linear-gradient(90deg, #ff9a62, #ffd08a); }

.item {
  align-items: center;
  padding: 7px 9px;
  border-radius: 8px;
  border: 1px solid rgba(136, 193, 227, 0.16);
  background: rgba(9, 18, 28, 0.82);
}

.hint,
.sub,
.meta,
.eyebrow {
  margin: 0;
  color: var(--text-sub);
  font-size: 12px;
}

.eyebrow {
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

h2 {
  margin: 0 0 8px;
  font-size: 13px;
  letter-spacing: 0.1em;
  font-weight: 650;
  text-transform: uppercase;
  color: #c5e8f9;
}

.meta,
.bar-label,
.item span,
.hint {
  letter-spacing: 0.02em;
}

.bar-label span:first-child {
  color: #c8e8fb;
}

.bar-label span:last-child {
  color: #9fc0d2;
}

.stats-row span {
  background: rgba(120, 216, 255, 0.08);
  border: 1px solid rgba(120, 216, 255, 0.18);
  border-radius: 6px;
  padding: 4px 8px;
  color: #d4f2ff;
}

.enemy-head strong {
  color: #ffdbbe;
}

.empty-state {
  padding: 9px;
  border-radius: 8px;
  color: #9eb7c7;
  border: 1px dashed rgba(131, 194, 234, 0.28);
  background: rgba(10, 17, 27, 0.8);
}

@media (max-width: 720px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
