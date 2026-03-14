<template>
  <div class="status-page" :class="{ 'showing-chen': isShowingChen, 'showing-gear': activeBottomTab === 'gear' }">
    <div class="status-page-scaled">
      <!-- 装备与道具界面：仅供黄晓林使用，装备数据在黄晓林面板（攻击/防御等）呈现 -->
      <div v-if="activeBottomTab === 'gear'" class="gear-content-area">
        <div class="gear-panel visual-card">
          <div class="gear-map" aria-label="黄晓林装备位图">
            <div class="gear-empty-box" :class="`gear-empty-box-${gearEmptyBoxStage}`">{{ gearEmptyBoxText.slice(0, 2) }}<br />{{ gearEmptyBoxText.slice(2) }}</div>
            <button
              type="button"
              class="gear-gift-btn"
              aria-label="幸运大抽奖"
              title="幸运大抽奖"
              @click="openLuckyDraw"
            >
              <i class="fa-solid fa-gift" aria-hidden="true"></i>
            </button>

            <div
              v-for="slotDef in ALL_MAP_GEAR_SLOTS"
              :key="slotDef.key"
              :class="[
                'gear-slot-node',
                `gear-slot-${slotDef.cssKey}`,
                { 'gear-slot-equipped': !!getEquippedInSlot(slotDef.key) },
                getEquippedSlotRarityClass(slotDef.key),
              ]"
              :role="getEquippedInSlot(slotDef.key) ? 'button' : undefined"
              :tabindex="getEquippedInSlot(slotDef.key) ? 0 : undefined"
              :title="getEquippedInSlot(slotDef.key) || slotDef.label"
              @click="getEquippedInSlot(slotDef.key) && openEquippedSlotDetail(slotDef.key)"
              @keydown.enter.prevent="getEquippedInSlot(slotDef.key) && openEquippedSlotDetail(slotDef.key)"
            >
              <span
                v-if="getEquippedInSlot(slotDef.key)"
                :class="['gear-slot-tooltip', getEquippedSlotTooltipRarityClass(slotDef.key)]"
              >{{ getEquippedInSlot(slotDef.key) }}</span>
              <span class="gear-slot-label-wrap" aria-hidden="true">
                <i :class="['gear-slot-label-icon', slotToIcon(slotDef.key)]"></i>
                <span class="gear-slot-label-text">{{ slotDef.key === 'Trinket1' ? '饰物1' : slotDef.key === 'Trinket2' ? '饰物2' : slotDef.label }}</span>
              </span>
              <!-- 槽内不显示装备名（避免蓝色文字裁切残留），仅悬停气泡显示完整名称 -->
              <span class="gear-slot-content" :title="getEquippedInSlot(slotDef.key) || ''">
                <span class="gear-slot-content-inner"></span>
              </span>
            </div>

            <div class="gear-line" aria-hidden="true"></div>
          </div>
        </div>
        <div class="gear-storage-panel" aria-label="黄晓林装备栏与道具栏">
          <div class="gear-storage-tabs">
            <div
              :class="['gear-storage-tab', { 'gear-storage-tab-active': activeStorageTab === 'gear' }]"
              role="button"
              tabindex="0"
              @click="activeStorageTab = 'gear'"
              @keydown.enter.prevent="activeStorageTab = 'gear'"
            >
              <i class="fas fa-vest gear-storage-tab-icon" aria-hidden="true"></i>
              装备栏
            </div>
            <div
              :class="['gear-storage-tab', { 'gear-storage-tab-active': activeStorageTab === 'tool' }]"
              role="button"
              tabindex="0"
              @click="activeStorageTab = 'tool'"
              @keydown.enter.prevent="activeStorageTab = 'tool'"
            >
              <i class="fas fa-cube gear-storage-tab-icon" aria-hidden="true"></i>
              道具栏
            </div>
          </div>
          <div class="gear-storage-body">
            <!-- 装备栏 -->
            <template v-if="activeStorageTab === 'gear'">
              <div v-if="inventoryItems.length === 0" class="gear-storage-empty">装备物品为空</div>
              <div v-else class="gear-storage-items">
                <div
                  v-for="entry in inventoryItems"
                  :key="entry.itemName"
                  :class="['gear-item-card', entry.rarityClass]"
                  role="button"
                  tabindex="0"
                  :aria-label="`穿戴装备：${entry.itemName}`"
                  @click="openInventoryItemDetail(entry.itemName)"
                  @keydown.enter.prevent="openInventoryItemDetail(entry.itemName)"
                  @keydown.space.prevent="openInventoryItemDetail(entry.itemName)"
                >
                  <div class="gear-item-surface">
                    <div class="gear-item-icon-wrap">
                      <i :class="['gear-item-icon', entry.iconClass]" aria-hidden="true"></i>
                    </div>
                    <div class="gear-item-name">{{ entry.itemName }}</div>
                    <div :class="['gear-item-rarity', entry.rarityBarClass]" aria-hidden="true"></div>
                  </div>
                </div>
              </div>
            </template>
            <!-- 道具栏 -->
            <template v-else>
              <div v-if="toolItems.length === 0" class="gear-storage-empty">道具物品为空</div>
              <div v-else class="gear-storage-items">
                <div
                  v-for="entry in toolItems"
                  :key="entry.itemName"
                  :class="['gear-item-card', entry.rarityClass]"
                  role="button"
                  tabindex="0"
                  :aria-label="`查看道具：${entry.itemName}`"
                  @click="openToolItemDetail(entry.itemName)"
                  @keydown.enter.prevent="openToolItemDetail(entry.itemName)"
                  @keydown.space.prevent="openToolItemDetail(entry.itemName)"
                >
                  <div class="gear-item-surface">
                    <div class="gear-item-icon-wrap">
                      <i :class="['gear-item-icon', entry.iconClass]" aria-hidden="true"></i>
                    </div>
                    <div class="gear-item-name">{{ entry.itemName }}</div>
                    <div :class="['gear-item-rarity', entry.rarityBarClass]" aria-hidden="true"></div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 世界信息选项卡：S市势力信息四卡片 + 小道消息/重要情报/任务列表 子选项卡 -->
      <div v-if="activeBottomTab === 'world'" class="world-info-content visual-card">
        <div
          ref="factionCardsScrollRef"
          class="world-info-cards-wrap"
          @mousedown="onFactionCardsMouseDown"
        >
          <div
            v-for="faction in factionList"
            :key="faction.名称"
            class="world-info-card"
          >
            <div class="world-info-card-header">
              <i
                :class="['world-info-faction-type', factionTypeIcon(faction.类型)]"
                :title="(faction.类型 || '中型') + '势力'"
                aria-hidden="true"
              ></i>
              <span class="world-info-card-header-title">{{ faction.名称 }}</span>
            </div>
            <div class="world-info-card-body">
              <div class="world-info-row">
                <span class="world-info-label"><i class="fas fa-user-tie world-info-icon" aria-hidden="true"></i>领袖:</span>
                <span class="world-info-value">{{ faction.领袖 || '—' }}</span>
              </div>
              <div class="world-info-row">
                <span class="world-info-label"><i class="fas fa-users world-info-icon" aria-hidden="true"></i>人数:</span>
                <span class="world-info-value">{{ faction.人数 || '—' }}</span>
              </div>
              <div class="world-info-row">
                <span class="world-info-label"><i class="fas fa-book-open world-info-icon" aria-hidden="true"></i>背景:</span>
                <span class="world-info-value">{{ faction.背景 || '—' }}</span>
              </div>
              <div class="world-info-row">
                <span class="world-info-label"><i class="fas fa-map-marker-alt world-info-icon" aria-hidden="true"></i>地点:</span>
                <span class="world-info-value">{{ faction.地点 || '—' }}</span>
              </div>
            </div>
            <div class="world-info-card-activity">
              <span class="world-info-label"><i class="fas fa-clock world-info-icon" aria-hidden="true"></i>近期活动:</span>
              <span class="world-info-value">{{ faction.近期活动 || '—' }}</span>
            </div>
          </div>
        </div>

        <!-- 子选项卡：小道消息、重要情报、任务列表 -->
        <div class="world-info-subtabs">
          <button
            type="button"
            :class="['world-info-subtab', { active: activeWorldSubtab === 'gossip' }]"
            @click="activeWorldSubtab = 'gossip'"
          >
            <i class="fas fa-comments world-info-subtab-icon" aria-hidden="true"></i>
            小道消息
          </button>
          <button
            type="button"
            :class="['world-info-subtab', { active: activeWorldSubtab === 'intel' }]"
            @click="activeWorldSubtab = 'intel'"
          >
            <i class="fas fa-circle-info world-info-subtab-icon" aria-hidden="true"></i>
            重要情报
          </button>
          <button
            type="button"
            :class="['world-info-subtab', { active: activeWorldSubtab === 'tasks' }]"
            @click="activeWorldSubtab = 'tasks'"
          >
            <i class="fas fa-list-check world-info-subtab-icon" aria-hidden="true"></i>
            任务列表
          </button>
        </div>

        <!-- 小道消息：可滚动列表，每条含 标题、来源、内容 -->
        <div v-show="activeWorldSubtab === 'gossip'" class="world-info-subpanel world-info-gossip">
          <div v-if="gossipList.length === 0" class="world-info-empty">暂无小道消息</div>
          <div v-else class="world-info-gossip-scroll">
            <article
              v-for="(item, index) in gossipList"
              :key="index"
              class="world-info-gossip-card"
            >
              <div class="world-info-gossip-head">
                <span class="world-info-gossip-title">{{ item.标题 || '无标题' }}</span>
                <span class="world-info-gossip-source">
                  <i class="fas fa-user world-info-gossip-source-icon" aria-hidden="true"></i>
                  {{ item.来源 || '—' }}
                </span>
              </div>
              <p class="world-info-gossip-body">{{ item.内容 || '—' }}</p>
            </article>
          </div>
        </div>

        <!-- 重要情报、任务列表：占位，后续实现 -->
        <div v-show="activeWorldSubtab === 'intel'" class="world-info-subpanel">
          <div class="world-info-empty">敬请期待</div>
        </div>
        <div v-show="activeWorldSubtab === 'tasks'" class="world-info-subpanel">
          <div class="world-info-empty">敬请期待</div>
        </div>
      </div>

      <!-- 队伍栏：与世界信息同款底部容器，展示队友卡片；添加新队友即自动加入，属性/装备/技能随该队友数据更新 -->
      <div v-if="activeBottomTab === 'team'" class="team-content">
        <div v-if="teamMembers.length === 0" class="team-empty">暂无队友</div>
        <template v-else>
          <input
            ref="teamAvatarInputRef"
            type="file"
            accept="image/*"
            class="avatar-input"
            aria-hidden="true"
            @change="onTeamAvatarChange"
          />
          <div
            v-for="memberId in teamMembers"
            :key="memberId"
            class="team-member-card visual-card"
            :class="{ 'team-member-card-expanded': expandedTeamMemberId === memberId }"
          >
            <div
              class="team-card-head"
              role="button"
              tabindex="0"
              :aria-expanded="expandedTeamMemberId === memberId"
              @click="toggleTeamCardExpand(memberId)"
              @keydown.enter.prevent="toggleTeamCardExpand(memberId)"
              @keydown.space.prevent="toggleTeamCardExpand(memberId)"
            >
              <div class="card-top">
                <div class="card-left">
                  <div
                    class="card-avatar"
                    role="button"
                    tabindex="0"
                    :aria-label="`上传${memberId}头像`"
                    @click.stop="triggerTeamAvatarInput(memberId)"
                    @keydown.enter.prevent="triggerTeamAvatarInput(memberId)"
                    @keydown.space.prevent="triggerTeamAvatarInput(memberId)"
                  >
                    <img v-if="getTeamAvatarUrl(memberId)" :src="getTeamAvatarUrl(memberId)!" :alt="`${memberId}头像`" />
                    <div v-else class="placeholder">
                      <i class="fas fa-user"></i>
                    </div>
                  </div>
                  <div class="card-info">
                    <h1 class="card-name">{{ teamMemberDisplay(memberId).name }}</h1>
                    <div class="card-identity-pill">
                      <span class="card-lv">LV:{{ teamMemberDisplay(memberId).level }}</span>
                      <span class="card-race">{{ teamMemberDisplay(memberId).race }}</span>
                    </div>
                    <p class="card-meta-row">职业：{{ teamMemberDisplay(memberId).profession }}</p>
                    <p class="card-meta-row">熟练度：+{{ teamMemberDisplay(memberId).proficiency }}</p>
                  </div>
                </div>
                <div class="card-combat">
                  <div class="row">
                    <svg class="atk-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <g fill="currentColor" transform="rotate(45 12 12)">
                        <polygon points="12,2 15,5.5 9,5.5"></polygon>
                        <rect x="10.5" y="5.2" width="3" height="10.2" rx="1"></rect>
                        <rect x="7" y="14.6" width="10" height="2.4" rx="1"></rect>
                        <rect x="11" y="16.6" width="2" height="4.2" rx="1"></rect>
                        <circle cx="12" cy="22" r="1.6"></circle>
                      </g>
                    </svg>
                    <div class="card-combat-text">
                      <span class="card-combat-label">攻击(ATK)</span>
                      <span class="card-combat-value">{{ teamMemberDisplay(memberId).atk }}</span>
                    </div>
                  </div>
                  <div class="row">
                    <i class="fas fa-shield-alt"></i>
                    <div class="card-combat-text">
                      <span class="card-combat-label">防御(DEL)</span>
                      <span class="card-combat-value">{{ teamMemberDisplay(memberId).def }}</span>
                    </div>
                  </div>
                </div>
                <div class="card-right">
                  <div class="card-life-title">生命状态检测</div>
                  <div class="card-rings">
                    <div class="ring-item hp">
                      <div class="ring" :style="{ '--pct': teamMemberDisplay(memberId).hpPercent }">
                        <i class="fas fa-heart"></i>
                      </div>
                      <span class="ring-label">HP:{{ teamMemberDisplay(memberId).currentHp }}/{{ teamMemberDisplay(memberId).maxHp }}</span>
                    </div>
                    <div class="ring-item sp favor">
                      <div class="ring" :style="{ '--pct': teamMemberDisplay(memberId).favorPercent }">
                        <i class="fas fa-heart"></i>
                      </div>
                      <span class="ring-label">好感度:{{ teamMemberDisplay(memberId).favorPercent }}%</span>
                    </div>
                    <div class="ring-item sanity">
                      <div class="ring" :style="{ '--pct': teamMemberDisplay(memberId).sanityPercent }">
                        <i class="fas fa-arrow-up"></i>
                      </div>
                      <span class="ring-label">理智:{{ teamMemberDisplay(memberId).sanityPercent }}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="card-exp">
                <div class="card-exp-row">
                  <span class="card-exp-label">EXP</span>
                  <div class="card-exp-bar">
                    <div class="card-exp-fill" :style="{ width: teamMemberDisplay(memberId).expBarPercent + '%' }"></div>
                  </div>
                  <span class="card-exp-value">{{ teamMemberDisplay(memberId).expDisplay }}/{{ teamMemberDisplay(memberId).expNextLevel }}</span>
                </div>
              </div>
              <div class="card-bottom">
                <div class="card-quote">{{ teamMemberDisplay(memberId).personalThought || '.......' }}</div>
                <i
                  class="team-card-chevron fas fa-chevron-down"
                  aria-hidden="true"
                ></i>
              </div>
            </div>
            <!-- 下拉：六维属性 + 装备技能（随该队友数据更新） -->
            <div v-show="expandedTeamMemberId === memberId" class="team-card-expand">
              <div class="attr-bar">
                <div v-for="item in attrList" :key="item.key" class="attr-item">
                  <i :class="[item.icon, 'attr-icon']"></i>
                  <div class="attr-text">
                    <span class="attr-label">{{ item.label }}</span>
                    <span class="attr-value">{{ teamMemberAttrValue(memberId, item.key) }}</span>
                  </div>
                </div>
              </div>
              <div class="chen-equip-block">
                <div class="chen-equip-col">
                  <span class="chen-equip-label">武器</span>
                  <div class="chen-equip-content">
                    <span
                      :class="['chen-pill', 'chen-pill-weapon', 'chen-pill-clickable', getGradeClass(getTeamMemberData(memberId)?.武器?.品级)]"
                      @click.stop="openEquipDetailFromTeam('weapon', memberId)"
                      >{{ (getTeamMemberData(memberId)?.武器?.名称 ?? '—') }}</span
                    >
                    <span v-if="getTeamMemberData(memberId)?.武器?.加成" class="chen-pill chen-pill-bonus">{{ getTeamMemberData(memberId)?.武器?.加成 }}</span>
                  </div>
                </div>
                <div class="chen-equip-col">
                  <span class="chen-equip-label">躯干</span>
                  <div class="chen-equip-content">
                    <span
                      :class="['chen-pill', 'chen-pill-armor', 'chen-pill-clickable', getGradeClass((getTeamMemberData(memberId)?.躯干 ?? getTeamMemberData(memberId)?.护甲)?.品级)]"
                      @click.stop="openEquipDetailFromTeam('torso', memberId)"
                      >{{ (getTeamMemberData(memberId)?.躯干 ?? getTeamMemberData(memberId)?.护甲)?.名称 ?? '—' }}</span
                    >
                    <span v-if="(getTeamMemberData(memberId)?.躯干 ?? getTeamMemberData(memberId)?.护甲)?.加成" class="chen-pill chen-pill-bonus">{{ (getTeamMemberData(memberId)?.躯干 ?? getTeamMemberData(memberId)?.护甲)?.加成 }}</span>
                  </div>
                </div>
                <div class="chen-equip-col">
                  <span class="chen-equip-label">技能</span>
                  <div class="chen-equip-content">
                    <span class="chen-pill chen-pill-skill">{{ getTeamMemberData(memberId)?.技能 ?? '—' }}</span>
                  </div>
                </div>
                <div class="chen-equip-col">
                  <span class="chen-equip-label">奥义</span>
                  <div class="chen-equip-content">
                    <span class="chen-pill chen-pill-ultimate">{{ getTeamMemberData(memberId)?.奥义 ?? '—' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 黄晓林面板与六维属性（非 gear、非 world、非 team 选项卡时显示） -->
      <div v-if="activeBottomTab !== 'gear' && activeBottomTab !== 'world' && activeBottomTab !== 'team'" class="visual-card">
        <!-- 上半部分：左侧头像+信息 | 右侧生命状态检测 -->
        <div class="card-top">
          <div class="card-left">
            <div v-if="isShowingChen" class="card-avatar" @click="triggerAvatarInputChen">
              <img v-if="avatarUrlChen" :src="avatarUrlChen" alt="陈莹姬头像" />
              <div v-else class="placeholder">
                <i class="fas fa-user"></i>
              </div>
              <input
                ref="avatarInputRefChen"
                type="file"
                accept="image/*"
                class="avatar-input"
                @change="onAvatarChangeChen"
              />
            </div>
            <div v-else class="card-avatar" @click="triggerAvatarInput">
              <img v-if="avatarUrl" :src="avatarUrl" alt="黄晓林头像" />
              <div v-else class="placeholder">
                <i class="fas fa-user"></i>
              </div>
              <input ref="avatarInputRef" type="file" accept="image/*" class="avatar-input" @change="onAvatarChange" />
            </div>
            <div class="card-info">
              <h1 class="card-name">{{ cardName }}</h1>
              <div class="card-identity-pill">
                <span class="card-lv">LV:{{ cardLevel }}</span>
                <span class="card-race">种族：{{ cardRace }}</span>
              </div>
              <p class="card-meta-row">职业：{{ cardProfession }} 熟练度：+{{ cardProficiency }}</p>
              <div class="card-combat">
                <div class="row">
                  <svg class="atk-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <g fill="currentColor" transform="rotate(45 12 12)">
                      <polygon points="12,2 15,5.5 9,5.5"></polygon>
                      <rect x="10.5" y="5.2" width="3" height="10.2" rx="1"></rect>
                      <rect x="7" y="14.6" width="10" height="2.4" rx="1"></rect>
                      <rect x="11" y="16.6" width="2" height="4.2" rx="1"></rect>
                      <circle cx="12" cy="22" r="1.6"></circle>
                    </g>
                  </svg>
                  <span>攻击(ATK) {{ atkDisplay }}</span>
                </div>
                <div class="row">
                  <i class="fas fa-shield-alt"></i>
                  <span>防御(DEL) {{ defDisplay }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="card-right">
            <div class="card-life-title">生命状态检测</div>
            <div class="card-rings">
              <div class="ring-item hp">
                <div class="ring" :style="{ '--pct': hpPercent }">
                  <i class="fas fa-heart"></i>
                </div>
                <span class="ring-label">HP:{{ currentHp }}/{{ maxHp }}</span>
              </div>
              <div class="ring-item sp" :class="{ favor: isShowingChen }">
                <div class="ring" :style="{ '--pct': spPercent }">
                  <i :class="isShowingChen ? 'fas fa-heart' : 'fas fa-bolt'"></i>
                </div>
                <span class="ring-label">{{ isShowingChen ? '好感度:' : 'SP:' }}{{ spPercent }}%</span>
              </div>
              <div class="ring-item sanity">
                <div class="ring" :style="{ '--pct': sanityPercent }">
                  <i class="fas fa-arrow-up"></i>
                </div>
                <span class="ring-label">理智:{{ sanityPercent }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- EXP 条 -->
        <div class="card-exp">
          <div class="card-exp-row">
            <span class="card-exp-label">EXP</span>
            <div class="card-exp-bar">
              <div class="card-exp-fill" :style="{ width: expBarPercent + '%' }"></div>
            </div>
            <span class="card-exp-value">{{ expDisplay }}/{{ expNextLevel }}</span>
          </div>
        </div>

        <!-- 叙述 + 货币（陈莹姬不显示废土券） -->
        <div class="card-bottom">
          <div class="card-quote">{{ personalThought }}</div>
          <div v-if="!isShowingChen" class="card-currency-wrap">
            <div class="card-currency">
              <svg class="currency-icon" viewBox="0 0 64 48" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M10 4h44c3.3 0 6 2.7 6 6v6.2c-2.8.4-5 2.8-5 5.8s2.2 5.4 5 5.8V34c0 3.3-2.7 6-6 6H10c-3.3 0-6-2.7-6-6v-6.2c2.8-.4 5-2.8 5-5.8s-2.2-5.4-5-5.8V10c0-3.3 2.7-6 6-6z"
                ></path>
                <path
                  fill="#fff7ea"
                  opacity="0.22"
                  d="M14 10h36a2 2 0 0 1 0 4H14a2 2 0 0 1 0-4zm0 24h36a2 2 0 0 1 0 4H14a2 2 0 0 1 0-4z"
                ></path>
                <path
                  fill="#fff7ea"
                  d="M32 13.2l2.3 4.6 5 .7-3.6 3.5.9 4.9-4.6-2.4-4.6 2.4.9-4.9-3.6-3.5 5-.7 2.3-4.6z"
                ></path>
                <path
                  fill="#fff7ea"
                  d="M24.8 28.5h14.4c1 0 1.8.8 1.8 1.8s-.8 1.8-1.8 1.8H24.8c-1 0-1.8-.8-1.8-1.8s.8-1.8 1.8-1.8z"
                ></path>
                <path
                  fill="#fff7ea"
                  d="M17 18.5a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4zm0 10.4a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4zm30 0a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4zm0-10.4a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4z"
                ></path>
              </svg>
              <div class="card-currency-text">
                <span class="card-currency-label">废土券</span>
                <span class="card-currency-value" :title="isShowingChen ? '' : String(store.data.主角?.货币 ?? 0)">
                  {{ currencyDisplay }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 六维属性条（非 gear、非 world、非 team 时显示） -->
      <div v-if="activeBottomTab !== 'gear' && activeBottomTab !== 'world' && activeBottomTab !== 'team'" class="attr-bar">
        <div v-for="item in attrList" :key="item.key" class="attr-item">
          <i :class="[item.icon, 'attr-icon']"></i>
          <div class="attr-text">
            <span class="attr-label">{{ item.label }}</span>
            <span class="attr-value">{{ attrValue(item.key) }}</span>
          </div>
        </div>
      </div>

      <!-- 陈莹姬：武器 / 躯干 / 技能 / 奥义（与图片 1:1：左标题 + 右 stacked pills，点击武器/躯干名称弹出详情） -->
      <div v-if="activeBottomTab !== 'gear' && activeBottomTab !== 'world' && activeBottomTab !== 'team' && isShowingChen" class="chen-equip-block">
        <div class="chen-equip-col">
          <span class="chen-equip-label">武器</span>
          <div class="chen-equip-content">
            <span
              :class="['chen-pill', 'chen-pill-weapon', 'chen-pill-clickable', chenWeaponGradeClass]"
              @click="openEquipDetail('weapon')"
              >{{ chenWeapon.名称 }}</span
            >
            <span v-if="chenWeapon.加成" class="chen-pill chen-pill-bonus">{{ chenWeapon.加成 }}</span>
          </div>
        </div>
        <div class="chen-equip-col">
          <span class="chen-equip-label">躯干</span>
          <div class="chen-equip-content">
            <span
              :class="['chen-pill', 'chen-pill-armor', 'chen-pill-clickable', chenTorsoGradeClass]"
              @click="openEquipDetail('torso')"
              >{{ chenTorso.名称 }}</span
            >
            <span v-if="chenTorso.加成" class="chen-pill chen-pill-bonus">{{ chenTorso.加成 }}</span>
          </div>
        </div>
        <div class="chen-equip-col">
          <span class="chen-equip-label">技能</span>
          <div class="chen-equip-content">
            <span class="chen-pill chen-pill-skill">{{ chenSkill }}</span>
          </div>
        </div>
        <div class="chen-equip-col">
          <span class="chen-equip-label">奥义</span>
          <div class="chen-equip-content">
            <span class="chen-pill chen-pill-ultimate">{{ chenUltimate }}</span>
          </div>
        </div>
      </div>

      <!-- 特质 + 技能（陈莹姬无特质/技能，隐藏） -->
      <div v-if="activeBottomTab !== 'gear' && activeBottomTab !== 'world' && activeBottomTab !== 'team' && !isShowingChen" class="traits-skills-block">
        <div class="ts-row traits-row">
          <span class="ts-label">特质</span>
          <div class="ts-slots trait-slots">
            <div
              v-for="i in TRAIT_SLOT_COUNT"
              :key="'t-' + i"
              class="ts-slot trait-slot"
              :class="{ filled: (store.data.主角?.特质 ?? [])[i - 1] }"
            >
              {{ (store.data.主角?.特质 ?? [])[i - 1] || '' }}
            </div>
          </div>
          <div class="ts-rp-wrap">
            <button type="button" class="ts-rp-cart" title="打开特质商店" @click="openTraitShop">
              <i class="fas fa-shopping-cart"></i>
            </button>
          </div>
        </div>
        <div class="ts-row skills-row">
          <span class="ts-label skill-label">技能</span>
          <div class="ts-slots">
            <button
              v-for="j in 4"
              :key="'s-' + j"
              type="button"
              class="ts-slot skill-slot"
              :class="{
                filled: skillList[j - 1],
                actionable: skillQuickReleaseOpen && skillList[j - 1],
              }"
              :title="skillList[j - 1] ? `释放${skillList[j - 1]}技能` : '空技能槽'"
              @click="onSkillSlotClick(skillList[j - 1])"
            >
              {{ skillList[j - 1] || '' }}
            </button>
            <button
              type="button"
              class="ts-slot skill-slot skill-add"
              :class="{ active: skillQuickReleaseOpen }"
              :title="skillQuickReleaseOpen ? '收起技能快速释放' : '展开技能快速释放'"
              @click="toggleSkillQuickRelease"
            >
              <i class="fas fa-hand-point-left"></i>
            </button>
          </div>
        </div>
        <div v-if="skillQuickReleaseOpen" class="skills-helper-row">
          <span class="skills-helper-text">点击技能快速释放</span>
        </div>
      </div>

      <!-- 外部容器：金属框、时间、地点（随变量更新） -->
      <div class="status-layout">
        <span class="status-time">
          <span class="status-icon status-icon-clock" aria-hidden="true"></span>
          <span>{{ store.data.世界?.当前时间 || '—' }}</span>
        </span>
        <span class="status-location">
          <span class="status-icon status-icon-pin" aria-hidden="true"></span>
          <span>{{ store.data.世界?.当前地点 || '—' }}</span>
        </span>
      </div>
      <!-- 底部选项卡：置于金属容器后面（z-index: -1） -->
      <div class="status-bottom-tabs">
        <button
          v-for="tab in visibleBottomTabs"
          :key="tab.key"
          type="button"
          class="status-bottom-tab"
          :class="{ active: activeBottomTab === tab.key }"
          @click="setActiveBottomTab(tab)"
        >
          {{ getTabLabel(tab) }}
        </button>
      </div>
    </div>

    <!-- 陈莹姬装备详情弹窗（武器/躯干） -->
    <Transition name="popup-fade">
      <div v-if="equipDetailOpen" class="equip-detail-overlay" @click="closeEquipDetail">
        <div class="equip-detail-modal" @click.stop>
          <div class="equip-detail-card" :class="equipDetailType">
            <div class="equip-detail-tab" :class="equipDetailTabClass">
              {{ equipDetailItem?.品级 || '' }}
            </div>
            <div class="equip-detail-header">
              <h2 class="equip-detail-title">{{ equipDetailItem?.名称 || '' }}</h2>
              <span v-if="equipDetailItem?.装备部位" class="equip-detail-slot">{{ equipDetailItem.装备部位 }}</span>
            </div>
            <div class="equip-detail-stats">
              <div v-if="equipDetailType === 'weapon' && equipDetailItem?.基础攻击" class="equip-detail-row">
                <span class="equip-detail-label">基础攻击</span>
                <span class="equip-detail-value">{{ equipDetailItem.基础攻击 }}</span>
              </div>
              <div v-if="equipDetailType === 'weapon' && equipDetailItem?.伤害骰" class="equip-detail-row">
                <span class="equip-detail-label">伤害骰</span>
                <span class="equip-detail-value equip-detail-dice">{{ equipDetailItem.伤害骰 }}</span>
              </div>
              <div v-if="equipDetailType === 'torso' && equipDetailItem?.基础防御" class="equip-detail-row">
                <span class="equip-detail-label">基础防御</span>
                <span class="equip-detail-value">{{ equipDetailItem.基础防御 }}</span>
              </div>
              <div v-if="equipDetailItem?.加成" class="equip-detail-row">
                <span class="equip-detail-label">属性加成</span>
                <span class="equip-detail-value">{{ equipDetailItem.加成 }}</span>
              </div>
            </div>
            <div v-if="equipDetailEffects.length" class="equip-detail-effects">
              <div class="equip-detail-effects-title">效果</div>
              <div class="equip-detail-effects-body">
                <div v-for="(eff, i) in equipDetailEffects" :key="i" class="equip-detail-effect-item">
                  <span class="equip-detail-effect-name">{{ eff.名称 }}:</span>
                  <span class="equip-detail-effect-desc">{{ eff.描述 }}</span>
                </div>
              </div>
            </div>
            <p v-if="equipDetailItem?.描述" class="equip-detail-quote">"{{ equipDetailItem.描述 }}"</p>
            <div
              v-if="equipDetailSource === 'gear-inventory' || equipDetailSource === 'gear-equipped'"
              class="equip-detail-actions"
            >
              <button
                type="button"
                class="equip-detail-action-btn"
                :class="{ remove: equipDetailSource === 'gear-equipped' }"
                @click="equipDetailSource === 'gear-equipped' ? doUnequip() : doEquip()"
              >
                {{ equipDetailSource === 'gear-equipped' ? '脱下' : '穿戴' }}
              </button>
            </div>
            <div v-else-if="equipDetailSource === 'tool-item'" class="equip-detail-actions">
              <button
                type="button"
                class="equip-detail-action-btn equip-detail-action-btn-use"
                @click="doUseToolItem"
              >
                使用
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 幸运大抽奖弹窗：点击礼物图标打开，奖池以 50x50 装备卡片形式展示 -->
    <Transition name="popup-fade">
      <div v-if="luckyDrawOpen" class="lucky-draw-overlay" @click="luckyDrawOpen = false">
        <div class="lucky-draw-modal" role="dialog" aria-label="幸运大抽奖" @click.stop>
          <div class="lucky-draw-header">
            <h2 class="lucky-draw-title">幸运大抽奖</h2>
            <div class="lucky-draw-tickets">
              <span class="lucky-draw-tickets-label">抽奖券：</span>
              <span class="lucky-draw-tickets-value">{{ luckyDrawTicketCount }}</span>
              <button
                type="button"
                class="lucky-draw-cheat-btn"
                title="+1000 抽奖券"
                aria-label="作弊 +1000 抽奖券"
                @click="addCheatTickets"
              >
                <i class="fa-solid fa-plus" aria-hidden="true"></i>
              </button>
            </div>
            <button type="button" class="lucky-draw-close" aria-label="关闭" @click="luckyDrawOpen = false">
              <i class="fa-solid fa-times" aria-hidden="true"></i>
            </button>
          </div>
          <div class="lucky-draw-pool-section">
            <div class="lucky-draw-pool-title">本期奖池</div>
            <div class="lucky-draw-pool-red">
              <div
                v-for="(entry, index) in currentPeriodPoolItems"
                :key="index"
                :class="['lucky-draw-pool-slot', entry.rarityClass]"
              >
                <div class="lucky-draw-pool-slot-surface">
                  <i v-if="entry.itemName" :class="['gear-item-icon', entry.iconClass]" aria-hidden="true"></i>
                  <span v-else class="lucky-draw-slot-empty">—</span>
                </div>
                <div class="lucky-draw-pool-slot-name">{{ entry.itemName || '空' }}</div>
                <div v-if="entry.itemName" :class="['gear-item-rarity', entry.rarityBarClass]" aria-hidden="true"></div>
              </div>
            </div>
            <div class="lucky-draw-pool-buttons">
              <button
                type="button"
                class="lucky-draw-btn lucky-draw-btn-single"
                :disabled="!canSingleDraw"
                @click="doSingleDraw"
              >
                一个一个来（100）
              </button>
              <button
                type="button"
                class="lucky-draw-btn lucky-draw-btn-ten"
                :disabled="!canTenDraw"
                @click="doTenDraw"
              >
                我要抽十个（1000）
              </button>
            </div>
          </div>
          <div class="lucky-draw-slots">
            <div
              v-for="(entry, index) in luckyDrawSlotItems"
              :key="index"
              :class="['lucky-draw-slot', entry.rarityClass]"
            >
              <div class="lucky-draw-slot-surface">
                <i :class="['gear-item-icon', entry.iconClass]" aria-hidden="true"></i>
              </div>
              <div class="lucky-draw-slot-name">{{ entry.itemName }}</div>
              <div :class="['gear-item-rarity', entry.rarityBarClass]" aria-hidden="true"></div>
            </div>
          </div>
          <div class="lucky-draw-footer">
            <button type="button" class="lucky-draw-btn lucky-draw-btn-pack" @click="doPackLuckyDraw">打包带走</button>
            <button type="button" class="lucky-draw-btn lucky-draw-btn-select">一个一个选</button>
            <button type="button" class="lucky-draw-btn lucky-draw-btn-clear" @click="doClearLuckyDraw">
              清空奖励
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 特质商店弹窗 -->
    <Transition name="popup-fade">
      <div v-if="traitShopOpen" class="trait-shop-overlay" @click="closeTraitShop">
        <div class="trait-shop-modal" @click.stop>
          <div class="trait-shop-header">
            <h2 class="trait-shop-title">
              <span class="trait-shop-title-icon" aria-hidden="true">
                <i class="fas fa-store"></i>
              </span>
              <span>特质商店</span>
            </h2>
            <div class="trait-shop-rp">{{ store.data.主角?.RP点 ?? 0 }} RP</div>
          </div>
          <div class="trait-shop-body">
            <section
              v-for="section in traitShopSections"
              :key="section.key"
              :class="['trait-shop-section', `theme-${section.theme}`]"
            >
              <div class="trait-shop-section-tab">{{ section.title }}</div>
              <div class="trait-shop-section-panel">
                <article
                  v-for="trait in getVisibleTraitItems(section)"
                  :key="trait.name"
                  :class="[
                    'trait-shop-item',
                    `theme-${section.theme}`,
                    `state-${getTraitPurchaseState(section, trait)}`,
                  ]"
                  @click="onTraitItemClick(section, trait)"
                >
                  <div class="trait-shop-item-main">
                    <h3 class="trait-shop-item-name">{{ trait.name }}</h3>
                    <p class="trait-shop-item-description">{{ trait.description }}</p>
                  </div>
                  <div class="trait-shop-item-footer">
                    <span class="trait-shop-item-price">{{ section.price }} RP</span>
                    <button
                      type="button"
                      :class="[
                        'trait-shop-buy',
                        `theme-${section.theme}`,
                        `state-${getTraitPurchaseState(section, trait)}`,
                      ]"
                      :disabled="!canPurchaseTrait(section, trait)"
                      @click.stop="onTraitItemClick(section, trait)"
                    >
                      {{ getTraitPurchaseLabel(section, trait) }}
                    </button>
                  </div>
                </article>
                <button
                  v-if="section.items.length > 2"
                  type="button"
                  :class="['trait-shop-toggle', `theme-${section.theme}`]"
                  @click="toggleTraitSection(section.key)"
                >
                  {{ isTraitSectionExpanded(section.key) ? '点击收起' : '点击下拉' }}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import traitShopRaw from '../../世界书/特质商店.yaml?raw';
import { drawWeightedOne, getLegendaryOrArtifactPool, toDrawResult } from './luckyDrawPool';
import { useDataStore } from './store';
import {
  getGradeByLevel,
  generateTorso,
  generateWeapon,
  pickRandomProfession,
} from './teamEquipGen';

const STORAGE_AVATAR_KEY = 'hxl_status_avatar';
const STORAGE_AVATAR_KEY_CHEN = 'hxl_status_avatar_陈莹姬';
/** 队伍卡头像：旧键仅用于陈莹姬迁移；新键为 hxl_status_avatar_队伍_<memberId> */
const STORAGE_AVATAR_KEY_CHEN_TEAM = 'hxl_status_avatar_陈莹姬_队伍';
const STORAGE_AVATAR_KEY_TEAM_PREFIX = 'hxl_status_avatar_队伍_';
const TRAIT_SLOT_COUNT = 7;

const store = useDataStore();
const avatarInputRef = ref<HTMLInputElement | null>(null);
const avatarUrl = ref<string | null>(null);
const avatarInputRefChen = ref<HTMLInputElement | null>(null);
const avatarUrlChen = ref<string | null>(null);
/** 队伍卡头像：按队友 id 存储，一个共用 file input */
const teamAvatarInputRef = ref<HTMLInputElement | null>(null);
const currentUploadMemberId = ref<string | null>(null);
const avatarUrlByMember = ref<Record<string, string>>({});

function loadAvatar() {
  try {
    const raw = localStorage.getItem(STORAGE_AVATAR_KEY);
    if (raw) avatarUrl.value = raw;
  } catch {
    avatarUrl.value = null;
  }
}
function loadAvatarChen() {
  try {
    const raw = localStorage.getItem(STORAGE_AVATAR_KEY_CHEN);
    if (raw) avatarUrlChen.value = raw;
  } catch {
    avatarUrlChen.value = null;
  }
}
loadAvatar();
loadAvatarChen();

/** 根据队友 id 从 avatarUrlByMember 或 localStorage 取队伍卡头像（陈莹姬兼容旧键） */
function getTeamAvatarUrl(memberId: string): string | null {
  const v = avatarUrlByMember.value[memberId];
  if (v) return v;
  const raw =
    memberId === '陈莹姬'
      ? localStorage.getItem(STORAGE_AVATAR_KEY_CHEN_TEAM) ?? localStorage.getItem(STORAGE_AVATAR_KEY_TEAM_PREFIX + memberId)
      : localStorage.getItem(STORAGE_AVATAR_KEY_TEAM_PREFIX + memberId);
  if (raw) {
    avatarUrlByMember.value = { ...avatarUrlByMember.value, [memberId]: raw };
    return raw;
  }
  return null;
}

watch(
  () => (store.data.主角?.队友 ?? []) as string[],
  list => {
    const next = { ...avatarUrlByMember.value };
    list.forEach((id: string) => {
      if (next[id] == null) {
        const raw =
          id === '陈莹姬'
            ? localStorage.getItem(STORAGE_AVATAR_KEY_CHEN_TEAM) ?? localStorage.getItem(STORAGE_AVATAR_KEY_TEAM_PREFIX + id)
            : localStorage.getItem(STORAGE_AVATAR_KEY_TEAM_PREFIX + id);
        if (raw) next[id] = raw;
      }
    });
    avatarUrlByMember.value = next;
  },
  { immediate: true },
);

function triggerAvatarInput() {
  avatarInputRef.value?.click();
}

function onAvatarChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const data = reader.result as string;
    avatarUrl.value = data;
    try {
      localStorage.setItem(STORAGE_AVATAR_KEY, data);
    } catch {
      //
    }
  };
  reader.readAsDataURL(file);
  input.value = '';
}

