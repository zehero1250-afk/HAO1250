<template>
  <div class="status-page" :class="{ 'showing-chen': isShowingChen, 'showing-gear': activeBottomTab === 'gear' }">
    <div class="status-page-scaled">
      <!-- 装备与道具界面：仅供黄晓林使用，装备数据在黄晓林面板（攻击/防御等）呈现 -->
      <div v-if="activeBottomTab === 'gear'" class="gear-content-area">
        <div class="gear-panel visual-card">
          <div class="gear-map" aria-label="黄晓林装备位图">
            <div class="gear-empty-box" :class="`gear-empty-box-${gearEmptyBoxStage}`">
              {{ gearEmptyBoxText.slice(0, 2) }}<br />{{ gearEmptyBoxText.slice(2) }}
            </div>
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
                >{{ getEquippedInSlot(slotDef.key) }}</span
              >
              <span class="gear-slot-label-wrap" aria-hidden="true">
                <i :class="['gear-slot-label-icon', slotToIcon(slotDef.key)]"></i>
                <span class="gear-slot-label-text">{{
                  slotDef.key === 'Trinket1' ? '饰物1' : slotDef.key === 'Trinket2' ? '饰物2' : slotDef.label
                }}</span>
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
                  :class="['gear-item-card', entry.rarityClass, { 'gear-item-card-delete-mode': gearDeleteMode }]"
                  role="button"
                  tabindex="0"
                  :aria-label="gearDeleteMode ? `勾选以删除：${entry.itemName}` : `穿戴装备：${entry.itemName}`"
                  @click="gearDeleteMode ? toggleGearSelected(entry.itemName) : openInventoryItemDetail(entry.itemName)"
                  @keydown.enter.prevent="gearDeleteMode ? toggleGearSelected(entry.itemName) : openInventoryItemDetail(entry.itemName)"
                  @keydown.space.prevent="gearDeleteMode ? toggleGearSelected(entry.itemName) : openInventoryItemDetail(entry.itemName)"
                >
                  <div v-if="gearDeleteMode" class="gear-item-check-wrap">
                    <input
                      type="checkbox"
                      class="gear-item-check"
                      :checked="gearSelectedItemNames.includes(entry.itemName)"
                      :aria-label="`勾选删除：${entry.itemName}`"
                      @click.stop
                      @change="toggleGearSelected(entry.itemName)"
                    />
                  </div>
                  <div class="gear-item-surface">
                    <div class="gear-item-icon-wrap">
                      <i :class="['gear-item-icon', entry.iconClass]" aria-hidden="true"></i>
                      <span v-if="entry.数量 > 1" class="gear-item-count">{{ entry.数量 }}</span>
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
                  :class="['gear-item-card', entry.rarityClass, { 'gear-item-card-delete-mode': gearDeleteMode }]"
                  role="button"
                  tabindex="0"
                  :aria-label="gearDeleteMode ? `勾选以删除：${entry.itemName}` : `查看道具：${entry.itemName}`"
                  @click="gearDeleteMode ? toggleGearSelected(entry.itemName) : openToolItemDetail(entry.itemName)"
                  @keydown.enter.prevent="gearDeleteMode ? toggleGearSelected(entry.itemName) : openToolItemDetail(entry.itemName)"
                  @keydown.space.prevent="gearDeleteMode ? toggleGearSelected(entry.itemName) : openToolItemDetail(entry.itemName)"
                >
                  <div v-if="gearDeleteMode" class="gear-item-check-wrap">
                    <input
                      type="checkbox"
                      class="gear-item-check"
                      :checked="gearSelectedItemNames.includes(entry.itemName)"
                      :aria-label="`勾选删除：${entry.itemName}`"
                      @click.stop
                      @change="toggleGearSelected(entry.itemName)"
                    />
                  </div>
                  <div class="gear-item-surface">
                    <div class="gear-item-icon-wrap">
                      <i :class="['gear-item-icon', entry.iconClass]" aria-hidden="true"></i>
                      <span v-if="entry.数量 > 1" class="gear-item-count">{{ entry.数量 }}</span>
                    </div>
                    <div class="gear-item-name">{{ entry.itemName }}</div>
                    <div :class="['gear-item-rarity', entry.rarityBarClass]" aria-hidden="true"></div>
                  </div>
                </div>
              </div>
            </template>
          </div>
          <!-- 删除模式下显示全选、删除、取消（垃圾桶入口在时间/地点栏居中） -->
          <div v-if="gearDeleteMode" class="gear-storage-footer">
            <button type="button" class="gear-footer-btn gear-footer-select-all" @click="selectAllCurrentTabItems">
              全选
            </button>
            <button
              type="button"
              class="gear-footer-btn gear-footer-delete"
              :disabled="gearSelectedItemNames.length === 0"
              @click="confirmDeleteSelectedGearItems"
            >
              删除
            </button>
            <button type="button" class="gear-footer-btn gear-footer-cancel" @click="exitGearDeleteMode">
              取消
            </button>
          </div>
        </div>
      </div>

      <!-- 世界信息选项卡：S市势力信息四卡片 + 小道消息/附近消息/任务列表 子选项卡 -->
      <div v-if="activeBottomTab === 'world'" class="world-info-content visual-card">
        <div ref="factionCardsScrollRef" class="world-info-cards-wrap" @mousedown="onFactionCardsMouseDown">
          <div v-for="faction in factionList" :key="faction.名称" class="world-info-card">
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
                <span class="world-info-label"
                  ><i class="fas fa-user-tie world-info-icon" aria-hidden="true"></i>领袖:</span
                >
                <span class="world-info-value">{{ faction.领袖 || '—' }}</span>
              </div>
              <div class="world-info-row">
                <span class="world-info-label"
                  ><i class="fas fa-users world-info-icon" aria-hidden="true"></i>人数:</span
                >
                <span class="world-info-value">{{ faction.人数 || '—' }}</span>
              </div>
              <div class="world-info-row">
                <span class="world-info-label"
                  ><i class="fas fa-book-open world-info-icon" aria-hidden="true"></i>背景:</span
                >
                <span class="world-info-value">{{ faction.背景 || '—' }}</span>
              </div>
              <div class="world-info-row">
                <span class="world-info-label"
                  ><i class="fas fa-map-marker-alt world-info-icon" aria-hidden="true"></i>地点:</span
                >
                <span class="world-info-value">{{ faction.地点 || '—' }}</span>
              </div>
            </div>
            <div class="world-info-card-activity">
              <span class="world-info-label"
                ><i class="fas fa-clock world-info-icon" aria-hidden="true"></i>近期活动:</span
              >
              <span class="world-info-value">{{ faction.近期活动 || '—' }}</span>
            </div>
          </div>
        </div>

        <!-- 子选项卡：小道消息、附近消息、任务列表 -->
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
            <i class="fas fa-bullhorn world-info-subtab-icon" aria-hidden="true"></i>
            附近消息
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
            <article v-for="(item, index) in gossipList" :key="index" class="world-info-gossip-card">
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

        <!-- 附近消息：附近发生的暴动、公开事件、人员变动等，数据来自 世界.附近信息 -->
        <div v-show="activeWorldSubtab === 'intel'" class="world-info-subpanel world-info-nearby">
          <div v-if="nearbyList.length === 0" class="world-info-empty">
            暂无附近消息<br />
            <span class="world-info-empty-hint">附近发生暴动、公开事件、人员变动等会在此显示</span>
          </div>
          <div v-else class="world-info-nearby-scroll">
            <article v-for="(item, index) in nearbyList" :key="index" class="world-info-nearby-card">
              <div v-if="item.标题" class="world-info-nearby-head">
                <span class="world-info-nearby-title">{{ item.标题 }}</span>
              </div>
              <p class="world-info-nearby-body">{{ item.内容 || '—' }}</p>
            </article>
          </div>
        </div>
        <!-- 任务列表：卡片展示 任务名称 → 委托人 → 内容 → 完成奖励 → 进度 → 完成情况 -->
        <div v-show="activeWorldSubtab === 'tasks'" class="world-info-subpanel world-info-tasks">
          <div v-if="taskList.length === 0" class="world-info-empty">暂无任务</div>
          <div v-else class="world-info-tasks-scroll">
            <article v-for="(task, index) in taskList" :key="index" class="world-info-task-card">
              <h4 class="world-info-task-title">{{ task.标题 || '未命名任务' }}</h4>
              <div v-if="task.委托人" class="world-info-task-row">
                <span class="world-info-task-label">委托人</span>
                <span class="world-info-task-value">{{ task.委托人 }}</span>
              </div>
              <div v-if="task.描述" class="world-info-task-body">{{ task.描述 }}</div>
              <div v-if="task.完成奖励" class="world-info-task-row">
                <span class="world-info-task-label">完成奖励</span>
                <span class="world-info-task-value">{{ task.完成奖励 }}</span>
              </div>
              <div v-if="task.进度" class="world-info-task-row">
                <span class="world-info-task-label">进度</span>
                <span class="world-info-task-value">{{ task.进度 }}</span>
              </div>
              <div v-if="task.状态" class="world-info-task-row">
                <span class="world-info-task-label">完成情况</span>
                <span class="world-info-task-value world-info-task-status">{{ task.状态 }}</span>
              </div>
            </article>
          </div>
        </div>
      </div>

      <!-- 绝密档案：黄晓林战历统计面板（渐变底、五红框、永久属性加成，与标题右侧红线对齐到加成框） -->
      <div v-if="activeBottomTab === 'secret'" class="secret-battlelog-panel">
        <div class="secret-battlelog-inner">
          <div class="secret-battlelog-header">
            <div class="secret-battlelog-left">
              <div class="secret-battlelog-title-wrap">
                <h2 class="secret-battlelog-title">黄晓林战历统计面板</h2>
                <div class="secret-battlelog-title-line" aria-hidden="true"></div>
              </div>
              <div class="secret-battlelog-cards">
                <div class="secret-battlelog-card">
                  <span class="secret-battlelog-card-label">击敌数</span>
                  <span class="secret-battlelog-card-count">{{ store.data.主角?.战历统计?.杀敌数 ?? 0 }}次</span>
                  <span class="secret-battlelog-card-lv">LV:{{ store.data.主角?.战历统计?.杀敌等级 ?? 1 }}</span>
                </div>
                <div class="secret-battlelog-card">
                  <span class="secret-battlelog-card-label">道具数</span>
                  <span class="secret-battlelog-card-count">{{ store.data.主角?.战历统计?.使用道具数 ?? 0 }}次</span>
                  <span class="secret-battlelog-card-lv">LV:{{ store.data.主角?.战历统计?.使用道具等级 ?? 1 }}</span>
                </div>
                <div class="secret-battlelog-card">
                  <span class="secret-battlelog-card-label">任务数</span>
                  <span class="secret-battlelog-card-count">{{ store.data.主角?.战历统计?.任务完成数 ?? 0 }}次</span>
                  <span class="secret-battlelog-card-lv">LV:{{ store.data.主角?.战历统计?.任务完成等级 ?? 1 }}</span>
                </div>
                <div class="secret-battlelog-card">
                  <span class="secret-battlelog-card-label">检定数</span>
                  <span class="secret-battlelog-card-count">{{ store.data.主角?.战历统计?.检定成功次数 ?? 0 }}次</span>
                  <span class="secret-battlelog-card-lv">LV:{{ store.data.主角?.战历统计?.检定等级 ?? 1 }}</span>
                </div>
                <div class="secret-battlelog-card">
                  <span class="secret-battlelog-card-label">说服数</span>
                  <span class="secret-battlelog-card-count">{{ store.data.主角?.战历统计?.说服NPC次数 ?? 0 }}次</span>
                  <span class="secret-battlelog-card-lv">LV:{{ store.data.主角?.战历统计?.说服等级 ?? 1 }}</span>
                </div>
              </div>
            </div>
            <div class="secret-battlelog-bonus-box">
              <div class="secret-battlelog-bonus-title">永久属性加成</div>
              <div class="secret-battlelog-bonus-list">
                <div class="secret-battlelog-bonus-row">力量 +{{ battlelogBonusStr }}</div>
                <div class="secret-battlelog-bonus-row">敏捷 +{{ battlelogBonusAgi }}</div>
                <div class="secret-battlelog-bonus-row">体质 +{{ battlelogBonusCon }}</div>
                <div class="secret-battlelog-bonus-row">智力 +{{ battlelogBonusInt }}</div>
                <div class="secret-battlelog-bonus-row">感知 +{{ battlelogBonusWis }}</div>
                <div class="secret-battlelog-bonus-row">魅力 +{{ battlelogBonusCha }}</div>
              </div>
            </div>
          </div>

          <!-- 生理监控面板：六项统计卡 + 称号 + 评价 -->
          <div class="phys-monitor-panel">
            <div class="phys-monitor-header">
              <h2 class="phys-monitor-title">黄晓林生理监控版面</h2>
              <div class="phys-monitor-header-right">
                <button
                  type="button"
                  class="phys-monitor-special-traits-store-btn"
                  aria-label="特殊特质"
                  title="特殊特质"
                  @click="showSpecialTraitsPanel = true"
                >
                  <i class="fas fa-store" aria-hidden="true"></i>
                </button>
                <span class="phys-monitor-title-badge">称号：{{ sexTitle }}</span>
              </div>
            </div>
            <div class="phys-monitor-cards">
              <div v-for="card in physCards" :key="card.key" class="phys-monitor-card">
                <div class="phys-monitor-card-title">{{ card.label }}</div>
                <div class="phys-monitor-card-count">{{ card.count }}次</div>
                <div class="phys-monitor-card-lv">LV:{{ card.level }}</div>
              </div>
            </div>
            <div class="phys-monitor-eval">
              <span class="phys-monitor-eval-label">评价：</span>
              <span class="phys-monitor-eval-text">{{ sexEvaluation }}</span>
            </div>
            <div class="phys-monitor-special-traits">
              <div class="phys-monitor-special-traits-title">特殊特质</div>
              <div class="phys-monitor-special-traits-slots">
                <div
                  v-for="(name, i) in equippedSpecialTraits"
                  :key="i"
                  class="phys-monitor-special-trait-slot"
                  :class="{ 'phys-monitor-special-trait-slot-filled': !!name }"
                  role="button"
                  tabindex="0"
                  :aria-label="name ? `解除 ${name}` : '空槽位'"
                  @click="name && unequipSpecialTrait(i)"
                  @keydown.enter.prevent="name && unequipSpecialTrait(i)"
                  @keydown.space.prevent="name && unequipSpecialTrait(i)"
                >
                  {{ name || '—' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 重要人物：主角在背景故事中遇到的角色，点击展开查看详情 -->
      <div v-if="activeBottomTab === 'npcs'" class="npcs-content visual-card">
        <div class="npcs-header">重要人物</div>
        <div v-if="importantCharactersList.length === 0" class="npcs-empty">暂无重要人物记录</div>
        <div v-else class="npcs-list">
          <input
            ref="npcAvatarInputRef"
            type="file"
            accept="image/*"
            class="avatar-input"
            aria-hidden="true"
            @change="onNpcAvatarChange"
          />
          <div
            v-for="(npc, index) in importantCharactersList"
            :key="npc.角色名称 + String(index)"
            class="npc-card"
            :class="{ 'npc-card-expanded': expandedNpcIndex === index }"
          >
            <div
              class="npc-card-head"
              role="button"
              tabindex="0"
              :aria-expanded="expandedNpcIndex === index"
              @click="toggleNpcExpand(index)"
              @keydown.enter.prevent="toggleNpcExpand(index)"
              @keydown.space.prevent="toggleNpcExpand(index)"
            >
              <div
                class="npc-head-avatar-wrap"
                role="button"
                tabindex="-1"
                title="点击上传头像"
                @click.stop="triggerNpcAvatarInput(index)"
                @keydown.enter.prevent="triggerNpcAvatarInput(index)"
                @keydown.space.prevent="triggerNpcAvatarInput(index)"
              >
                <img
                  v-if="npc.头像"
                  :src="npc.头像"
                  class="npc-head-avatar-img"
                  alt=""
                />
                <div v-else class="npc-head-avatar-placeholder">
                  <i class="fas fa-user" aria-hidden="true"></i>
                </div>
              </div>
              <div class="npc-head-info">
                <span class="npc-name">{{ npc.角色名称 || '未命名' }}</span>
                <div class="npc-head-meta-bar">
                  <span class="npc-head-lv">LV:{{ npc.等级 ?? 1 }}</span>
                  <span class="npc-head-race">种族:{{ npc.种族 || '—' }}</span>
                </div>
                <span class="npc-head-job">职业:{{ npc.职业 || '—' }}</span>
              </div>
              <div class="npc-head-right">
                <div class="npc-favor-ring" :title="`好感度 ${npc.好感度 ?? 0}`">
                  <svg viewBox="0 0 36 36" class="npc-favor-ring-svg">
                    <circle class="npc-favor-ring-bg" cx="18" cy="18" r="14" fill="none" />
                    <circle
                      class="npc-favor-ring-fill"
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      :stroke-dasharray="npcFavorRingDash(npc.好感度 ?? 0)"
                    />
                  </svg>
                  <i class="fas fa-heart npc-favor-ring-heart" aria-hidden="true"></i>
                </div>
                <i class="npc-chevron fas fa-chevron-down" aria-hidden="true"></i>
              </div>
            </div>
            <div v-show="expandedNpcIndex === index" class="npc-card-expand">
              <div class="npc-panel">
                <div class="npc-panel-attrs">
                  <div
                    v-for="item in attrList"
                    :key="item.key"
                    class="npc-panel-attr-item"
                  >
                    <i :class="['npc-panel-attr-icon', item.icon]" aria-hidden="true"></i>
                    <div class="npc-panel-attr-text">
                      <span class="npc-panel-attr-label">{{ item.label }}</span>
                      <span class="npc-panel-attr-value">{{ getNpcAttr(npc, item.key) }}</span>
                    </div>
                  </div>
                </div>

                <div class="npc-panel-favor-row">
                  <i class="fas fa-heart npc-panel-favor-icon" aria-hidden="true"></i>
                  <div class="npc-panel-favor-bar" :title="`好感度 ${npc.好感度 ?? 0}`">
                    <div class="npc-panel-favor-fill" :style="{ width: (npc.好感度 ?? 0) + '%' }"></div>
                  </div>
                  <span class="npc-panel-favor-value">{{ npc.好感度 ?? 0 }}</span>
                </div>

                <div class="npc-panel-sections">
                  <div class="npc-panel-row">
                    <span class="npc-panel-label">外貌</span>
                    <p class="npc-panel-text">{{ npc.外貌描述 || '—' }}</p>
                  </div>
                  <div class="npc-panel-row">
                    <span class="npc-panel-label">服装</span>
                    <p class="npc-panel-text">{{ npc.服装描述 || '—' }}</p>
                  </div>
                  <div class="npc-panel-row">
                    <span class="npc-panel-label">性格</span>
                    <p class="npc-panel-text">{{ npc.性格 || '—' }}</p>
                  </div>
                  <div class="npc-panel-row">
                    <span class="npc-panel-label">背景</span>
                    <p class="npc-panel-text">{{ npc.背景故事 || '—' }}</p>
                  </div>
                  <div class="npc-panel-row npc-panel-row-inner">
                    <span class="npc-panel-label">内心</span>
                    <p class="npc-panel-text npc-panel-text-inner">{{ npc.内心话 || '—' }}</p>
                  </div>
                  <div class="npc-panel-row npc-panel-cell-empty" aria-hidden="true"></div>
                </div>
              </div>
            </div>
          </div>
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
                    <img
                      v-if="getTeamAvatarUrl(memberId)"
                      :src="getTeamAvatarUrl(memberId)!"
                      :alt="`${memberId}头像`"
                    />
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
                      <span class="ring-label"
                        >HP:{{ teamMemberDisplay(memberId).currentHp }}/{{ teamMemberDisplay(memberId).maxHp }}</span
                      >
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
                    <div
                      class="card-exp-fill"
                      :style="{ width: teamMemberDisplay(memberId).expBarPercent + '%' }"
                    ></div>
                  </div>
                  <span class="card-exp-value"
                    >{{ teamMemberDisplay(memberId).expDisplay }}/{{ teamMemberDisplay(memberId).expNextLevel }}</span
                  >
                </div>
              </div>
              <div class="card-bottom">
                <div class="card-quote">{{ teamMemberDisplay(memberId).personalThought || '.......' }}</div>
                <i class="team-card-chevron fas fa-chevron-down" aria-hidden="true"></i>
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
                      :class="[
                        'chen-pill',
                        'chen-pill-weapon',
                        'chen-pill-clickable',
                        getGradeClass(getTeamMemberData(memberId)?.武器?.品级),
                      ]"
                      @click.stop="openEquipDetailFromTeam('weapon', memberId)"
                      >{{ getTeamMemberData(memberId)?.武器?.名称 ?? '—' }}</span
                    >
                    <span v-if="getTeamMemberData(memberId)?.武器?.加成" class="chen-pill chen-pill-bonus">{{
                      getTeamMemberData(memberId)?.武器?.加成
                    }}</span>
                  </div>
                </div>
                <div class="chen-equip-col">
                  <span class="chen-equip-label">躯干</span>
                  <div class="chen-equip-content">
                    <span
                      :class="[
                        'chen-pill',
                        'chen-pill-armor',
                        'chen-pill-clickable',
                        getGradeClass((getTeamMemberData(memberId)?.躯干 ?? getTeamMemberData(memberId)?.护甲)?.品级),
                      ]"
                      @click.stop="openEquipDetailFromTeam('torso', memberId)"
                      >{{ (getTeamMemberData(memberId)?.躯干 ?? getTeamMemberData(memberId)?.护甲)?.名称 ?? '—' }}</span
                    >
                    <span
                      v-if="(getTeamMemberData(memberId)?.躯干 ?? getTeamMemberData(memberId)?.护甲)?.加成"
                      class="chen-pill chen-pill-bonus"
                      >{{ (getTeamMemberData(memberId)?.躯干 ?? getTeamMemberData(memberId)?.护甲)?.加成 }}</span
                    >
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

      <!-- 黄晓林面板与六维属性（非 gear、非 world、非 team、非 npcs、非 secret 选项卡时显示） -->
      <div
        v-if="activeBottomTab !== 'gear' && activeBottomTab !== 'world' && activeBottomTab !== 'team' && activeBottomTab !== 'npcs' && activeBottomTab !== 'secret'"
        class="visual-card"
      >
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
            <div class="card-currency">
              <i class="fas fa-star card-points-icon" aria-hidden="true"></i>
              <div class="card-currency-text">
                <span class="card-currency-label">工分</span>
                <span class="card-currency-value" :title="String(store.data.主角?.积分 ?? 0)">
                  {{ pointsDisplay }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 六维属性条（非 gear、非 world、非 team、非 npcs、非 secret 时显示） -->
      <div
        v-if="activeBottomTab !== 'gear' && activeBottomTab !== 'world' && activeBottomTab !== 'team' && activeBottomTab !== 'npcs' && activeBottomTab !== 'secret'"
        class="attr-bar"
      >
        <div v-for="item in attrList" :key="item.key" class="attr-item">
          <i :class="[item.icon, 'attr-icon']"></i>
          <div class="attr-text">
            <span class="attr-label">{{ item.label }}</span>
            <span class="attr-value">{{ attrValue(item.key) }}</span>
          </div>
        </div>
      </div>

      <!-- 陈莹姬：武器 / 躯干 / 技能 / 奥义（与图片 1:1：左标题 + 右 stacked pills，点击武器/躯干名称弹出详情） -->
      <div
        v-if="activeBottomTab !== 'gear' && activeBottomTab !== 'world' && activeBottomTab !== 'team' && activeBottomTab !== 'npcs' && activeBottomTab !== 'secret' && isShowingChen"
        class="chen-equip-block"
      >
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
      <div
        v-if="activeBottomTab !== 'gear' && activeBottomTab !== 'world' && activeBottomTab !== 'team' && activeBottomTab !== 'npcs' && activeBottomTab !== 'secret' && !isShowingChen"
        class="traits-skills-block"
      >
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
          <span
            class="ts-label skill-label skill-label-clickable"
            role="button"
            tabindex="0"
            title="打开技能树"
            @click="openSkillTreeModal"
            @keydown.enter.prevent="openSkillTreeModal"
            @keydown.space.prevent="openSkillTreeModal"
          >技能</span>
          <div class="ts-slots">
            <button
              v-for="j in 5"
              :key="'s-' + j"
              type="button"
              class="ts-slot skill-slot"
              :class="{
                filled: skillList[j - 1],
                actionable: skillQuickReleaseOpen && skillList[j - 1],
              }"
              :title="skillList[j - 1] ? (skillQuickReleaseOpen ? `释放${skillList[j - 1]}技能` : `查看${skillList[j - 1]}描述`) : '空技能槽（点击打开技能树）'"
              @click="skillQuickReleaseOpen && skillList[j - 1] ? onSkillSlotClick(skillList[j - 1]) : (skillList[j - 1] ? openSlotSkillDetail(j - 1) : openSkillTreeModal())"
            >
              {{ truncateSkillSlotName(skillList[j - 1]) }}
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

      <!-- 外部容器：金属框、时间、地点（随变量更新）；装备与道具选项卡时居中显示垃圾桶 -->
      <div class="status-layout">
        <span class="status-time">
          <span class="status-icon status-icon-clock" aria-hidden="true"></span>
          <span>{{ store.data.世界?.当前时间 || '—' }}</span>
        </span>
        <button
          v-if="activeBottomTab === 'gear'"
          type="button"
          class="status-trash"
          aria-label="勾选装备或道具后删除"
          title="勾选装备或道具后删除"
          @click="enterGearDeleteMode"
        >
          <i class="fas fa-trash-alt" aria-hidden="true"></i>
        </button>
        <span class="status-location">
          <span class="status-icon status-icon-pin" aria-hidden="true"></span>
          <span>{{ store.data.世界?.当前地点 || '—' }}</span>
        </span>
      </div>
      <!-- 底部选项卡 -->
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

    <!-- 特殊特质商店、技能树弹窗：挂载在根下，任意选项卡下均可打开 -->
    <Teleport to="body">
      <div
        v-if="showSpecialTraitsPanel"
        class="special-traits-panel-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="special-traits-panel-title"
        @click.self="showSpecialTraitsPanel = false"
      >
        <div class="special-traits-panel secret-battlelog-panel">
          <div class="special-traits-panel-inner secret-battlelog-inner">
            <div class="special-traits-panel-header">
              <h2 id="special-traits-panel-title" class="secret-battlelog-title">特殊特质</h2>
              <button
                type="button"
                class="special-traits-panel-close"
                aria-label="关闭"
                @click="showSpecialTraitsPanel = false"
              >
                <i class="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>
            <p class="special-traits-panel-desc">达成生理监控等级要求后解锁，点击「穿戴」填入下方槽位。</p>
            <div class="special-traits-panel-sections">
              <div
                v-for="(label, catIndex) in PHYS_CATEGORY_LABELS"
                :key="catIndex"
                class="special-traits-section"
              >
                <h3 class="special-traits-section-title">{{ label }}</h3>
                <div class="special-traits-cards">
                  <div
                    v-for="traitLevel in TRAIT_LEVELS"
                    :key="traitLevel"
                    class="special-trait-card"
                    :class="{
                      'special-trait-card-locked': !isSpecialTraitUnlocked(catIndex, traitLevel),
                      'special-trait-card-equipped':
                        (store.data.主角?.特殊特质 ?? [])[catIndex] ===
                        (SPECIAL_TRAIT_TABLE[catIndex] as Record<number, string>)[traitLevel],
                    }"
                  >
                    <div class="special-trait-card-head">
                      <span class="special-trait-card-name">Lv.{{ traitLevel }} {{ (SPECIAL_TRAIT_TABLE[catIndex] as Record<number, string>)[traitLevel] }}</span>
                      <span
                        v-if="!isSpecialTraitUnlocked(catIndex, traitLevel)"
                        class="special-trait-card-lock"
                        title="未达成等级"
                      >
                        <i class="fas fa-lock" aria-hidden="true"></i>
                      </span>
                      <button
                        v-else
                        type="button"
                        class="special-trait-card-equip"
                        :disabled="
                          (store.data.主角?.特殊特质 ?? [])[catIndex] ===
                          (SPECIAL_TRAIT_TABLE[catIndex] as Record<number, string>)[traitLevel]
                        "
                        @click="
                          equipSpecialTrait(
                            catIndex,
                            (SPECIAL_TRAIT_TABLE[catIndex] as Record<number, string>)[traitLevel],
                          )
                        "
                      >
                        {{
                          (store.data.主角?.特殊特质 ?? [])[catIndex] ===
                            (SPECIAL_TRAIT_TABLE[catIndex] as Record<number, string>)[traitLevel]
                            ? '已穿戴'
                            : '穿戴'
                        }}
                      </button>
                    </div>
                    <p class="special-trait-card-desc">
                      {{ (SPECIAL_TRAIT_DESCRIPTIONS[catIndex] as Record<number, string>)[traitLevel] }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
    <Teleport to="body">
      <div
        v-if="showSkillTreeModal"
        class="skill-tree-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="skill-tree-dialog-title"
        @click.self="onSkillTreeOverlayClick"
      >
        <!-- 图一：重新生成技能树表单 -->
        <div
          v-if="skillTreeModalMode === 'form'"
          class="skill-tree-panel skill-tree-form-panel"
        >
          <div class="skill-tree-panel-header">
            <h2 id="skill-tree-dialog-title" class="skill-tree-panel-title">
              <i class="fas fa-star" aria-hidden="true"></i>
              重新生成技能树
            </h2>
            <button type="button" class="skill-tree-panel-close" aria-label="关闭" @click="closeSkillTreeModal">
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
          <div class="skill-tree-form-banner">
            <i class="fas fa-info-circle" aria-hidden="true"></i>
            <span>生成后将先展示预览，确认后才会替换当前技能树。</span>
          </div>
          <div class="skill-tree-form-body">
            <label class="skill-tree-field">
              <span class="skill-tree-field-label">职业名称 <span class="required">*</span></span>
              <input v-model="skillTreeForm.职业名称" type="text" class="skill-tree-input" placeholder="如：流浪剑客" />
            </label>
            <label class="skill-tree-field">
              <span class="skill-tree-field-label">战斗风格</span>
              <div class="skill-tree-tags">
                <button
                  v-for="opt in SKILL_TREE_STYLE_OPTIONS"
                  :key="opt"
                  type="button"
                  class="skill-tree-tag"
                  :class="{ active: skillTreeForm.战斗风格 === opt }"
                  @click="skillTreeForm.战斗风格 = opt"
                >
                  {{ opt }}
                </button>
              </div>
            </label>
            <label class="skill-tree-field">
              <span class="skill-tree-field-label">主要武器/媒介</span>
              <input
                v-model="skillTreeForm.主要武器"
                type="text"
                class="skill-tree-input"
                placeholder="如：双剑、法杖、拳套、枪械…"
              />
            </label>
            <label class="skill-tree-field">
              <span class="skill-tree-field-label">职业风格描述</span>
              <textarea
                v-model="skillTreeForm.职业风格描述"
                class="skill-tree-textarea"
                placeholder="描述这个职业的特色、战斗方式、技能风格等…"
                rows="3"
              />
            </label>
            <label class="skill-tree-field">
              <span class="skill-tree-field-label">额外风格要求 <span class="optional">(可选)</span></span>
              <textarea
                v-model="skillTreeForm.额外要求"
                class="skill-tree-textarea"
                placeholder="对技能命名风格、特效描述等的额外要求…"
                rows="2"
              />
            </label>
          </div>
          <div class="skill-tree-form-footer">
            <button
              type="button"
              class="skill-tree-btn skill-tree-btn-primary"
              :disabled="!skillTreeForm.职业名称.trim() || skillTreeGenerating"
              @click="startSkillTreeGenerate"
            >
              <i class="fas fa-star" aria-hidden="true"></i>
              {{ skillTreeGenerating ? '生成中…' : '开始生成' }}
            </button>
          </div>
        </div>

        <!-- 图二：新技能树预览（按 LV 分组，点击技能弹出描述，穿戴入槽） -->
        <div
          v-else-if="skillTreeModalMode === 'preview'"
          class="skill-tree-panel skill-tree-preview-panel"
        >
          <div class="skill-tree-panel-header">
            <h2 class="skill-tree-panel-title">◎ 新技能树预览</h2>
            <button type="button" class="skill-tree-panel-close" aria-label="关闭" @click="closeSkillTreeModal">
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
          <div class="skill-tree-form-banner">
            <i class="fas fa-info-circle" aria-hidden="true"></i>
            <span>请检查生成的技能树，确认无误后点击「确认替换」应用到角色。点击技能可查看描述，再点击穿戴加入技能槽。</span>
          </div>
          <div class="skill-tree-preview-body">
            <div
              v-for="group in skillTreePreviewGroups"
              :key="group.level"
              class="skill-tree-lv-group"
            >
              <h3 class="skill-tree-lv-title">LV.{{ group.level }} 解锁</h3>
              <div class="skill-tree-cards">
                <div
                  v-for="(skill, idx) in group.skills"
                  :key="group.level + '-' + idx"
                  class="skill-tree-card"
                  :class="{ locked: (store.data.主角?.等级 ?? 1) < skill.解锁等级 }"
                  role="button"
                  tabindex="0"
                      @click="openSkillDetail(skill)"
                      @keydown.enter.prevent="openSkillDetail(skill)"
                      @keydown.space.prevent="openSkillDetail(skill)"
                >
                  <span class="skill-tree-card-name">{{ skill.名称 }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="skill-tree-preview-slots">
            <span class="skill-tree-slots-label">当前技能槽：</span>
            <div class="skill-tree-slots">
              <div
                v-for="(name, slotIdx) in previewSelectedSlots"
                :key="slotIdx"
                class="skill-tree-slot"
              >
                <span class="skill-tree-slot-name">{{ name || '—' }}</span>
                <button
                  v-if="name"
                  type="button"
                  class="skill-tree-slot-remove"
                  aria-label="脱下"
                  @click="previewUnequipSlot(slotIdx)"
                >
                  <i class="fas fa-times" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="skill-tree-preview-footer">
            <button type="button" class="skill-tree-btn skill-tree-btn-outline" @click="skillTreeBackToForm">
              <i class="fas fa-redo" aria-hidden="true"></i>
              重新生成
            </button>
            <button type="button" class="skill-tree-btn skill-tree-btn-ghost" @click="closeSkillTreeModal">
              放弃
            </button>
            <button type="button" class="skill-tree-btn skill-tree-btn-primary" @click="confirmSkillTreeReplace">
              <i class="fas fa-check" aria-hidden="true"></i>
              确认替换
            </button>
          </div>
        </div>

        <!-- 图三：确认后的固定界面（6 排 18 技能 + 底部重新生成） -->
        <div
          v-else-if="skillTreeModalMode === 'view'"
          class="skill-tree-panel skill-tree-view-panel"
        >
          <div class="skill-tree-panel-header">
            <h2 class="skill-tree-panel-title">技能树</h2>
            <button type="button" class="skill-tree-panel-close" aria-label="关闭" @click="closeSkillTreeModal">
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
          <div class="skill-tree-view-body">
            <div
              v-for="(row, rowIdx) in skillTreeViewRows"
              :key="rowIdx"
              class="skill-tree-view-row"
            >
              <div
                v-for="(skill, colIdx) in row"
                :key="rowIdx + '-' + colIdx"
                class="skill-tree-card skill-tree-view-card"
                :class="{ locked: (store.data.主角?.等级 ?? 1) < (skill?.解锁等级 ?? 1) }"
                role="button"
                tabindex="0"
                @click="skill && openSkillDetail(skill)"
                @keydown.enter.prevent="skill && openSkillDetail(skill)"
                @keydown.space.prevent="skill && openSkillDetail(skill)"
              >
                <span class="skill-tree-card-name">{{ skill?.名称 ?? '—' }}</span>
              </div>
            </div>
          </div>
          <div class="skill-tree-view-footer">
            <button type="button" class="skill-tree-btn skill-tree-btn-outline" @click="skillTreeBackToFormFromView">
              <i class="fas fa-redo" aria-hidden="true"></i>
              重新生成
            </button>
          </div>
        </div>
      </div>

      <!-- 技能详情浮层：点击技能后显示描述 + 穿戴按钮 -->
      <div
        v-if="showSkillTreeModal && selectedSkillDetail"
        class="skill-detail-overlay"
        role="dialog"
        aria-modal="true"
        @click.self="selectedSkillDetail = null"
      >
        <div class="skill-detail-panel">
          <div class="skill-detail-header">
            <h3 class="skill-detail-title">{{ selectedSkillDetail.名称 }}</h3>
            <button type="button" class="skill-tree-panel-close" aria-label="关闭" @click="selectedSkillDetail = null">
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
          <p class="skill-detail-meta">LV.{{ selectedSkillDetail.解锁等级 }} 解锁 · {{ selectedSkillDetail.技能类型 || '主动' }} · 伤害倍率 {{ Math.round(displayDamageRate(selectedSkillDetail.伤害倍率) * 100) }}%</p>
          <p v-if="(store.data.主角?.等级 ?? 1) < selectedSkillDetail.解锁等级" class="skill-detail-lock-hint">需要角色达到 LV.{{ selectedSkillDetail.解锁等级 }} 才能穿戴</p>
          <p class="skill-detail-desc">{{ selectedSkillDetail.描述 }}</p>
          <div class="skill-detail-footer">
            <button
              type="button"
              class="skill-tree-btn skill-tree-btn-primary"
              :disabled="!canEquipSelectedSkill"
              @click="equipSelectedSkillToSlot"
            >
              穿戴
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 技能槽详情浮层：主界面技能槽点击后查看描述 + 卸载 -->
    <Teleport to="body">
      <div
        v-if="selectedSlotForDetail"
        class="skill-detail-overlay"
        role="dialog"
        aria-modal="true"
        @click.self="selectedSlotForDetail = null"
      >
        <div class="skill-detail-panel">
          <div class="skill-detail-header">
            <h3 class="skill-detail-title">{{ selectedSlotForDetail.skill.名称 }}</h3>
            <button type="button" class="skill-tree-panel-close" aria-label="关闭" @click="selectedSlotForDetail = null">
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
          <p class="skill-detail-meta">LV.{{ selectedSlotForDetail.skill.解锁等级 }} 解锁 · {{ selectedSlotForDetail.skill.技能类型 || '主动' }} · 伤害倍率 {{ Math.round(displayDamageRate(selectedSlotForDetail.skill.伤害倍率) * 100) }}%</p>
          <p class="skill-detail-desc">{{ selectedSlotForDetail.skill.描述 }}</p>
          <div class="skill-detail-footer">
            <button type="button" class="skill-tree-btn skill-tree-btn-primary" @click="unequipSlotSkill">
              卸载
            </button>
          </div>
        </div>
      </div>
    </Teleport>

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
              <button type="button" class="equip-detail-action-btn equip-detail-action-btn-use" @click="doUseToolItem">
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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useIntervalFn } from '@vueuse/core';
import traitShopRaw from '../../世界书/特质商店.yaml?raw';
import { Schema } from '../../schema';
import { drawWeightedOne, getLegendaryOrArtifactPool, toDrawResult } from './luckyDrawPool';
import { useDataStore } from './store';
import {
  expForLevel,
  generateTorso,
  generateWeapon,
  getGradeByLevel,
  hpFromLevel,
  pickRandomProfession,
  pickRandomSkillUltimate,
  randomAbilityScores,
  randomFavorAndSanity,
  randomLevel,
} from './teamEquipGen';

const STORAGE_AVATAR_KEY = 'hxl_status_avatar';
const STORAGE_AVATAR_KEY_CHEN = 'hxl_status_avatar_陈莹姬';
/** 队伍卡头像：旧键仅用于陈莹姬迁移；新键为 hxl_status_avatar_队伍_<memberId> */
const STORAGE_AVATAR_KEY_CHEN_TEAM = 'hxl_status_avatar_陈莹姬_队伍';
const STORAGE_AVATAR_KEY_TEAM_PREFIX = 'hxl_status_avatar_队伍_';
const TRAIT_SLOT_COUNT = 7;

const store = useDataStore();

/** 更频繁从最新楼层拉取变量并同步到 store，避免新增队友后要等 2 秒才显示 */
let stopSyncFromLatest: (() => void) | undefined;
onMounted(() => {
  const { pause } = useIntervalFn(() => {
    if (document.body.style.display === 'none') return;
    try {
      const raw = _.get(getVariables({ type: 'message', message_id: -1 }), 'stat_data', {});
      const result = Schema.safeParse(raw);
      if (!result.success) return;
      const parsed = result.data;
      // 远端 stat_data 可能尚未包含本端刚生成的 队伍[id]，合并保留当前 store 中已有队友数据，避免覆盖后队友栏不显示
      const 队友List = Array.isArray(parsed.主角?.队友)
        ? (parsed.主角.队友 as string[])
        : typeof parsed.主角?.队友 === 'string' && parsed.主角.队友
          ? [parsed.主角.队友]
          : [];
      const 当前队伍 = store.data.队伍 ?? {};
      const 远端队伍 = parsed.队伍 ?? {};
      let 队伍Merged = false;
      const merged队伍 = { ...远端队伍 };
      for (const id of 队友List) {
        if (!id) continue;
        if (merged队伍[id] == null && 当前队伍[id] != null) {
          merged队伍[id] = 当前队伍[id];
          队伍Merged = true;
        }
      }
      const dataToPatch = 队伍Merged ? { ...parsed, 队伍: merged队伍 } : parsed;
      if (队伍Merged) console.info('[状态栏] 同步：远端 stat_data 缺少部分队伍成员，已保留本地 store 中的队伍数据', Object.keys(merged队伍));
      if (_.isEqual(store.data, dataToPatch)) return;
      store.$patch({ data: dataToPatch });
    } catch {
      // 忽略跨域或变量未就绪
    }
  }, 600);
  stopSyncFromLatest = pause;
});
onUnmounted(() => {
  stopSyncFromLatest?.();
});

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
      ? (localStorage.getItem(STORAGE_AVATAR_KEY_CHEN_TEAM) ??
        localStorage.getItem(STORAGE_AVATAR_KEY_TEAM_PREFIX + memberId))
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
            ? (localStorage.getItem(STORAGE_AVATAR_KEY_CHEN_TEAM) ??
              localStorage.getItem(STORAGE_AVATAR_KEY_TEAM_PREFIX + id))
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

/** 技能树弹窗：表单 → 生成 → 预览；点击技能弹出描述，穿戴入槽 */
const SKILL_TREE_STYLE_OPTIONS = ['近战物理', '远程物理', '魔法输出', '召唤/辅助', '混合型'] as const;
const SKILL_TREE_UNLOCK_LEVELS = [1, 1, 1, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60] as const;
const SKILL_TREE_DAMAGE_RATE_MIN = 1.4;
const SKILL_TREE_DAMAGE_RATE_MAX = 3.5;

/** 展示用：把可能误存的百分比（如 188）转为倍率 1.4～3.5，再用于显示为百分比 */
function displayDamageRate(rate: number | undefined): number {
  let v = Number(rate) || 1;
  if (v > 10) v = v / 100;
  return Math.max(SKILL_TREE_DAMAGE_RATE_MIN, Math.min(SKILL_TREE_DAMAGE_RATE_MAX, v));
}

/** 将解析出的一条技能（兼容 name/skill_name/title、description/desc/detail/effect 等）规范为统一结构，倍率限制在 1.4～3.5 */
function normalizeSkillTreeItem(
  s: Record<string, unknown>,
  index: number,
): { 名称: string; 解锁等级: number; 伤害倍率: number; 技能类型?: '主动' | '被动'; 描述: string } {
  const name = (s.名称 ?? s.name ?? s.skill_name ?? s.skill ?? s.title ?? `技能${index + 1}`) as string;
  const desc = (s.描述 ?? s.description ?? s.desc ?? s.detail ?? s.effect ?? '') as string;
  let rate = Number(s.伤害倍率 ?? s.damageMultiplier ?? 1) || 1;
  if (rate > 10) rate = rate / 100;
  rate = Math.max(SKILL_TREE_DAMAGE_RATE_MIN, Math.min(SKILL_TREE_DAMAGE_RATE_MAX, rate));
  const type = (s.技能类型 ?? s.type ?? '主动') as '主动' | '被动';
  const level = Number(s.解锁等级 ?? s.level) || SKILL_TREE_UNLOCK_LEVELS[index];
  return {
    名称: String(name || `技能${index + 1}`),
    解锁等级: level,
    伤害倍率: rate,
    技能类型: type === '被动' ? '被动' : '主动',
    描述: String(desc || '暂无技能描述'),
  };
}
const showSkillTreeModal = ref(false);
const skillTreeModalMode = ref<'form' | 'preview' | 'view'>('form');
const skillTreeForm = ref({
  职业名称: '流浪剑客',
  战斗风格: '近战物理' as string,
  主要武器: '',
  职业风格描述: '',
  额外要求: '',
});
const generatedSkillTree = ref<Array<{ 名称: string; 解锁等级: number; 伤害倍率: number; 技能类型?: '主动' | '被动'; 描述: string }>>([]);
const skillTreeGenerating = ref(false);
const previewSelectedSlots = ref<string[]>(['', '', '', '', '']);
const selectedSkillDetail = ref<{ 名称: string; 解锁等级: number; 伤害倍率: number; 技能类型?: '主动' | '被动'; 描述: string } | null>(null);

const skillTreePreviewGroups = computed(() => {
  const tree = generatedSkillTree.value;
  const map = new Map<number, { 名称: string; 解锁等级: number; 伤害倍率: number; 技能类型?: '主动' | '被动'; 描述: string }[]>();
  for (const s of tree) {
    const list = map.get(s.解锁等级) ?? [];
    list.push(s);
    map.set(s.解锁等级, list);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([level, skills]) => ({ level, skills }));
});

/** 确认后的技能树展示：18 个技能排 6 排，每排 3 个 */
const skillTreeViewRows = computed(() => {
  const tree = (store.data.主角?.技能树 ?? []) as Array<{ 名称: string; 解锁等级: number; 伤害倍率: number; 技能类型?: '主动' | '被动'; 描述: string }>;
  const list = tree.slice(0, 18);
  const rows: typeof list[] = [];
  for (let r = 0; r < 6; r++) rows.push(list.slice(r * 3, r * 3 + 3));
  return rows;
});

const activeBottomTab = ref('important');
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

function openSkillTreeModal() {
  const tree = store.data.主角?.技能树 ?? [];
  if (tree.length >= 18) {
    skillTreeModalMode.value = 'view';
  } else {
    skillTreeModalMode.value = 'form';
    generatedSkillTree.value = [];
    previewSelectedSlots.value = ['', '', '', '', ''];
  }
  selectedSkillDetail.value = null;
  showSkillTreeModal.value = true;
}
function closeSkillTreeModal() {
  showSkillTreeModal.value = false;
  selectedSkillDetail.value = null;
}
function onSkillTreeOverlayClick() {
  if (!selectedSkillDetail.value) closeSkillTreeModal();
}
/** 从模型返回文本中尽量提取出 JSON 数组（支持 markdown、多余解释、{ skills: [...] } 外包、字符串 JSON 等） */
function extractSkillTreeJson(text: string): Array<Record<string, unknown>> {
  if (!text || typeof text !== 'string') return [];
  let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start !== -1 && end !== -1 && end >= start) {
      cleaned = cleaned.slice(start, end + 1);
    }
    const data = JSON.parse(cleaned);
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray(data.skills)) return data.skills;
    return [];
  } catch {
    // 忽略，尝试括号匹配
  }
  const stripped = text.replace(/```json?\s*|\s*```/g, '').trim();
  const start = stripped.indexOf('[');
  if (start !== -1) {
    for (let i = stripped.length - 1; i > start; i--) {
      if (stripped[i] !== ']') continue;
      try {
        const parsed = JSON.parse(stripped.slice(start, i + 1));
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // 继续尝试更短的截断
      }
    }
  }
  const arrayStartMatch = stripped.match(/\[\s*\{/);
  if (arrayStartMatch && arrayStartMatch.index !== undefined) {
    const slice = extractJsonArraySlice(stripped, arrayStartMatch.index);
    if (slice) {
      try {
        const parsed = JSON.parse(slice);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.skills)) return parsed.skills;
      } catch {
        // 忽略
      }
    }
  }
  console.warn('技能树 JSON 解析失败，未能提取数组');
  return [];
}

