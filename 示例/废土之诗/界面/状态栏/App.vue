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
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
  color: #f4efe5;
  background:
    radial-gradient(circle at top left, rgba(189, 117, 28, 0.32), transparent 32%),
    linear-gradient(135deg, #211813 0%, #31221c 45%, #171311 100%);
  border: 1px solid rgba(241, 176, 92, 0.28);
  border-radius: 18px;
  padding: 16px;
  box-sizing: border-box;
}

.hero-card,
.panel {
  background: rgba(23, 18, 15, 0.72);
  border: 1px solid rgba(220, 169, 88, 0.18);
  border-radius: 14px;
  padding: 14px;
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
}

.chip {
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  border: 1px solid rgba(239, 194, 117, 0.2);
  background: rgba(255, 255, 255, 0.04);
}

.danger {
  color: #ffd1b1;
  border-color: rgba(255, 120, 73, 0.3);
}

.bars,
.grid,
.list {
  display: grid;
  gap: 10px;
}

.grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 12px;
}

.bar {
  width: 100%;
  height: 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.fill {
  height: 100%;
  border-radius: inherit;
}

.hp { background: linear-gradient(90deg, #7e1717, #db5146); }
.stamina { background: linear-gradient(90deg, #5d7a19, #c8d75b); }
.exp { background: linear-gradient(90deg, #3f2f91, #7f7cff); }
.enemy-fill { background: linear-gradient(90deg, #672424, #f05e47); }

.item {
  align-items: center;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
}

.hint,
.sub,
.meta,
.eyebrow {
  margin: 0;
  color: #ccbca9;
  font-size: 12px;
}

.empty-state {
  padding: 10px;
  border-radius: 10px;
  color: #b8a896;
  background: rgba(255, 255, 255, 0.03);
}

@media (max-width: 720px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