function triggerAvatarInputChen() {
  avatarInputRefChen.value?.click();
}

function triggerTeamAvatarInput(memberId: string) {
  currentUploadMemberId.value = memberId;
  teamAvatarInputRef.value?.click();
}

function onTeamAvatarChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  const id = currentUploadMemberId.value;
  if (!file || !id) return;
  const reader = new FileReader();
  reader.onload = () => {
    const data = reader.result as string;
    avatarUrlByMember.value = { ...avatarUrlByMember.value, [id]: data };
    try {
      localStorage.setItem(STORAGE_AVATAR_KEY_TEAM_PREFIX + id, data);
    } catch {
      //
    }
  };
  reader.readAsDataURL(file);
  input.value = '';
  currentUploadMemberId.value = null;
}

function onAvatarChangeChen(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const data = reader.result as string;
    avatarUrlChen.value = data;
    try {
      localStorage.setItem(STORAGE_AVATAR_KEY_CHEN, data);
    } catch {
      //
    }
  };
  reader.readAsDataURL(file);
  input.value = '';
}

function parseTraitItems(
  raw: string,
  startMarker: string,
  endMarker?: string,
): { name: string; description: string }[] {
  const items: { name: string; description: string }[] = [];
  let inSection = false;
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith(startMarker)) {
      inSection = true;
      continue;
    }
    if (!inSection) continue;
    if (endMarker && trimmed.startsWith(endMarker)) break;
    const separatorIndex = trimmed.indexOf(':');
    if (separatorIndex <= 0) continue;
    const name = trimmed.slice(0, separatorIndex).trim();
    const description = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]/, '')
      .replace(/['"]$/, '');
    if (!name || !description) continue;
    items.push({ name, description });
  }
  return items;
}