/** 从 text[startIdx] 的 [ 开始，按括号匹配截取到对应的 ] 为止（忽略字符串内的括号） */
function extractJsonArraySlice(text: string, startIdx: number): string | null {
  let depth = 1;
  let i = startIdx + 1;
  let inString = false;
  let escape = false;
  let quote = '';
  while (i < text.length && depth > 0) {
    const c = text[i];
    if (escape) {
      escape = false;
      i++;
      continue;
    }
    if (inString) {
      if (c === '\\') escape = true;
      else if (c === quote) inString = false;
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      inString = true;
      quote = c;
      i++;
      continue;
    }
    if (c === '[') depth++;
    else if (c === ']') depth--;
    i++;
  }
  if (depth === 0) return text.slice(startIdx, i);
  return null;
}

async function startSkillTreeGenerate() {
  const form = skillTreeForm.value;
  if (!form.职业名称.trim()) return;
  if (typeof generate !== 'function') {
    toastr.error('技能树生成需要酒馆助手提供的 generate 接口，请确保在酒馆中加载本界面。', '无法生成');
    return;
  }
  skillTreeGenerating.value = true;
  const systemPrompt = `你是一个资深 TRPG / DnD 规则设计师和技能树设计助手。

【输出格式强制】你的回复必须且仅能是一个 JSON 数组，即回复的第一行第一个非空白字符必须是 [，最后一行以 ] 结尾。禁止输出：时间、地点、当前情景、角色数据、人物位置、任何自然语言说明或总结。只输出一个 [ {...}, {...}, ... ] 形式的数组，否则解析将失败。
【数量强制】数组必须包含恰好 18 个技能对象，不能只输出 1 个或少数几个；若因 token 限制或截断只输出了部分对象，前端会报「解析结果不足18个」。请务必一次性输出完整的 18 个对象。

你的任务是：根据用户给出的职业名称、战斗方式、武器、风格描述，设计一个完整的 18 个技能的技能树。
【基本要求】
1. 一共恰好 18 个技能，按数组顺序从 1 到 18 编号，每个对象都必须包含 名称、解锁等级、伤害倍率、技能类型、描述 五个字段。
2. 解锁等级固定且与数组下标对应：
   - 第 1,2,3 个技能：解锁等级 = 1（初始技能）
   - 第 4~18 个技能：解锁等级依次为 4,8,12,16,20,24,28,32,36,40,44,48,52,56,60（共 15 个）。
3. 每个技能是一个 JSON 对象，字段为：
   - "名称": string，中文技能名，必须贴合职业、战斗风格和武器，不允许用“技能1”“技能2”“Skill 1”“招式A”这类编号或占位名称。
   - "解锁等级": number，对应上面规定的等级。
   - "伤害倍率": number，从 1.4（140%）起步，序号越靠后的技能倍率越高，在 1.4～3.5 之间递增（第 1 个约 1.4，第 18 个约 3.5）。
   - "技能类型": string，只能是 "主动" 或 "被动"。主动=需要主动释放的技能；被动=常驻或触发式效果（如光环、被动增益）。
   - "描述": string，使用 DnD / TRPG 风格的效果描述，包含检定、豁免、伤害类型、持续时间等要素，例如：
     - “进行一次基于力量的近战攻击检定，命中则造成 1d8 斩击伤害，并迫使目标进行一次 DC 13 体质豁免，失败则在 1 轮内减速。”
     - “你获得等同于等级的临时生命值，持续 1 分钟，在此期间对魅惑效果的豁免检定具有优势。”
   描述必须至少 2 句，不要简略成一句话。
【Buff 技能分布规则】
1. 初始的前三个技能中，必须有且仅有 1 个是偏“Buff / 辅助 / 持续效果”的技能（例如护盾、增益、位置强化），另外 2 个以攻击或控制为主。
2. 从第 4 个技能开始，每 4 个技能中必须至少有 1 个是 Buff / 辅助类，其余以攻击 / 控制为主。一个简单的方式是让第 5,9,13,17 个技能都是 Buff 类技能。
3. Buff 技能需要在名称和描述中明显体现它是 Buff / 辅助效果，例如：
   - 名称中包含“姿态”“祷言”“印记”“契约”“战技·守势”等；
   - 描述中体现增加 AC、增加命中检定、给予优势、临时生命值、抗性提升、豁免加值等效果。
4. 非 Buff 技能以造成伤害、控制（击退、倒地、缴械）、位移为主，也可以带小幅度 Debuff 或触发检定。
【风格要求】
1. 技能名称和描述必须明显围绕用户给定的：职业名称、战斗风格、主要武器/媒介、职业风格描述、额外要求来设计。
   - 例如：若职业是“链锯狂徒”，武器是“链锯”，就多用撕裂、溅射、齿轮咬合等意象。
   - 若战斗方式是“支援、鼓舞队友”，就多设计 Buff / 激励类技能。
2. 全程使用简体中文输出。
3. 严禁输出任何 markdown 代码块、前置说明、结语或解释文本；严禁输出「当前情景」「角色数据」「时间/地点」等与技能树无关的内容。只允许输出一个以 [ 开头、以 ] 结尾的 JSON 数组。
4. JSON 数组格式示例：
   [
     {"名称":"XXX","解锁等级":1,"伤害倍率":1.4,"技能类型":"主动","描述":"……"},
     {"名称":"YYY","解锁等级":1,"伤害倍率":1.45,"技能类型":"被动","描述":"……"}
   ]`;
  const userContent = `职业名称：${form.职业名称}
战斗风格：${form.战斗风格}
主要武器/媒介：${form.主要武器 || '未指定'}
职业风格描述：${form.职业风格描述 || '未指定'}
${form.额外要求 ? '额外要求：' + form.额外要求 : ''}

请生成恰好 18 个技能的 JSON 数组（不能少于 18 个）。回复必须直接以 [ 开头、以 ] 结尾，不要输出时间、地点、情景、角色数据或任何其它文字。`;
  try {
    const result = await generate({
      user_input: userContent,
      injects: [{ role: 'system', content: systemPrompt, position: 'in_chat', depth: 0, should_scan: false }],
      should_silence: true,
    });
    console.log('技能树生成 · AI返回原文:', result ?? '');
    const parsed = extractSkillTreeJson(result ?? '');
    if (parsed.length === 0) {
      console.warn('技能树解析失败，模型返回:', result?.slice(0, 200));
      toastr.error(
        '模型返回的内容无法解析为技能列表（需要 JSON 数组或 { skills: [...] }）。请检查 API 是否正常，或重试。',
        '技能树生成失败',
      );
      return;
    }
    if (parsed.length < 18) {
      console.warn('技能树解析结果不足18个（可能被截断或模型只返回了部分）', parsed.length, parsed);
      generatedSkillTree.value = parsed.slice(0, 18).map((s, i) =>
        normalizeSkillTreeItem(typeof s === 'object' && s !== null ? (s as Record<string, unknown>) : {}, i),
      );
      while (generatedSkillTree.value.length < 18) {
        const idx = generatedSkillTree.value.length;
        const rate = SKILL_TREE_DAMAGE_RATE_MIN + (idx / 17) * (SKILL_TREE_DAMAGE_RATE_MAX - SKILL_TREE_DAMAGE_RATE_MIN);
        generatedSkillTree.value.push({
          名称: `技能${idx + 1}`,
          解锁等级: SKILL_TREE_UNLOCK_LEVELS[idx],
          伤害倍率: Math.round(rate * 100) / 100,
          描述: '待补充。',
        });
      }
      toastr.info(
        parsed.length === 1
          ? '只解析到 1 个技能（可能被截断或返回空对象），已用占位补足 18 个。请调高 API 的 max_tokens 或重试。'
          : `只解析到 ${parsed.length} 个技能，已用占位补足 18 个。`,
        '技能树生成',
      );
    } else {
      generatedSkillTree.value = parsed.slice(0, 18).map((s, i) =>
        normalizeSkillTreeItem(typeof s === 'object' && s !== null ? (s as Record<string, unknown>) : {}, i),
      );
      toastr.success('技能树已生成，请预览并确认替换。', '生成成功');
    }
    previewSelectedSlots.value = [
      generatedSkillTree.value[0]?.名称 ?? '',
      generatedSkillTree.value[1]?.名称 ?? '',
      generatedSkillTree.value[2]?.名称 ?? '',
      '',
      '',
    ];
    skillTreeModalMode.value = 'preview';
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('技能树生成失败', e);
    toastr.error(
      msg.includes('AbortError') || msg.includes('abort')
        ? '生成已取消。'
        : `生成失败：${msg.slice(0, 80)}${msg.length > 80 ? '…' : ''}。请检查酒馆 API 配置与网络后重试。`,
      '技能树生成失败',
    );
  } finally {
    skillTreeGenerating.value = false;
  }
}
function openSkillDetail(skill: { 名称: string; 解锁等级: number; 伤害倍率: number; 技能类型?: '主动' | '被动'; 描述: string }) {
  selectedSkillDetail.value = skill;
}
const canEquipSelectedSkill = computed(() => {
  const skill = selectedSkillDetail.value;
  if (!skill) return false;
  const current = store.data.主角?.等级 ?? 1;
  if (current < skill.解锁等级) return false;
  if (skillTreeModalMode.value === 'view') {
    const 技能 = store.data.主角?.技能 ?? [];
    const slots = [...技能, '', '', '', ''].slice(0, 5);
    if (slots.includes(skill.名称)) return false;
    return slots.some(s => !s);
  }
  const slots = previewSelectedSlots.value;
  if (slots.includes(skill.名称)) return false;
  return slots.some(s => !s);
});
function equipSelectedSkillToSlot() {
  const skill = selectedSkillDetail.value;
  if (!skill || !canEquipSelectedSkill.value) return;
  if (skillTreeModalMode.value === 'view') {
    const 主角 = store.data.主角;
    if (!主角) return;
    const 技能 = [...(主角.技能 ?? [])];
    while (技能.length < 5) 技能.push('');
    const idx = 技能.findIndex(s => !s);
    if (idx === -1) return;
    技能[idx] = skill.名称;
    store.data.主角 = { ...主角, 技能: 技能.slice(0, 5) };
    selectedSkillDetail.value = null;
    return;
  }
  const slots = [...previewSelectedSlots.value];
  const idx = slots.findIndex(s => !s);
  if (idx === -1) return;
  slots[idx] = skill.名称;
  previewSelectedSlots.value = slots;
  selectedSkillDetail.value = null;
}
function previewUnequipSlot(slotIdx: number) {
  const slots = [...previewSelectedSlots.value];
  slots[slotIdx] = '';
  previewSelectedSlots.value = slots;
}
function skillTreeBackToForm() {
  skillTreeModalMode.value = 'form';
  selectedSkillDetail.value = null;
}
function confirmSkillTreeReplace() {
  const 主角 = store.data.主角;
  if (!主角) return;
  const tree = generatedSkillTree.value;
  const slots = previewSelectedSlots.value.filter(Boolean);
  store.data.主角 = {
    ...主角,
    技能树: tree,
    技能: [...slots, '', '', '', ''].slice(0, 5),
  };
  selectedSkillDetail.value = null;
  skillTreeModalMode.value = 'view';
}
function skillTreeBackToFormFromView() {
  skillTreeModalMode.value = 'form';
  generatedSkillTree.value = [];
  previewSelectedSlots.value = ['', '', '', '', ''];
  selectedSkillDetail.value = null;
}