const traitShopSections = [
  {
    key: 'positive',
    title: '正面特质',
    theme: 'positive',
    price: 8,
    items: parseTraitItems(traitShopRaw, '正面特质_普通_共 25 种_各 8RP:', '正面特质_超强_共 10 种_各 12RP:'),
  },
  {
    key: 'elite',
    title: '超强特质',
    theme: 'elite',
    price: 12,
    items: parseTraitItems(traitShopRaw, '正面特质_超强_共 10 种_各 12RP:'),
  },
];

const traitShopOpen = ref(false);
const expandedTraitSections = ref<Record<string, boolean>>({
  positive: false,
  elite: false,
});
const skillQuickReleaseOpen = ref(false);
const activeBottomTab = ref('secret');
const isShowingChen = computed(() => activeBottomTab.value === 'chen');

// 装备界面

function openTraitShop() {
  traitShopOpen.value = true;
}
function closeTraitShop() {
  traitShopOpen.value = false;
}
function toggleTraitSection(sectionKey: string) {
  expandedTraitSections.value[sectionKey] = !expandedTraitSections.value[sectionKey];
}
function isTraitSectionExpanded(sectionKey: string) {
  return !!expandedTraitSections.value[sectionKey];
}
function getVisibleTraitItems(section: { key: string; items: { name: string; description: string }[] }) {
  return isTraitSectionExpanded(section.key) ? section.items : section.items.slice(0, 2);
}

const ownedTraits = computed(() => store.data.主角?.特质 ?? []);
const currentRp = computed(() => store.data.主角?.RP点 ?? 0);
const skillList = computed(() => store.data.主角?.技能 ?? []);
const currencyDisplay = computed(() => {
  if (isShowingChen.value) return '—';
  const value = store.data.主角?.货币 ?? 0;
  return new Intl.NumberFormat('zh-CN').format(value);
});

function isTraitOwned(traitName: string) {
  return ownedTraits.value.includes(traitName);
}
function areTraitSlotsFull() {
  return ownedTraits.value.length >= TRAIT_SLOT_COUNT;
}
function canPurchaseTrait(section: { price: number }, trait: { name: string }) {
  return getTraitPurchaseState(section, trait) === 'available';
}
function getTraitPurchaseState(
  section: { price: number },
  trait: { name: string },
): 'owned' | 'full' | 'insufficient' | 'available' {
  if (isTraitOwned(trait.name)) return 'owned';
  if (areTraitSlotsFull()) return 'full';
  if (currentRp.value < section.price) return 'insufficient';
  return 'available';
}
function getTraitPurchaseLabel(section: { price: number }, trait: { name: string }) {
  const state = getTraitPurchaseState(section, trait);
  if (state === 'owned') return '已拥有';
  if (state === 'full') return '槽位已满';
  if (state === 'insufficient') return 'RP不足';
  return '购买';
}
function onTraitItemClick(section: { price: number }, trait: { name: string }) {
  if (!canPurchaseTrait(section, trait)) return;
  if (!window.confirm(`确认花费 ${section.price} RP 购买特质"${trait.name}"吗？`)) return;
  const protagonist = store.data.主角;
  if (!protagonist) return;
  protagonist.RP点 = Math.max(0, (protagonist.RP点 ?? 0) - section.price);
  protagonist.特质 = [...(protagonist.特质 ?? []), trait.name];
}