const ownedTraits = computed(() => store.data.主角?.特质 ?? []);
const currentRp = computed(() => store.data.主角?.RP点 ?? 0);
const skillList = computed(() => store.data.主角?.技能 ?? []);

/** 技能槽显示：超出 4 个字用省略号代替 */
function truncateSkillSlotName(name: string | undefined): string {
  const n = name || '';
  return n.length > 4 ? n.slice(0, 4) + '…' : n;
}

/** 技能槽点击查看描述时：当前选中的槽位及其在技能树中的详情 */
const selectedSlotForDetail = ref<{
  slotIndex: number;
  skill: { 名称: string; 解锁等级: number; 伤害倍率: number; 技能类型?: '主动' | '被动'; 描述: string };
} | null>(null);
function getSkillFromTreeByName(name: string) {
  const tree = (store.data.主角?.技能树 ?? []) as Array<{ 名称: string; 解锁等级: number; 伤害倍率: number; 技能类型?: '主动' | '被动'; 描述: string }>;
  return tree.find(s => s.名称 === name) ?? null;
}
function openSlotSkillDetail(slotIndex: number) {
  const name = skillList.value[slotIndex];
  if (!name) return;
  const skill = getSkillFromTreeByName(name);
  if (skill) selectedSlotForDetail.value = { slotIndex, skill };
  else selectedSlotForDetail.value = { slotIndex, skill: { 名称: name, 解锁等级: 1, 伤害倍率: 1.4, 描述: '（技能树中未找到该技能描述）' } };
}
function unequipSlotSkill() {
  const cur = selectedSlotForDetail.value;
  if (!cur || !store.data.主角) return;
  const 技能 = [...(store.data.主角.技能 ?? [])];
  while (技能.length < 5) 技能.push('');
  技能[cur.slotIndex] = '';
  store.data.主角 = { ...store.data.主角, 技能: 技能.slice(0, 5) };
  selectedSlotForDetail.value = null;
}
const currencyDisplay = computed(() => {
  if (isShowingChen.value) return '—';
  const value = store.data.主角?.货币 ?? 0;
  return new Intl.NumberFormat('zh-CN').format(value);
});
const pointsDisplay = computed(() => {
  if (isShowingChen.value) return '—';
  const value = store.data.主角?.积分 ?? 0;
  return new Intl.NumberFormat('zh-CN').format(value);
});