function toggleSkillQuickRelease() {
  skillQuickReleaseOpen.value = !skillQuickReleaseOpen.value;
}
function appendTextToReplyBox(text: string) {
  const parentDocument = window.parent?.document;
  const textarea = parentDocument?.querySelector('#send_textarea') as HTMLTextAreaElement | null;
  if (!textarea) {
    console.warn('[黄晓林状态栏] 未找到酒馆回复框 #send_textarea');
    return;
  }
  const currentText = textarea.value.trimEnd();
  const nextText = currentText ? `${currentText}\n${text}` : text;
  textarea.value = nextText;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));
  textarea.focus();
  textarea.setSelectionRange(nextText.length, nextText.length);
}
function onSkillSlotClick(skillName: string) {
  if (!skillQuickReleaseOpen.value || !skillName) return;
  appendTextToReplyBox(`释放${skillName}技能`);
}

function calcAtkDisplay(
  已装备: Record<string, string>,
  物品栏: Record<string, { 伤害骰?: string; 攻击力?: number; 固定伤害?: number }>,
) {
  const parts: string[] = [];
  for (const slot of ['MainHand', 'OffHand']) {
    const name = 已装备[slot];
    if (!name) continue;
    const item = 物品栏[name];
    if (!item) continue;
    const 骰 = item.伤害骰 ?? '';
    const 加 = [item.攻击力, item.固定伤害].filter((n): n is number => n != null && n !== 0);
    const 加sum = 加.length ? 加.reduce((a: number, b: number) => a + b, 0) : 0;
    const 加str = 加sum !== 0 ? (加sum > 0 ? '+' : '') + 加sum : '';
    if (骰 || 加str) parts.push(`${骰}${加str}`.trim());
  }
  return parts.length ? parts.join(' · ') : '1D4';
}
function calcDefDisplay(已装备: Record<string, string>, 物品栏: Record<string, { 防御?: number }>) {
  const slots = ['Head', 'Neck', 'Body', 'Back', 'Waist', 'Wrists', 'Hands', 'Feet', 'Trinket1', 'Trinket2'];
  let total = 0;
  for (const slot of slots) {
    const name = 已装备[slot];
    if (!name) continue;
    const item = 物品栏[name];
    const v = item?.防御;
    if (v != null && v !== 0) total += v;
  }
  return total === 0 ? '12' : String(total);
}

const cardName = computed(() => (isShowingChen.value ? '陈莹姬' : '黄晓林'));
const cardLevel = computed(() =>
  isShowingChen.value ? (store.data.陈莹姬?.等级 ?? 30) : (store.data.主角?.等级 ?? 1),
);
const cardRace = computed(() =>
  isShowingChen.value ? (store.data.陈莹姬?.种族 ?? '改造体') : (store.data.主角?.种族 ?? '人类'),
);
const cardProfession = computed(() => (isShowingChen.value ? '前军人' : '劳工'));
/** 熟练加值按「DnD规则_60级」随等级自动算：1–9 级 +0，10–19 +1，…，50–60 +5 */
const cardProficiency = computed(() => {
  const L = isShowingChen.value ? (store.data.陈莹姬?.等级 ?? 30) : (store.data.主角?.等级 ?? 1);
  return Math.min(5, Math.floor(L / 10));
});
const atkDisplay = computed(() => {
  if (isShowingChen.value) {
    const 武器 = store.data.陈莹姬?.武器;
    const 伤害骰 = 武器?.伤害骰?.trim();
    const 基础攻击 = 武器?.基础攻击?.trim();
    if (伤害骰) return 伤害骰;
    if (基础攻击) return 基础攻击;
    return '1D4';
  }
  const 已装备 = store.data.主角?.已装备 ?? {};
  const 物品栏 = store.data.主角?.物品栏 ?? {};
  return calcAtkDisplay(已装备, 物品栏);
});
const defDisplay = computed(() => {
  if (isShowingChen.value) {
    const 躯干 = store.data.陈莹姬?.躯干 ?? store.data.陈莹姬?.护甲;
    const 基础防御 = 躯干?.基础防御?.trim();
    if (基础防御) return 基础防御;
    return '12';
  }
  const 已装备 = store.data.主角?.已装备 ?? {};
  const 物品栏 = store.data.主角?.物品栏 ?? {};
  return calcDefDisplay(已装备, 物品栏);
});
const hpPercent = computed(() => {
  if (isShowingChen.value) {
    const max = store.data.陈莹姬?.最大HP || 1;
    const cur = Math.max(0, store.data.陈莹姬?.当前HP ?? 0);
    return Math.min(100, (cur / max) * 100);
  }
  const max = store.data.主角?.最大HP || 1;
  const cur = Math.max(0, store.data.主角?.当前HP ?? 0);
  return Math.min(100, (cur / max) * 100);
});
const spPercent = computed(() =>
  isShowingChen.value ? (store.data.陈莹姬?.好感度 ?? 25) : (store.data.主角?.体力 ?? 0),
);
const sanityPercent = computed(() =>
  isShowingChen.value ? (store.data.陈莹姬?.理智 ?? 45) : (store.data.主角?.理智 ?? 0),
);
const personalThought = computed(() => {
  if (isShowingChen.value) return store.data.陈莹姬?.内心想法 || '';
  return store.data.主角?.个人想法 || '外面还有别的势力……………也许这围墙不是完全铁板一块,但我现在只能先活过今晚。';
});
const chenWeapon = computed(() => store.data.陈莹姬?.武器 ?? { 名称: '寂静M4A1消音步枪', 加成: '力量+3 感知+3' });
const chenTorso = computed(
  () => store.data.陈莹姬?.躯干 ?? store.data.陈莹姬?.护甲 ?? { 名称: '性感COS警察制服', 加成: '魅力+5' },
);

const equipDetailOpen = ref(false);
const equipDetailType = ref<'weapon' | 'torso'>('weapon');
/** 储物面板当前激活的标签：装备栏 或 道具栏 */
const activeStorageTab = ref<'gear' | 'tool'>('gear');
/** 幸运大抽奖弹窗是否打开 */
const luckyDrawOpen = ref(false);

/** 弹窗数据来源：chen=主卡陈莹姬 chenTeam=队伍卡某队友 gear-equipped=已装备槽位 gear-inventory=装备栏 tool-item=道具栏 */
const equipDetailSource = ref<'chen' | 'chenTeam' | 'gear-equipped' | 'gear-inventory' | 'tool-item'>('chen');
/** 队伍卡打开装备详情时的队友 id */
const equipDetailMemberId = ref<string | null>(null);
/** 当前操作的装备槽位键（如 MainHand / Body） */
const gearDetailSlot = ref<string>('MainHand');
/** 当前弹窗查看的物品名 */
const gearDetailItemName = ref<string>('');

/** 装备详情弹窗展示用（陈莹姬武器/躯干 与 主角装备 统一成此形状） */
interface EquipDetailDisplay {
  名称?: string;
  品级?: string;
  装备部位?: string;
  基础攻击?: string;
  伤害骰?: string;
  基础防御?: string;
  加成?: string;
  效果?: { 名称: string; 描述: string }[];
  描述?: string;
}

/** 11 个装备槽定义（对应位图布局） */
const ALL_MAP_GEAR_SLOTS = [
  { key: 'Head', cssKey: 'head', label: '头具' },
  { key: 'Neck', cssKey: 'neck', label: '颈饰' },
  { key: 'Body', cssKey: 'body', label: '躯干' },
  { key: 'Waist', cssKey: 'waist', label: '腰饰' },
  { key: 'Back', cssKey: 'back', label: '披挂' },
  { key: 'OffHand', cssKey: 'offhand', label: '副手' },
  { key: 'Hands', cssKey: 'hands', label: '护手' },
  { key: 'MainHand', cssKey: 'mainhand', label: '主手' },
  { key: 'Trinket1', cssKey: 'trinket1', label: '饰物' },
  { key: 'Feet', cssKey: 'feet', label: '护足' },
  { key: 'Trinket2', cssKey: 'trinket2', label: '饰物' },
] as const;

/** 中央「空空如也」框文案：按已装备件数 0→空空如也，1→不再裸奔，3→戴点东西，5→有点排面，7→整装待发，9→渐趋完备，11→全副武装 */
const gearEmptyBoxText = computed(() => {
  const 已装备 = store.data.主角?.已装备 ?? {};
  const n = ALL_MAP_GEAR_SLOTS.filter(s => 已装备[s.key]).length;
  if (n >= 11) return '全副武装';
  if (n >= 9) return '渐趋完备';
  if (n >= 7) return '整装待发';
  if (n >= 5) return '有点排面';
  if (n >= 3) return '戴点东西';
  if (n >= 1) return '不再裸奔';
  return '空空如也';
});

/** 中央框颜色阶段：empty=空空如也不改，tier2=蓝，tier3=紫，tier4=粉，tier5=金，tier6=渐趋完备橙，tier7=全副武装红 */
const gearEmptyBoxStage = computed(() => {
  const 已装备 = store.data.主角?.已装备 ?? {};
  const n = ALL_MAP_GEAR_SLOTS.filter(s => 已装备[s.key]).length;
  if (n >= 11) return 'tier7';
  if (n >= 9) return 'tier6';
  if (n >= 7) return 'tier5';
  if (n >= 5) return 'tier4';
  if (n >= 3) return 'tier3';
  if (n >= 1) return 'tier2';
  return 'empty';
});