/** 绝密档案战历面板：各战历等级带来的永久属性加成（等级 1 = +0，等级 10 = +9） */
const battlelogBonusStr = computed(() => Math.max(0, (store.data.主角?.战历统计?.杀敌等级 ?? 1) - 1));
const battlelogBonusAgi = computed(() => Math.max(0, (store.data.主角?.战历统计?.杀敌等级 ?? 1) - 1));
const battlelogBonusCon = computed(() => Math.max(0, (store.data.主角?.战历统计?.使用道具等级 ?? 1) - 1));
const battlelogBonusInt = computed(() => Math.max(0, (store.data.主角?.战历统计?.任务完成等级 ?? 1) - 1));
const battlelogBonusWis = computed(() => Math.max(0, (store.data.主角?.战历统计?.检定等级 ?? 1) - 1));
const battlelogBonusCha = computed(() => Math.max(0, (store.data.主角?.战历统计?.说服等级 ?? 1) - 1));

/** 生理监控面板：从主角.生理统计 中读取六项次数，缺省为 0 */
type AnyRecord = Record<string, unknown>;
const physStats = computed(() => (store.data.主角?.生理统计 as AnyRecord | undefined) ?? {});
function getPhysCount(key: string): number {
  const raw = (physStats.value as AnyRecord)[key];
  const n = typeof raw === 'number' ? raw : Number(raw ?? 0);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}
function levelFromCount(count: number): number {
  return Math.max(0, Math.floor(count / 10));
}
const physCards = computed(() => {
  const defs = [
    { key: 'mouth', label: '口舌', countKey: '口舌次数' },
    { key: 'rod', label: '肉棒', countKey: '肉棒次数' },
    { key: 'rear', label: '后穴', countKey: '后穴次数' },
    { key: 'nipple', label: '乳头', countKey: '乳头次数' },
    { key: 'orgasm', label: '高潮', countKey: '高潮次数' },
    { key: 'abuse', label: '受虐', countKey: '受虐次数' },
  ] as const;
  return defs.map(d => {
    const count = getPhysCount(d.countKey);
    return { key: d.key, label: d.label, count, level: levelFromCount(count) };
  });
});
const totalSexCount = computed(() => physCards.value.reduce((sum, c) => sum + c.count, 0));
const sexTitle = computed(() => (totalSexCount.value > 0 ? '前处男' : '处男'));
const sexEvaluation = computed(() => {
  const n = totalSexCount.value;
  if (n === 0) {
    return '目前完全没有任何实战经验，是妥妥的纯情处男状态。';
  }
  if (n < 10) {
    return '已经开始接触亲密体验，但整体节奏仍然偏保守和青涩。';
  }
  if (n < 30) {
    return '逐渐习惯各类生理刺激，身体与心理都在向老练方向发展。';
  }
  return '在高频率的亲密行为中保持稳定发挥，经验充足甚至略有过载倾向。';
});