type GearRarity = 'common' | 'fine' | 'rare' | 'epic' | 'divine' | 'legendary';
function gearRarityFromGrade(品级?: string): GearRarity {
  if (品级 === '传说') return 'legendary';
  if (品级 === '神器') return 'divine';
  if (品级 === '史诗') return 'epic';
  if (品级 === '稀有') return 'rare';
  if (品级 === '精品') return 'fine';
  return 'common';
}

/** 按装备部位返回图标 class（装备栏/奖池等统一使用） */
function slotToIcon(slot: string): string {
  const s = slot.trim();
  switch (s) {
    case 'Head':
      return 'fa-solid fa-hat-cowboy'; // 头具
    case 'Neck':
      return 'fa-solid fa-gem'; // 颈饰
    case 'Body':
      return 'fa-solid fa-shirt'; // 躯干
    case 'Back':
      return 'fa-solid fa-vest'; // 披挂
    case 'Waist':
      return 'fa-solid fa-grip-lines'; // 腰饰
    case 'Wrists':
      return 'fa-solid fa-hand'; // 护腕
    case 'Hands':
      return 'fa-solid fa-hand-fist'; // 护手
    case 'Feet':
      return 'fa-solid fa-shoe-prints'; // 护足
    case 'Trinket1':
    case 'Trinket2':
      return 'fa-solid fa-ring'; // 饰物
    case 'MainHand':
      return 'fa-solid fa-gun'; // 主手（武器）
    case 'OffHand':
      return 'fa-solid fa-shield-halved'; // 副手（盾/副武）
    default:
      return 'fa-solid fa-circle';
  }
}

const inventoryItems = computed(() => {
  const 已装备Set = new Set(Object.values(store.data.主角?.已装备 ?? {}));
  const 物品栏 = store.data.主角?.物品栏 ?? {};
  return Object.entries(物品栏)
    .filter(([name, item]) => item.可装备部位 && !已装备Set.has(name))
    .map(([name, item]) => {
      const rarity = gearRarityFromGrade(item.品级);
      return {
        itemName: name,
        rarityClass: `gear-item-card-${rarity}`,
        rarityBarClass: `gear-item-rarity-${rarity}`,
        iconClass: slotToIcon(item.可装备部位 ?? ''),
      };
    });
});

/** 道具栏：物品栏中没有「可装备部位」的道具/消耗品 */
const toolItems = computed(() => {
  const 物品栏 = store.data.主角?.物品栏 ?? {};
  return Object.entries(物品栏)
    .filter(([, item]) => !item.可装备部位)
    .map(([name, item]) => {
      const rarity = gearRarityFromGrade(item.品级);
      return {
        itemName: name,
        rarityClass: `gear-item-card-${rarity}`,
        rarityBarClass: `gear-item-rarity-${rarity}`,
        iconClass: 'fa-solid fa-flask',
      };
    });
});

/** 幸运大抽奖：抽奖券 = 货币，单抽 100、十连 1000 */
const SINGLE_DRAW_COST = 100;
const TEN_DRAW_COST = 1000;
const luckyDrawTicketCount = computed(() => store.data.主角?.货币 ?? 0);
function addCheatTickets() {
  const 主角 = store.data.主角;
  if (主角) 主角.货币 = (主角.货币 ?? 0) + 1000;
}
const canSingleDraw = computed(() => (store.data.主角?.货币 ?? 0) >= SINGLE_DRAW_COST);
const canTenDraw = computed(() => (store.data.主角?.货币 ?? 0) >= TEN_DRAW_COST);
const PITY_EPIC_AT = 100;

/** 单抽：从武器装备池1+池2 按品级权重抽取；满 100 次必出史诗并重置计数 */
function doSingleDraw() {
  const 主角 = store.data.主角;
  if (!主角 || (主角.货币 ?? 0) < SINGLE_DRAW_COST) return;
  主角.货币 = (主角.货币 ?? 0) - SINGLE_DRAW_COST;
  主角.奖池 = 主角.奖池 ?? [];
  主角.抽奖次数 = (主角.抽奖次数 ?? 0) + 1;
  const forceEpic = (主角.抽奖次数 ?? 0) >= PITY_EPIC_AT;
  if (forceEpic) 主角.抽奖次数 = 0;
  const item = drawWeightedOne(forceEpic);
  if (item) 主角.奖池.push(toDrawResult(item));
}

/** 十连：同上，从池1+池2 按权重抽 10 次；若本段内达到 100 次则其中一次必出史诗 */
function doTenDraw() {
  const 主角 = store.data.主角;
  if (!主角 || (主角.货币 ?? 0) < TEN_DRAW_COST) return;
  主角.货币 = (主角.货币 ?? 0) - TEN_DRAW_COST;
  主角.奖池 = 主角.奖池 ?? [];
  for (let i = 0; i < 10; i++) {
    主角.抽奖次数 = (主角.抽奖次数 ?? 0) + 1;
    const forceEpic = (主角.抽奖次数 ?? 0) >= PITY_EPIC_AT;
    if (forceEpic) 主角.抽奖次数 = 0;
    const item = drawWeightedOne(forceEpic);
    if (item) 主角.奖池.push(toDrawResult(item));
  }
}
/** 奖池/本期奖池项展示图标：优先按可装备部位，否则按装备子类型 */
function poolItemToIcon(类型: string, 装备子类型?: string, 可装备部位?: string): string {
  if (类型 === '道具') return 'fa-solid fa-flask';
  if (可装备部位) return slotToIcon(可装备部位);
  if (装备子类型 === '武器') return 'fa-solid fa-gun';
  if (装备子类型 === '防具') return 'fa-solid fa-shirt';
  if (装备子类型 === '饰物') return 'fa-solid fa-ring';
  return 'fa-solid fa-circle';
}
/** 打开弹窗时若本期奖池不足 4 件，则从世界书武器装备池1+池2 中神器及以上随机选 4 件 */
function ensureCurrentPeriodPool() {
  const 主角 = store.data.主角;
  if (!主角) return;
  const 本期 = 主角.本期奖池 ?? [];
  if (本期.length >= 4) return;
  const pool = getLegendaryOrArtifactPool();
  if (pool.length === 0) return;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const next = shuffled.slice(0, 4).map(item => toDrawResult(item));
  主角.本期奖池 = next;
}
function openLuckyDraw() {
  ensureCurrentPeriodPool();
  luckyDrawOpen.value = true;
}
/** 红色容器内 4 格展示（本期奖池，随机 4 件神器～传说） */
const currentPeriodPoolItems = computed(() => {
  const 本期 = store.data.主角?.本期奖池 ?? [];
  const slots: { itemName: string; rarityClass: string; rarityBarClass: string; iconClass: string }[] = [];
  for (let i = 0; i < 4; i++) {
    const item = 本期[i];
    if (!item) {
      slots.push({
        itemName: '',
        rarityClass: 'gear-item-card-common',
        rarityBarClass: 'gear-item-rarity-common',
        iconClass: 'fa-solid fa-circle',
      });
      continue;
    }
    const rarity = gearRarityFromGrade(item.品级);
    slots.push({
      itemName: item.名称,
      rarityClass: `gear-item-card-${rarity}`,
      rarityBarClass: `gear-item-rarity-${rarity}`,
      iconClass: poolItemToIcon(item.类型, item.装备子类型, item.可装备部位),
    });
  }
  return slots;
});
/** 抽奖获得的物品列表，无上限，自动填入展示区 */
const luckyDrawSlotItems = computed(() => {
  const 奖池 = store.data.主角?.奖池 ?? [];
  return 奖池.map(item => {
    const rarity = gearRarityFromGrade(item.品级);
    return {
      itemName: item.名称,
      rarityClass: `gear-item-card-${rarity}`,
      rarityBarClass: `gear-item-rarity-${rarity}`,
      iconClass: poolItemToIcon(item.类型, item.装备子类型, item.可装备部位),
    };
  });
});
/** 打包带走：将奖池内装备/道具写入物品栏并清空奖池 */
function doPackLuckyDraw() {
  const 主角 = store.data.主角;
  if (!主角) return;
  const 奖池 = 主角.奖池 ?? [];
  if (!主角.物品栏) 主角.物品栏 = {};
  /** 无世界书部位时按装备子类型回退到默认槽位 */
  const 装备子类型到部位: Record<string, string> = {
    武器: 'MainHand',
    防具: 'Body',
    饰物: 'Trinket1',
  };
  for (const item of 奖池) {
    const existing = 主角.物品栏[item.名称];
    const 可装备部位 =
      item.类型 === '装备'
        ? (item.可装备部位 ?? (item.装备子类型 ? 装备子类型到部位[item.装备子类型] : undefined))
        : undefined;
    主角.物品栏[item.名称] = {
      描述: item.描述 ?? existing?.描述 ?? '',
      数量: (existing?.数量 ?? 0) + 1,
      品级: item.品级 ?? existing?.品级,
      ...(可装备部位 ? { 可装备部位 } : {}),
      ...(item.词条 != null && item.词条.length > 0 ? { 词条: item.词条 } : {}),
      ...(item.伤害骰 != null ? { 伤害骰: item.伤害骰 } : {}),
      ...(item.攻击力 != null ? { 攻击力: item.攻击力 } : {}),
      ...(item.固定伤害 != null ? { 固定伤害: item.固定伤害 } : {}),
      ...(item.防御 != null ? { 防御: item.防御 } : {}),
    };
  }
  主角.奖池 = [];
  luckyDrawOpen.value = false;
}
/** 清空奖励：清空奖池，不写入物品栏 */
function doClearLuckyDraw() {
  const 主角 = store.data.主角;
  if (主角) 主角.奖池 = [];
  luckyDrawOpen.value = false;
}

/** 返回指定槽位已装备的物品名，未装备则返回空字符串 */
function getEquippedInSlot(slotKey: string): string {
  return store.data.主角?.已装备?.[slotKey] ?? '';
}

/** 返回指定槽位已装备时的品级高亮 class（如 gear-slot-equipped-rarity-legendary），未装备或无品级则返回空字符串 */
function getEquippedSlotRarityClass(slotKey: string): string {
  const itemName = store.data.主角?.已装备?.[slotKey];
  if (!itemName) return '';
  const item = store.data.主角?.物品栏?.[itemName];
  const rarity = gearRarityFromGrade(item?.品级);
  return rarity ? `gear-slot-equipped-rarity-${rarity}` : '';
}

/** 返回悬停气泡的品级颜色 class（如 gear-slot-tooltip-rarity-epic），用于装备名按品级着色 */
function getEquippedSlotTooltipRarityClass(slotKey: string): string {
  const itemName = store.data.主角?.已装备?.[slotKey];
  if (!itemName) return '';
  const item = store.data.主角?.物品栏?.[itemName];
  const rarity = gearRarityFromGrade(item?.品级);
  return rarity ? `gear-slot-tooltip-rarity-${rarity}` : '';
}