/** 生理监控特殊特质：每 10 次 1 级，每 2 级解锁对应特质；六类顺序为口舌、肉棒、后穴、乳头、高潮、受虐；槽位为玩家穿戴的 主角.特殊特质 */
const SPECIAL_TRAIT_TABLE: Record<number, string>[] = [
  { 2: '高效摄入', 4: '味觉钝化', 6: '唾液合成', 8: '深度泵动', 10: '完美消化' },
  { 2: '欲望导管', 4: '服从印记', 6: '高频泵送', 8: '能量回馈', 10: '完美容器' },
  { 2: '根基稳固', 4: '深度储存', 6: '内循环', 8: '第二心脏', 10: '无尽容纳' },
  { 2: '敏感天线', 4: '激素平衡', 6: '危险直觉', 8: '精神反哺', 10: '双子连接' },
  { 2: '余韵爆发', 4: '多重反馈', 6: '极乐战栗', 8: '喷射动力', 10: '灵魂震荡' },
  { 2: '厚实表皮', 4: '痛苦麻痹', 6: '伤痕护甲', 8: '反击律动', 10: '终极受体' },
];
const SPECIAL_TRAIT_DESCRIPTIONS: Record<number, string>[] = [
  {
    2: '吞咽动作更加顺畅。使用口服类恢复道具时，恢复效果翻倍。',
    4: '免疫一切口服药物带来的负面苦味或恶心惩罚。服用带有副作用的增强剂时，豁免检定具有优势。',
    6: '你的唾液能中和毒素。吞咽毒素后可进行一次体质检定，成功则将其转化为 5 点临时生命值。',
    8: '吞咽动作能产生极强快感。每次使用恢复道具时，额外回复 1d10 点理智值。',
    10: '每日一次，服用药物后可选择不消耗该道具。',
  },
  {
    2: '互动时可以从对方身上「偷取」少量体力。每次互动恢复 1d4 点 HP。',
    4: '每当该部位被主角折磨或使用，你对主角的指令服从度（DC）自动降低。',
    6: '互动的效率大幅提升。原本需要 1 小时的劳作/服侍，现在只需 30 分钟即可达成同等效果。',
    8: '喷发时，可将自身的一半剩余体力传输给主角。',
    10: '身体能完美适应任何要求。互动时，双方的疲劳度不再上升。',
  },
  {
    2: '下盘力量增强。对抗「倒地」或「击退」的检定获得 +2 奖励。',
    4: '肠道空间异化。你可以在体内隐藏最多两个小型道具，且无法被常规搜身发现。',
    6: '长时间劳作或行军时，耐力消耗减半。进入「精疲力竭」状态的阈值提高。',
    8: '受到致命伤时，该部位的肌肉剧烈收缩保护内脏。你的死亡救助豁免具有优势。',
    10: '物理耐力达到极限。你的最大体力上限永久增加 20%。',
  },
  {
    2: '感知属性中的被动察觉（Passive Perception）+3。',
    4: '即使处于极度恐惧的环境下，通过刺激该部位，你的理智检定获得 +2 奖励。',
    6: '不会被突袭。当有敌人潜行靠近时，你的身体会先一步产生应激反应。',
    8: '受到精神攻击时，你可以通过物理痛觉抵消精神伤害，将受到的智力/感知伤害减半。',
    10: '只要该部位受到持续刺激，你可以与队友共享视野，并免疫一切「魅惑」效果。',
  },
  {
    2: '高潮后的 10 分钟内，你的所有伤害加值获得 +2 奖励。',
    4: '连续高潮不再带来虚弱。每连续高潮一次，下一轮的命中投骰获得 +1（可叠加）。',
    6: '巅峰时刻可立刻重置一个冷却中的动作或技能（每长休一次）。',
    8: '高潮瞬间爆发的能量使你的移动速度翻倍，持续 1 个回合。',
    10: '你的高潮能产生一股心灵冲击，令 10 尺内敌人必须通过 DC 15 感知豁免，否则陷入「惊惧」状态。',
  },
  {
    2: 'AC 获得 +1 常驻加值。',
    4: '受到伤害时，若伤害值低于 10 点，则视为 0 点（仅限非魔法攻击）。',
    6: 'AC 再获得 +1 加值。身上每有一处永久性伤疤（或烙印），AC 额外 +1（最高叠加至 +2）。',
    8: '当敌人对你的攻击未命中时，你可以利用身体的反射震荡使对方的力量检定具有劣势。',
    10: 'AC 获得 +2 加值。受到暴击时，可将其转化为普通伤害。',
  },
];
const PHYS_CATEGORY_LABELS = ['口舌', '肉棒', '后穴', '乳头', '高潮', '受虐'] as const;
const TRAIT_LEVELS = [2, 4, 6, 8, 10] as const;
const physCountKeys = ['口舌次数', '肉棒次数', '后穴次数', '乳头次数', '高潮次数', '受虐次数'] as const;