const equipDetailItem = computed((): EquipDetailDisplay | undefined => {
  if (equipDetailSource.value === 'tool-item') {
    const itemName = gearDetailItemName.value;
    if (!itemName) return undefined;
    const raw = (store.data.主角?.物品栏 ?? {})[itemName];
    return {
      名称: itemName,
      品级: raw?.品级,
      装备部位: '道具',
      加成: raw?.属性说明,
      效果: (raw?.词条 ?? []).map((t: string) =>
        typeof t === 'string' && t.includes(':')
          ? { 名称: t.slice(0, t.indexOf(':')), 描述: t.slice(t.indexOf(':') + 1).trim() }
          : { 名称: t, 描述: '' },
      ),
      描述: raw?.描述,
    };
  }
  if (equipDetailSource.value === 'gear-equipped' || equipDetailSource.value === 'gear-inventory') {
    const itemName = gearDetailItemName.value;
    if (!itemName) return undefined;
    const raw = (store.data.主角?.物品栏 ?? {})[itemName];
    const slotKey = raw?.可装备部位 ?? gearDetailSlot.value;
    const slotDef = ALL_MAP_GEAR_SLOTS.find(s => s.key === slotKey);
    const nums = [raw?.攻击力, raw?.固定伤害].filter((n): n is number => n != null && n !== 0);
    const 基础攻击 = nums.length
      ? [raw?.攻击力, raw?.固定伤害]
          .filter((n): n is number => n != null)
          .map(n => (n > 0 ? `+${n}` : String(n)))
          .join(' ')
      : undefined;
    return {
      名称: itemName,
      品级: raw?.品级,
      装备部位: slotDef?.label ?? slotKey,
      基础攻击,
      伤害骰: raw?.伤害骰,
      基础防御: raw?.防御 != null ? String(raw.防御) : undefined,
      加成: raw?.属性说明,
      效果: (raw?.词条 ?? []).map((t: string) =>
        typeof t === 'string' && t.includes(':')
          ? { 名称: t.slice(0, t.indexOf(':')), 描述: t.slice(t.indexOf(':') + 1).trim() }
          : { 名称: t, 描述: '' },
      ),
      描述: raw?.描述,
    };
  }
  if (equipDetailSource.value === 'chenTeam') {
    const d = getTeamMemberData(equipDetailMemberId.value ?? '');
    if (equipDetailType.value === 'weapon') return d?.武器 as EquipDetailDisplay | undefined;
    return (d?.躯干 ?? d?.护甲) as EquipDetailDisplay | undefined;
  }
  if (equipDetailType.value === 'weapon') return store.data.陈莹姬?.武器 as EquipDetailDisplay | undefined;
  return (store.data.陈莹姬?.躯干 ?? store.data.陈莹姬?.护甲) as EquipDetailDisplay | undefined;
});
const equipDetailEffects = computed(() => {
  const effects = equipDetailItem.value?.效果 ?? [];
  return Array.isArray(effects) ? effects : [];
});
function getGradeClass(品级?: string) {
  if (品级 === '史诗') return 'grade-epic';
  if (品级 === '神器') return 'grade-divine';
  if (品级 === '传说') return 'grade-legend';
  if (品级 === '稀有') return 'grade-rare';
  if (品级 === '精品') return 'grade-fine';
  return 'grade-common';
}
const equipDetailTabClass = computed(() => getGradeClass(equipDetailItem.value?.品级));
const chenWeaponGradeClass = computed(() => getGradeClass(chenWeapon.value?.品级));
const chenTorsoGradeClass = computed(() => getGradeClass(chenTorso.value?.品级));
function openEquipDetail(type: 'weapon' | 'torso') {
  equipDetailSource.value = 'chen';
  equipDetailType.value = type;
  equipDetailOpen.value = true;
}
/** 从队伍卡打开某队友的武器/躯干详情 */
function openEquipDetailFromTeam(type: 'weapon' | 'torso', memberId: string) {
  equipDetailSource.value = 'chenTeam';
  equipDetailMemberId.value = memberId;
  equipDetailType.value = type;
  equipDetailOpen.value = true;
}
/** 点击已装备槽位时打开详情（只有"脱下"按钮） */
function openEquippedSlotDetail(slotKey: string) {
  const itemName = store.data.主角?.已装备?.[slotKey];
  if (!itemName) return;
  equipDetailSource.value = 'gear-equipped';
  gearDetailSlot.value = slotKey;
  gearDetailItemName.value = itemName;
  equipDetailType.value = slotKey === 'MainHand' || slotKey === 'OffHand' ? 'weapon' : 'torso';
  equipDetailOpen.value = true;
}
/** 点击装备栏物品时打开详情（只有"穿戴"按钮） */
function openInventoryItemDetail(itemName: string) {
  const item = store.data.主角?.物品栏?.[itemName];
  if (!item?.可装备部位) return;
  equipDetailSource.value = 'gear-inventory';
  gearDetailSlot.value = item.可装备部位;
  gearDetailItemName.value = itemName;
  equipDetailType.value = item.可装备部位 === 'MainHand' || item.可装备部位 === 'OffHand' ? 'weapon' : 'torso';
  equipDetailOpen.value = true;
}
/** 点击道具栏物品时打开详情（只读，无穿戴/脱下按钮） */
function openToolItemDetail(itemName: string) {
  equipDetailSource.value = 'tool-item';
  gearDetailItemName.value = itemName;
  equipDetailType.value = 'torso';
  equipDetailOpen.value = true;
}
/** 穿戴：写入已装备槽位并关闭弹窗。饰品（Trinket1/Trinket2）自动选第一个空槽，再穿戴另一个时进第二槽 */
function doEquip() {
  const 主角 = store.data.主角;
  const itemName = gearDetailItemName.value;
  if (!主角 || !itemName) return;
  const item = 主角.物品栏?.[itemName];
  if (!item?.可装备部位) return;
  if (!主角.已装备) 主角.已装备 = {};
  let slot = item.可装备部位;
  if (slot === 'Trinket1' || slot === 'Trinket2') {
    if (!主角.已装备['Trinket1']) slot = 'Trinket1';
    else if (!主角.已装备['Trinket2']) slot = 'Trinket2';
    else slot = 'Trinket2'; // 两槽都满时新装备占第二槽（覆盖）
  }
  主角.已装备[slot] = itemName;
  equipDetailOpen.value = false;
}
/** 脱下：从已装备槽位移除并关闭弹窗 */
function doUnequip() {
  const 主角 = store.data.主角;
  if (!主角) return;
  const slot = gearDetailSlot.value;
  if (主角.已装备) delete 主角.已装备[slot];
  equipDetailOpen.value = false;
}
/** 道具使用：将「使用xxx（道具名称）」写入酒馆回复框并关闭弹窗 */
async function doUseToolItem() {
  const name = gearDetailItemName.value?.trim();
  if (!name) return;
  const text = `使用${name}（道具名称）`;
  try {
    await triggerSlash('/setinput ' + JSON.stringify(text));
  } catch (e) {
    console.warn('道具使用写入回复框失败', e);
  }
  closeEquipDetail();
}
function closeEquipDetail() {
  equipDetailOpen.value = false;
}
const chenSkill = computed(() => store.data.陈莹姬?.技能 ?? '爆头一击');
const chenUltimate = computed(() => store.data.陈莹姬?.奥义 ?? '枪花乱舞');
/** 队伍卡展开区：武器/躯干/技能/奥义（来自 队伍陈莹姬，与主卡独立） */
const teamChenWeapon = computed(() => store.data.队伍陈莹姬?.武器 ?? { 名称: '寂静M4A1消音步枪', 加成: '力量+3 感知+3' });
const teamChenTorso = computed(
  () => store.data.队伍陈莹姬?.躯干 ?? store.data.队伍陈莹姬?.护甲 ?? { 名称: '性感COS警察制服', 加成: '魅力+5' },
);
const teamChenSkill = computed(() => store.data.队伍陈莹姬?.技能 ?? '爆头一击');
const teamChenUltimate = computed(() => store.data.队伍陈莹姬?.奥义 ?? '枪花乱舞');
const currentHp = computed(() =>
  isShowingChen.value ? (store.data.陈莹姬?.当前HP ?? 0) : (store.data.主角?.当前HP ?? 0),
);
const maxHp = computed(() =>
  isShowingChen.value ? (store.data.陈莹姬?.最大HP ?? 10) : (store.data.主角?.最大HP ?? 10),
);
const expNextLevel = computed(() => {
  const L = isShowingChen.value ? (store.data.陈莹姬?.等级 ?? 30) : (store.data.主角?.等级 ?? 1);
  return 50 * L * (L + 1);
});
const expDisplay = computed(() => {
  if (isShowingChen.value) return store.data.陈莹姬?.经验值 ?? 0;
  return store.data.主角?.经验值 ?? 0;
});
const expBarPercent = computed(() => {
  const L = isShowingChen.value ? (store.data.陈莹姬?.等级 ?? 30) : (store.data.主角?.等级 ?? 1);
  const exp = isShowingChen.value ? (store.data.陈莹姬?.经验值 ?? 0) : (store.data.主角?.经验值 ?? 0);
  const currentLevelStart = L <= 1 ? 0 : 50 * (L - 1) * L;
  const needForNext = 50 * L;
  if (needForNext <= 0) return 0;
  const progress = (exp - currentLevelStart) / needForNext;
  return Math.min(100, Math.max(0, progress * 100));
});

/** 队伍栏：当前展开的队友卡片 id，点击卡片切换下拉六维与装备技能 */
const expandedTeamMemberId = ref<string | null>(null);

function toggleTeamCardExpand(memberId: string) {
  expandedTeamMemberId.value = expandedTeamMemberId.value === memberId ? null : memberId;
}

/** 队伍栏：当前在队友名单中的 NPC 标识，添加新队友即自动出现在队友栏 */
const teamMembers = computed(() => (store.data.主角?.队友 ?? []) as string[]);

/** 获取某队友在队伍栏的数据（队伍[id] 优先，陈莹姬兼容旧存档 队伍陈莹姬） */
function getTeamMemberData(memberId: string) {
  const 队伍 = store.data.队伍;
  if (队伍?.[memberId] != null) return 队伍[memberId];
  if (memberId === '陈莹姬') return store.data.队伍陈莹姬;
  return undefined;
}

/** 队伍栏中某队友卡片的展示数据（来自 队伍[id] 或 队伍陈莹姬，与主卡独立、随该队友变量更新） */
function teamMemberDisplay(memberId: string) {
  const c = getTeamMemberData(memberId);
  const level = c?.等级 ?? 30;
  const maxHp = c?.最大HP || 1;
  const curHp = Math.max(0, c?.当前HP ?? 0);
  const exp = c?.经验值 ?? 0;
  const currentLevelStart = level <= 1 ? 0 : 50 * (level - 1) * level;
  const needForNext = 50 * level;
  const expBarPct = needForNext <= 0 ? 0 : Math.min(100, Math.max(0, ((exp - currentLevelStart) / needForNext) * 100));
  const 武器 = c?.武器;
  const atk = 武器?.伤害骰?.trim() || 武器?.基础攻击?.trim() || '1D4';
  const 躯干 = c?.躯干 ?? c?.护甲;
  const def = 躯干?.基础防御?.trim() || '12';
  return {
    name: memberId,
    level,
    race: c?.种族 ?? '改造体',
    profession: (c as { 职业?: string } | undefined)?.职业 ?? '前军人',
    proficiency: Math.min(5, Math.floor(level / 10)),
    atk,
    def,
    currentHp: curHp,
    maxHp,
    hpPercent: Math.min(100, (curHp / maxHp) * 100),
    favorPercent: c?.好感度 ?? 25,
    sanityPercent: c?.理智 ?? 45,
    expDisplay: exp,
    expNextLevel: 50 * level * (level + 1),
    expBarPercent: expBarPct,
    personalThought: c?.内心想法 || '',
  };
}