const showSpecialTraitsPanel = ref(false);
/** 已装备的 6 个特殊特质（来自 主角.特殊特质），槽位与六类一一对应 */
const equippedSpecialTraits = computed(() => {
  const arr = store.data.主角?.特殊特质 ?? [];
  return Array.from({ length: 6 }, (_, i) => (arr[i] ?? '') as string);
});
/** 某类当前等级（每 10 次 1 级） */
function getPhysCategoryLevel(catIndex: number): number {
  return Math.min(10, Math.max(0, Math.floor(getPhysCount(physCountKeys[catIndex]) / 10)));
}
/** 某类某等级特质是否已解锁（当前类别等级 >= 该特质等级） */
function isSpecialTraitUnlocked(catIndex: number, traitLevel: number): boolean {
  return getPhysCategoryLevel(catIndex) >= traitLevel;
}
function equipSpecialTrait(catIndex: number, traitName: string) {
  const 主角 = store.data.主角;
  if (!主角) return;
  const 特殊特质 = [...(主角.特殊特质 ?? []), ...Array(6).fill('')].slice(0, 6) as string[];
  特殊特质[catIndex] = traitName;
  store.data.主角 = { ...主角, 特殊特质 };
}
function unequipSpecialTrait(slotIndex: number) {
  const 主角 = store.data.主角;
  if (!主角) return;
  const 特殊特质 = [...(主角.特殊特质 ?? []), ...Array(6).fill('')].slice(0, 6) as string[];
  特殊特质[slotIndex] = '';
  store.data.主角 = { ...主角, 特殊特质 };
}

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
/** 装备/道具栏删除模式：点击垃圾桶进入，可勾选物品后删除；取消或删除完成后退出 */
const gearDeleteMode = ref(false);
/** 删除模式下已勾选的物品名（装备栏+道具栏共用，按名称删除） */
const gearSelectedItemNames = ref<string[]>([]);

function enterGearDeleteMode() {
  gearDeleteMode.value = true;
  gearSelectedItemNames.value = [];
}
function exitGearDeleteMode() {
  gearDeleteMode.value = false;
  gearSelectedItemNames.value = [];
}
/** 当前标签页（装备栏或道具栏）下的所有物品名 */
const currentTabItemNames = computed(() =>
  activeStorageTab.value === 'gear'
    ? inventoryItems.value.map(e => e.itemName)
    : toolItems.value.map(e => e.itemName),
);
function toggleGearSelected(itemName: string) {
  const list = gearSelectedItemNames.value;
  const i = list.indexOf(itemName);
  if (i === -1) gearSelectedItemNames.value = [...list, itemName];
  else gearSelectedItemNames.value = list.slice(0, i).concat(list.slice(i + 1));
}
function selectAllCurrentTabItems() {
  gearSelectedItemNames.value = [...currentTabItemNames.value];
}
function confirmDeleteSelectedGearItems() {
  const 主角 = store.data.主角;
  if (!主角 || gearSelectedItemNames.value.length === 0) return;
  const 物品栏 = { ...(主角.物品栏 ?? {}) };
  for (const name of gearSelectedItemNames.value) delete 物品栏[name];
  const 已装备 = { ...(主角.已装备 ?? {}) };
  for (const [slot, name] of Object.entries(已装备)) if (gearSelectedItemNames.value.includes(name)) delete 已装备[slot];
  store.data.主角 = { ...主角, 物品栏, 已装备 };
  gearSelectedItemNames.value = [];
  gearDeleteMode.value = false;
}

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
  const 物品栏 = store.data.主角?.物品栏 ?? {};
  return Object.entries(物品栏)
    .filter(([name, item]) => item.可装备部位 && (item.数量 ?? 1) > 0)
    .map(([name, item]) => {
      const rarity = gearRarityFromGrade(item.品级);
      return {
        itemName: name,
        数量: item.数量 ?? 1,
        rarityClass: `gear-item-card-${rarity}`,
        rarityBarClass: `gear-item-rarity-${rarity}`,
        iconClass: slotToIcon(item.可装备部位 ?? ''),
      };
    });
});

/** 道具栏：物品栏中没有「可装备部位」的道具/消耗品，且数量>0 */
const toolItems = computed(() => {
  const 物品栏 = store.data.主角?.物品栏 ?? {};
  return Object.entries(物品栏)
    .filter(([, item]) => !item.可装备部位 && (item.数量 ?? 1) > 0)
    .map(([name, item]) => {
      const rarity = gearRarityFromGrade(item.品级);
      return {
        itemName: name,
        数量: item.数量 ?? 1,
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
/** 穿戴：从物品栏取1件（数量-1），写入已装备槽位并关闭弹窗。若该槽位已有装备，先将其退回物品栏再穿戴。饰品（Trinket1/Trinket2）自动选第一个空槽 */
function doEquip() {
  const 主角 = store.data.主角;
  const itemName = gearDetailItemName.value;
  if (!主角 || !itemName) return;
  const item = 主角.物品栏?.[itemName];
  if (!item?.可装备部位) return;
  const 数量 = item.数量 ?? 1;
  if (数量 < 1) return;
  if (!主角.已装备) 主角.已装备 = {};
  let slot = item.可装备部位;
  if (slot === 'Trinket1' || slot === 'Trinket2') {
    if (!主角.已装备['Trinket1']) slot = 'Trinket1';
    else if (!主角.已装备['Trinket2']) slot = 'Trinket2';
    else slot = 'Trinket2'; // 两槽都满时新装备占第二槽（覆盖）
  }
  const 物品栏 = { ...(主角.物品栏 ?? {}) };
  const oldItemName = 主角.已装备[slot];
  if (oldItemName && oldItemName !== itemName) {
    const oldExisting = 物品栏[oldItemName];
    const old数量 = (oldExisting?.数量 ?? 0) + 1;
    const oldBase = oldExisting ?? { 描述: oldItemName, 数量: 0 };
    物品栏[oldItemName] = { ...oldBase, 数量: old数量, 可装备部位: slot };
  }
  主角.已装备[slot] = itemName;
  if (数量 <= 1) {
    物品栏[itemName] = { ...item, 数量: 0 };
  } else {
    物品栏[itemName] = { ...item, 数量: 数量 - 1 };
  }
  主角.物品栏 = 物品栏;
  equipDetailOpen.value = false;
}
/** 脱下：从已装备槽位移除，数量+1 回物品栏，关闭弹窗 */
function doUnequip() {
  const 主角 = store.data.主角;
  if (!主角) return;
  const slot = gearDetailSlot.value;
  const itemName = 主角.已装备?.[slot];
  if (主角.已装备) delete 主角.已装备[slot];
  if (itemName) {
    const 物品栏 = { ...(主角.物品栏 ?? {}) };
    const existing = 物品栏[itemName];
    const 数量 = (existing?.数量 ?? 0) + 1;
    const base = existing ?? { 描述: itemName, 数量: 0 };
    物品栏[itemName] = { ...base, 数量, 可装备部位: slot };
    主角.物品栏 = 物品栏;
  }
  equipDetailOpen.value = false;
}
/** 道具使用：数量-1（为0则移除），将「使用xxx（道具名称）」写入酒馆回复框并关闭弹窗 */
async function doUseToolItem() {
  const name = gearDetailItemName.value?.trim();
  if (!name) return;
  const 主角 = store.data.主角;
  const item = 主角?.物品栏?.[name];
  if (item) {
    const 数量 = item.数量 ?? 1;
    if (数量 <= 1) {
      const 物品栏 = { ...(主角!.物品栏 ?? {}) };
      delete 物品栏[name];
      主角!.物品栏 = 物品栏;
    } else {
      主角!.物品栏 = { ...(主角!.物品栏 ?? {}), [name]: { ...item, 数量: 数量 - 1 } };
    }
  }
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
const teamChenWeapon = computed(
  () => store.data.队伍陈莹姬?.武器 ?? { 名称: '寂静M4A1消音步枪', 加成: '力量+3 感知+3' },
);
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

/** 重要人物：当前展开的卡片索引，点击切换展开/收起 */
const expandedNpcIndex = ref<number | null>(null);

function toggleNpcExpand(index: number) {
  expandedNpcIndex.value = expandedNpcIndex.value === index ? null : index;
}

/** 重要人物列表（主角.重要人物），兼容未解析的脏数据 */
const importantCharactersList = computed(() => {
  const raw = store.data.主角?.重要人物;
  if (!Array.isArray(raw)) return [];
  return (raw as Array<Record<string, unknown>>).map(item => ({
    角色名称: String(item?.角色名称 ?? ''),
    头像: typeof item?.头像 === 'string' ? item.头像 : undefined,
    种族: String(item?.种族 ?? ''),
    等级: Number(item?.等级 ?? 1),
    职业: String(item?.职业 ?? ''),
    外貌描述: String(item?.外貌描述 ?? ''),
    服装描述: String(item?.服装描述 ?? ''),
    性格: String(item?.性格 ?? ''),
    背景故事: String(item?.背景故事 ?? ''),
    能力值: (item?.能力值 as Record<string, number>) ?? {},
    内心话: String(item?.内心话 ?? ''),
    好感度: Number(item?.好感度 ?? 0),
  }));
});

function getNpcAttr(npc: { 能力值?: Record<string, number> }, key: string) {
  return (npc.能力值 as Record<string, number>)?.[key] ?? '—';
}

/** 重要人物头像：当前正在上传的条目索引 */
const currentUploadingNpcIndex = ref<number | null>(null);
const npcAvatarInputRef = ref<HTMLInputElement | null>(null);

function triggerNpcAvatarInput(index: number) {
  currentUploadingNpcIndex.value = index;
  npcAvatarInputRef.value?.click();
}

function onNpcAvatarChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  const index = currentUploadingNpcIndex.value;
  if (!file || index == null) return;
  const reader = new FileReader();
  reader.onload = () => {
    const data = reader.result as string;
    const 主角 = store.data.主角;
    if (!主角) return;
    const 重要人物 = [...(主角.重要人物 ?? [])];
    const item = 重要人物[index];
    if (!item) return;
    重要人物[index] = { ...item, 头像: data };
    store.data.主角 = { ...主角, 重要人物 };
  };
  reader.readAsDataURL(file);
  input.value = '';
  currentUploadingNpcIndex.value = null;
}

/** 好感度环形：stroke-dasharray 用于 SVG 圆环进度，周长约 88，从顶部顺时针 */
function npcFavorRingDash(favor: number) {
  const circumference = 2 * Math.PI * 14;
  const filled = (Math.min(100, Math.max(0, favor)) / 100) * circumference;
  return `${filled} ${circumference}`;
}

/** 队伍栏：当前在队友名单中的 NPC 标识；规范化为主角.队友恒为数组。陈莹姬仅在「陈莹姬」选项卡展示，不在此列表显示。 */
const teamMembers = computed(() => {
  const raw = store.data.主角?.队友;
  const arr = Array.isArray(raw) ? (raw as string[]) : typeof raw === 'string' && raw ? [raw] : [];
  return arr.filter(id => id !== '陈莹姬');
});

/** 获取某队友在队伍栏的数据（队伍[id] 优先；陈莹姬兼容旧存档 队伍陈莹姬，缺省时用主卡 陈莹姬 以便入队后立即显示） */
function getTeamMemberData(memberId: string) {
  const 队伍 = store.data.队伍;
  if (队伍?.[memberId] != null) return 队伍[memberId];
  if (memberId === '陈莹姬') return store.data.队伍陈莹姬 ?? store.data.陈莹姬;
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

/** 陈莹姬默认武器/躯干名称，用于判断新队友是否被误填了陈莹姬那套（需按职业重新生成） */
const CHEN_WEAPON_NAME = '寂静M4A1消音步枪';
const CHEN_TORSO_NAME = '性感COS警察制服';

function isChenDefaultEquip(entry: Record<string, unknown>): boolean {
  const 武器 = entry?.武器 as { 名称?: string } | undefined;
  const 躯干 = (entry?.躯干 ?? entry?.护甲) as { 名称?: string } | undefined;
  return 武器?.名称 === CHEN_WEAPON_NAME || 躯干?.名称 === CHEN_TORSO_NAME;
}

/** 已有顶层数据的 NPC（如陈莹姬）入队时保留其职业与装备；仅全新 id 用 新队友默认 + 随机职业 + 生成装备 */
const EXISTING_NPC_KEYS = ['陈莹姬'] as const;
let syncingTeamData = false;

/** 入队时自动生成并持久化：已有数据的 NPC 沿用主卡数据，其余种族沿用 新队友默认，职业随机，武器/躯干/技能/奥义按职业生成；若已有条目但仍是陈莹姬那套则按职业覆盖 */
watch(
  () => [(store.data.主角?.队友 ?? []) as string[], store.data.新队友默认, store.data.陈莹姬],
  () => {
    if (syncingTeamData) return;
    const raw = store.data.主角?.队友;
    const 队友List = Array.isArray(raw) ? (raw as string[]) : typeof raw === 'string' && raw ? [raw] : [];
    const 队伍 = store.data.队伍 ?? {};
    const 默认 = store.data.新队友默认;
    let next: Record<string, unknown> = { ...队伍 };
    let changed = false;
    for (const id of 队友List) {
      if (!id) continue;
      if (EXISTING_NPC_KEYS.includes(id as (typeof EXISTING_NPC_KEYS)[number])) {
        if (next[id] == null) {
          const existing = id === '陈莹姬' ? store.data.陈莹姬 : undefined;
          if (existing && typeof existing === 'object') {
            next[id] = klona(existing);
            changed = true;
          }
        }
        continue;
      }
      // 新队友：无条目则完整生成；有条目但武器/躯干仍是陈莹姬那套则按职业覆盖武器/躯干/技能/奥义
      const existingEntry = next[id] as Record<string, unknown> | undefined;
      if (existingEntry != null && typeof existingEntry === 'object' && !isChenDefaultEquip(existingEntry)) {
        continue; // 已有且非陈莹姬默认，不覆盖
      }
      if (existingEntry == null) {
        if (!默认 || typeof 默认 !== 'object') continue;
        const base = klona(默认) as Record<string, unknown>;
        const 等级 = randomLevel();
        const 职业 = pickRandomProfession();
        const 品级 = getGradeByLevel(等级);
        base.等级 = 等级;
        base.能力值 = randomAbilityScores();
        const { 当前HP, 最大HP } = hpFromLevel(等级);
        base.当前HP = 当前HP;
        base.最大HP = 最大HP;
        base.经验值 = expForLevel(等级);
        const { 好感度, 理智 } = randomFavorAndSanity();
        base.好感度 = 好感度;
        base.理智 = 理智;
        const { 技能, 奥义 } = pickRandomSkillUltimate(职业);
        base.技能 = 技能;
        base.奥义 = 奥义;
        base.职业 = 职业;
        base.武器 = generateWeapon(职业, 品级);
        base.躯干 = generateTorso(职业, 品级);
        next[id] = base;
        changed = true;
      } else {
        // 已有条目但为陈莹姬默认装备，按职业重新生成武器/躯干/技能/奥义，并让经验值与等级一致
        const 职业 = (existingEntry.职业 as string) || pickRandomProfession();
        const 等级 = (typeof existingEntry.等级 === 'number' ? existingEntry.等级 : undefined) ?? randomLevel();
        const 品级 = getGradeByLevel(等级);
        const { 技能, 奥义 } = pickRandomSkillUltimate(职业);
        existingEntry.职业 = 职业;
        existingEntry.等级 = 等级;
        existingEntry.经验值 = expForLevel(等级);
        existingEntry.技能 = 技能;
        existingEntry.奥义 = 奥义;
        existingEntry.武器 = generateWeapon(职业, 品级);
        existingEntry.躯干 = generateTorso(职业, 品级);
        changed = true;
      }
    }
    if (changed && !_.isEqual(store.data.队伍 ?? {}, next)) {
      syncingTeamData = true;
      store.data.队伍 = next as typeof store.data.队伍;
      queueMicrotask(() => {
        syncingTeamData = false;
      });
      console.info('[状态栏] 入队逻辑：已更新 store.data.队伍，MVU store 的 watch 将把完整 stat_data 写回最新楼层变量', Object.keys(next));
    }
  },
  { immediate: true },
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
const DEFAULT_FACTIONS: Array<{
  名称: string;
  类型: FactionType;
  领袖: string;
  人数: string;
  背景: string;
  地点: string;
  近期活动: string;
}> = [
  {
    名称: '伊甸园',
    类型: '大型',
    领袖: '教授',
    人数: '大型营地（工业园区）',
    背景: '由教授建立的大型幸存者营地，北郊东侧工业园区。对外宣称人类最后净土，对内为等级森严的奴隶工厂。',
    地点: '北郊东侧，大型工业园区内',
    近期活动: '',
  },
  {
    名称: '方舟',
    类型: '大型',
    领袖: '林婉（议事会主席）；程刚（护民官）',
    人数: '约1200～2000人',
    背景: '主城东岸 reclaimed 区，与伊甸园势均力敌。以劳换食、收容逃奴，与伊甸园长期对峙。',
    地点: '主城东岸原 CBD 核心区',
    近期活动: '',
  },
  {
    名称: '铁腕',
    类型: '中型',
    领袖: '赵志国（指挥官）',
    人数: '约200～400人',
    背景: '原S市武警特警及驻军残部，东郊据点。恢复秩序、清剿尸潮，与伊甸园、商盟有摩擦也有交易。',
    地点: '东郊，原军营或加固厂区',
    近期活动: '',
  },
  {
    名称: '上帝教',
    类型: '大型',
    领袖: '上帝之子（R市）；S市由传教使统领',
    人数: 'R市数千级；S市每处数十人',
    背景: '以R市为根据地的宗教政权，信奉病毒为上帝洗礼。S市西郊与西岸设传教据点。',
    地点: 'R市本部；S市西郊与主城西岸据点',
    近期活动: '',
  },
  {
    名称: '渡口商盟',
    类型: '中型',
    领袖: '老金（金满堂，盟主）',
    人数: '约150～300人',
    背景: '南郊主码头与河海转运为核心，码头工人、船主、走私贩与商人组成。粮食、药品、武器、情报、人口均可买卖，立场中立偏利己。',
    地点: '南郊滨海主码头及相邻仓库区',
    近期活动: '',
  },
  {
    名称: '圣烛',
    类型: '小型',
    领袖: '烛座苏嬷嬷（苏静修）',
    人数: '约30～50人',
    背景: '小型宗教聚落，信奉「病毒为神罚、赎罪者得存」。不主动扩张，对伊甸园等持敌视态度。',
    地点: '西郊或北郊边缘（教堂/学校）',
    近期活动: '',
  },
  {
    名称: '断链',
    类型: '小型',
    领袖: '链头阿断',
    人数: '约20～40人',
    背景: '专门袭击伊甸园外出小队、劫持补给或解救劳工的小股武装，行踪不定，与残军、商盟有接触但不从属。',
    地点: '北郊与东郊交界、伊甸园外围要道附近',
    近期活动: '',
  },
  {
    名称: '末世古惑仔',
    类型: '小型',
    领袖: '坐馆崩牙雄（陈志雄）',
    人数: '约40～60人',
    背景: '主城西岸街头帮派，讲字头论辈分守地盘，收保护费、替黑市跑腿、偶有劫掠。不惹大势力，专吃西岸边缘与拾荒者油水。',
    地点: '主城西岸老城街巷与地下车库',
    近期活动: '',
  },
  {
    名称: '拾荒者聚落',
    类型: '小型',
    领袖: '无总舵主，各帮有话事人',
    人数: '多股小团体，流动性大',
    背景: '西郊与主城废墟边缘搜刮废墟、倒卖零碎物资，与黑市、商盟有松散联系，常为商盟或残军做向导。',
    地点: '西郊棚户、主城西岸废墟边缘、地铁入口等',
    近期活动: '',
  },
  {
    名称: '西岸黑市',
    类型: '中型',
    领袖: '大中间人共治（疤叔、阿凤、老拐等）',
    人数: '交易网络，无固定总部',
    背景: '西岸老城地下与废墟中的交易网络，情报、药品、武器、违禁品、人口均可经中间人交易。',
    地点: '主城西岸地下停车场、防空洞、废弃商场地下室',
    近期活动: '',
  },
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
  const byName: Record<
    string,
    { 名称: string; 类型: FactionType; 领袖: string; 人数: string; 背景: string; 地点: string; 近期活动: string }
  > = {};
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

/** 世界信息子选项卡：小道消息 / 附近消息 / 任务列表 */
const activeWorldSubtab = ref<'gossip' | 'intel' | 'tasks'>('gossip');

/** 附近消息列表（世界.附近信息）：每条 标题+内容，附近暴动、公开事件、人员死亡/处理/结盟等 */
const nearbyList = computed(() => {
  const raw = store.data.世界?.附近信息 ?? [];
  return (raw as Array<{ 标题?: string; 内容?: string } | string>).map(item =>
    typeof item === 'string'
      ? { 标题: '', 内容: item }
      : { 标题: item.标题 ?? '', 内容: item.内容 ?? '' },
  );
});

/** 小道消息列表，兼容旧数据（string 视为仅 内容） */
const gossipList = computed(() => {
  const raw = store.data.世界?.小道消息 ?? [];
  return (raw as Array<{ 标题?: string; 来源?: string; 内容?: string } | string>).map(item =>
    typeof item === 'string'
      ? { 标题: '', 来源: '', 内容: item }
      : { 标题: item.标题 ?? '', 来源: item.来源 ?? '', 内容: item.内容 ?? '' },
  );
});

/** 任务列表（世界.任务列表）：卡片展示 任务名称、委托人、内容、完成奖励、进度、完成情况 */
const taskList = computed(() => {
  const raw = store.data.世界?.任务列表 ?? [];
  return (raw as Array<Record<string, unknown>>).map(item => ({
    标题: String(item?.标题 ?? ''),
    委托人: String(item?.委托人 ?? ''),
    描述: String(item?.描述 ?? ''),
    完成奖励: String(item?.完成奖励 ?? ''),
    进度: String(item?.进度 ?? ''),
    状态: String(item?.状态 ?? ''),
  }));
});

const bottomTabs = [
  { key: 'important' },
  { key: 'chen', label: '陈莹姬' },
  { key: 'npcs', label: '重要人物' },
  { key: 'team', label: '队伍' },
  { key: 'gear', label: '装备与道具' },
  { key: 'world', label: '世界信息' },
  { key: 'secret', label: '绝密档案' },
];

/** 陈莹姬是否在主角.队友中（入队）；用于队伍栏列表与离队时自动切回黄晓林 */
const 陈莹姬已入队 = computed(() => {
  const raw = store.data.主角?.队友;
  const arr = Array.isArray(raw) ? (raw as string[]) : [];
  return arr.includes('陈莹姬');
});
/** 陈莹姬选项卡始终显示；装备与道具仅供黄晓林使用，在陈莹姬选项卡下不显示该入口 */
const visibleBottomTabs = computed(() =>
  bottomTabs.filter(tab => {
    if (tab.key === 'gear' && isShowingChen.value) return false;
    return true;
  }),
);

/** 仅当陈莹姬从「已入队」变为「离队」且当前在陈莹姬选项卡时，自动切回黄晓林；避免用户点击陈莹姬选项卡时被误判为离队而跳回黄晓林 */
watch(
  () => 陈莹姬已入队.value,
  (入队, prev入队) => {
    if (prev入队 === true && 入队 === false && activeBottomTab.value === 'chen') {
      activeBottomTab.value = 'important';
    }
  },
);

function getTabLabel(tab: { key: string; label?: string }) {
  if (tab.key === 'important') return '黄晓林';
  return tab.label ?? '';
}
function setActiveBottomTab(tab: { key: string }) {
  activeBottomTab.value = tab.key;
  if (tab.key !== 'team') expandedTeamMemberId.value = null;
  if (tab.key !== 'npcs') expandedNpcIndex.value = null;
}
</script>