/** 队伍栏展开时某队友的六维数值 */
function teamMemberAttrValue(memberId: string, key: string) {
  return (getTeamMemberData(memberId)?.能力值 as Record<string, number>)?.[key] ?? 10;
}

/** 入队时自动生成并持久化：种族沿用 新队友默认（用户输入），职业随机，武器/躯干按等级→品级与职业自动生成 */
watch(
  () => [(store.data.主角?.队友 ?? []) as string[], store.data.队伍, store.data.新队友默认],
  () => {
    const 队友List = (store.data.主角?.队友 ?? []) as string[];
    const 队伍 = store.data.队伍 ?? {};
    const 默认 = store.data.新队友默认;
    if (!默认 || typeof 默认 !== 'object') return;
    let next: Record<string, unknown> = { ...队伍 };
    let changed = false;
    for (const id of 队友List) {
      if (!id || next[id] != null) continue;
      const base = klona(默认) as Record<string, unknown>;
      const 等级 = (base.等级 as number) ?? 30;
      const 职业 = pickRandomProfession();
      const 品级 = getGradeByLevel(等级);
      base.职业 = 职业;
      base.武器 = generateWeapon(职业, 品级);
      base.躯干 = generateTorso(职业, 品级);
      next[id] = base;
      changed = true;
    }
    if (changed) store.data.队伍 = next as typeof store.data.队伍;
  },
  { immediate: true, deep: true },
);

function attrValue(key: string) {
  if (isShowingChen.value) return (store.data.陈莹姬?.能力值 as Record<string, number>)?.[key] ?? 10;
  return (store.data.主角?.能力值 as Record<string, number>)?.[key] ?? 10;
}

const attrList = [
  { key: '力量', label: '力量', icon: 'fas fa-hand-fist' },
  { key: '敏捷', label: '敏捷', icon: 'fas fa-person-running' },
  { key: '体质', label: '体质', icon: 'fas fa-heart-pulse' },
  { key: '智力', label: '智力', icon: 'fas fa-brain' },
  { key: '感知', label: '感知', icon: 'fas fa-eye' },
  { key: '魅力', label: '魅力', icon: 'fas fa-star' },
];

type FactionType = '大型' | '中型' | '小型';
/** 世界信息选项卡：S市势力默认数据（与世界书 S市与外部势力 一致），支持横向滚动查看；类型用于显示大/中/小型势力图标 */
const DEFAULT_FACTIONS: Array<{ 名称: string; 类型: FactionType; 领袖: string; 人数: string; 背景: string; 地点: string; 近期活动: string }> = [
  { 名称: '伊甸园', 类型: '大型', 领袖: '教授', 人数: '大型营地（工业园区）', 背景: '由教授建立的大型幸存者营地，北郊东侧工业园区。对外宣称人类最后净土，对内为等级森严的奴隶工厂。', 地点: '北郊东侧，大型工业园区内', 近期活动: '' },
  { 名称: '方舟', 类型: '大型', 领袖: '林婉（议事会主席）；程刚（护民官）', 人数: '约1200～2000人', 背景: '主城东岸 reclaimed 区，与伊甸园势均力敌。以劳换食、收容逃奴，与伊甸园长期对峙。', 地点: '主城东岸原 CBD 核心区', 近期活动: '' },
  { 名称: '铁腕', 类型: '中型', 领袖: '赵志国（指挥官）', 人数: '约200～400人', 背景: '原S市武警特警及驻军残部，东郊据点。恢复秩序、清剿尸潮，与伊甸园、商盟有摩擦也有交易。', 地点: '东郊，原军营或加固厂区', 近期活动: '' },
  { 名称: '上帝教', 类型: '大型', 领袖: '上帝之子（R市）；S市由传教使统领', 人数: 'R市数千级；S市每处数十人', 背景: '以R市为根据地的宗教政权，信奉病毒为上帝洗礼。S市西郊与西岸设传教据点。', 地点: 'R市本部；S市西郊与主城西岸据点', 近期活动: '' },
  { 名称: '渡口商盟', 类型: '中型', 领袖: '老金（金满堂，盟主）', 人数: '约150～300人', 背景: '南郊主码头与河海转运为核心，码头工人、船主、走私贩与商人组成。粮食、药品、武器、情报、人口均可买卖，立场中立偏利己。', 地点: '南郊滨海主码头及相邻仓库区', 近期活动: '' },
  { 名称: '圣烛', 类型: '小型', 领袖: '烛座苏嬷嬷（苏静修）', 人数: '约30～50人', 背景: '小型宗教聚落，信奉「病毒为神罚、赎罪者得存」。不主动扩张，对伊甸园等持敌视态度。', 地点: '西郊或北郊边缘（教堂/学校）', 近期活动: '' },
  { 名称: '断链', 类型: '小型', 领袖: '链头阿断', 人数: '约20～40人', 背景: '专门袭击伊甸园外出小队、劫持补给或解救劳工的小股武装，行踪不定，与残军、商盟有接触但不从属。', 地点: '北郊与东郊交界、伊甸园外围要道附近', 近期活动: '' },
  { 名称: '末世古惑仔', 类型: '小型', 领袖: '坐馆崩牙雄（陈志雄）', 人数: '约40～60人', 背景: '主城西岸街头帮派，讲字头论辈分守地盘，收保护费、替黑市跑腿、偶有劫掠。不惹大势力，专吃西岸边缘与拾荒者油水。', 地点: '主城西岸老城街巷与地下车库', 近期活动: '' },
  { 名称: '拾荒者聚落', 类型: '小型', 领袖: '无总舵主，各帮有话事人', 人数: '多股小团体，流动性大', 背景: '西郊与主城废墟边缘搜刮废墟、倒卖零碎物资，与黑市、商盟有松散联系，常为商盟或残军做向导。', 地点: '西郊棚户、主城西岸废墟边缘、地铁入口等', 近期活动: '' },
  { 名称: '西岸黑市', 类型: '中型', 领袖: '大中间人共治（疤叔、阿凤、老拐等）', 人数: '交易网络，无固定总部', 背景: '西岸老城地下与废墟中的交易网络，情报、药品、武器、违禁品、人口均可经中间人交易。', 地点: '主城西岸地下停车场、防空洞、废弃商场地下室', 近期活动: '' },
];

/** 势力类型对应图标（素材库 Font Awesome）：城市=大型、建筑=中型、房屋=小型 */
function factionTypeIcon(类型?: FactionType): string {
  if (类型 === '大型') return 'world-info-faction-type-大型 fa-solid fa-city';
  if (类型 === '小型') return 'world-info-faction-type-小型 fa-solid fa-house';
  return 'world-info-faction-type-中型 fa-solid fa-building';
}

const factionList = computed(() => {
  const raw = (store.data.世界?.势力信息 ?? []) as Array<{
    名称?: string;
    类型?: FactionType;
    领袖?: string;
    人数?: string;
    背景?: string;
    地点?: string;
    近期活动?: string;
  }>;
  const byName: Record<string, { 名称: string; 类型: FactionType; 领袖: string; 人数: string; 背景: string; 地点: string; 近期活动: string }> = {};
  DEFAULT_FACTIONS.forEach(f => {
    byName[f.名称] = { ...f };
  });
  raw.forEach(f => {
    if (f?.名称 && byName[f.名称]) {
      byName[f.名称] = { ...byName[f.名称], ...f };
    }
  });
  return DEFAULT_FACTIONS.map(d => byName[d.名称] ?? d);
});

/** 势力栏横向拖动滚动 */
const factionCardsScrollRef = ref<HTMLElement | null>(null);
let factionScrollStartX = 0;
let factionScrollStartLeft = 0;
function onFactionCardsMouseDown(e: MouseEvent) {
  const el = factionCardsScrollRef.value;
  if (!el) return;
  factionScrollStartX = e.pageX;
  factionScrollStartLeft = el.scrollLeft;
  el.style.cursor = 'grabbing';
  const onMove = (e2: MouseEvent) => {
    el.scrollLeft = factionScrollStartLeft + (factionScrollStartX - e2.pageX);
  };
  const onUp = () => {
    el.style.cursor = 'grab';
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

/** 世界信息子选项卡：小道消息 / 重要情报 / 任务列表 */
const activeWorldSubtab = ref<'gossip' | 'intel' | 'tasks'>('gossip');

/** 小道消息示例（当 世界.小道消息 为空时用于预览界面效果） */
const DEMO_GOSSIP: Array<{ 标题: string; 来源: string; 内容: string }> = [
  {
    标题: '处刑姬大人的秘密',
    来源: '劳工0520',
    内容: '听说处刑姬大人每天晚上都会前往C区，回来后还一脸疲惫、脸颊红润……最好别问、别看，否则就是被送去B厂区。',
  },
  {
    标题: '下水道的秘密',
    来源: '劳工9145',
    内容: '有人去过A区的下水道吗？昨天我被安排去下水道处理污垢，发现一条隐蔽的道路，走了一半实在恶臭难闻，太可怕了我就先撤回来了。',
  },
];

/** 小道消息列表，兼容旧数据（string 视为仅 内容）；无数据时显示示例便于查看呈现效果 */
const gossipList = computed(() => {
  const raw = store.data.世界?.小道消息 ?? [];
  const list = (raw as Array<{ 标题?: string; 来源?: string; 内容?: string } | string>).map(item =>
    typeof item === 'string'
      ? { 标题: '', 来源: '', 内容: item }
      : { 标题: item.标题 ?? '', 来源: item.来源 ?? '', 内容: item.内容 ?? '' },
  );
  return list.length > 0 ? list : DEMO_GOSSIP;
});

const bottomTabs = [
  { key: 'important' },
  { key: 'chen', label: '陈莹姬' },
  { key: 'team', label: '队伍' },
  { key: 'gear', label: '装备与道具' },
  { key: 'world', label: '世界信息' },
  { key: 'secret', label: '绝密档案' },
];

/** 装备与道具仅供黄晓林使用，在陈莹姬选项卡下不显示该入口 */
const visibleBottomTabs = computed(() => bottomTabs.filter(tab => tab.key !== 'gear' || !isShowingChen.value));

function getTabLabel(tab: { key: string; label?: string }) {
  if (tab.key === 'important') return '黄晓林';
  return tab.label ?? '';
}
function setActiveBottomTab(tab: { key: string }) {
  activeBottomTab.value = tab.key;
  if (tab.key !== 'team') expandedTeamMemberId.value = null;
}
</script>

