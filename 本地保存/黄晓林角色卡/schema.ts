const 六维键 = z.enum(['力量', '敏捷', '体质', '智力', '感知', '魅力']);
const 品级键 = z.enum(['普通', '精品', '稀有', '神器', '史诗', '传说']);
const 能力值Schema = z.record(六维键, z.coerce.number().transform(v => _.clamp(v, 1, 30)));

/** 陈莹姬 / 队伍成员 共用结构，二者数据独立、均可由变量更新 */
const 陈莹姬结构Schema = z
    .object({
        /** 种族：改造体（雌雄同体，教授改造） */
        种族: z.string().prefault('改造体'),
        /** 职业（状态栏队伍卡展示用，可选） */
        职业: z.string().optional(),
        等级: z.coerce.number().transform(v => _.clamp(v, 1, 60)).prefault(30),
        经验值: z.coerce.number().transform(v => Math.max(0, v)).prefault(50 * 29 * 30),
        当前HP: z.coerce.number().transform(v => Math.max(0, v)).prefault(130),
        最大HP: z.coerce.number().transform(v => Math.max(1, v)).prefault(130),
        能力值: 能力值Schema.prefault({
            力量: 14,
            敏捷: 14,
            体质: 12,
            智力: 12,
            感知: 13,
            魅力: 16,
        }),
        威慑值: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(85),
        服从度: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(90),
        理智: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(45),
        当前状态: z.string().prefault('巡视'),
        兴奋度: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
        对主角态度: z.string().prefault('蔑视'),
        好感度: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(25),
        最近检定: z
            .object({
                类型: z.string(),
                结果: z.string(),
                是否成功: z.boolean(),
            })
            .prefault({ 类型: '', 结果: '', 是否成功: false }),
        外貌与服装: z.string().prefault(''),
        内心想法: z.string().prefault(''),
        已装备: z.record(z.string(), z.string()).prefault({}),
        武器: z
            .object({
                名称: z.string(),
                加成: z.string().optional(),
                品级: z.string().optional(),
                装备部位: z.string().optional(),
                基础攻击: z.string().optional(),
                伤害骰: z.string().optional(),
                效果: z.array(z.object({ 名称: z.string(), 描述: z.string() })).optional(),
                描述: z.string().optional(),
            })
            .prefault({
                名称: '寂静M4A1消音步枪',
                加成: '力量+3 感知+3',
                品级: '史诗',
                装备部位: '主手',
                基础攻击: '17-24',
                伤害骰: '3D8',
                效果: [
                    { 名称: '精准赋能', 描述: '精准射击时伤害加成。' },
                    { 名称: '暗影匿踪', 描述: '潜行时降低被察觉概率。' },
                    { 名称: '致命锁定', 描述: '连续命中后目标受到额外伤害。' },
                ],
                描述: '潜行杀器,寂静 M4A1弹无虚发。',
            }),
        躯干: z
            .object({
                名称: z.string(),
                加成: z.string().optional(),
                品级: z.string().optional(),
                装备部位: z.string().optional(),
                基础防御: z.string().optional(),
                效果: z.array(z.object({ 名称: z.string(), 描述: z.string() })).optional(),
                描述: z.string().optional(),
            })
            .prefault({
                名称: '性感COS警察制服',
                加成: '魅力+5',
                品级: '神器',
                装备部位: '躯干',
                基础防御: '12',
                效果: [
                    { 名称: '执法威仪', 描述: '执法时威慑力提升。' },
                    { 名称: '正义庇护', 描述: '以魅惑与威严守护秩序。' },
                ],
                描述: '霓虹假面,以魅惑与威严守护都市秩序。',
            }),
        护甲: z
            .object({
                名称: z.string(),
                加成: z.string().optional(),
                品级: z.string().optional(),
                装备部位: z.string().optional(),
                基础防御: z.string().optional(),
                效果: z.array(z.object({ 名称: z.string(), 描述: z.string() })).optional(),
                描述: z.string().optional(),
            })
            .optional(),
        技能: z.string().prefault('爆头一击'),
        奥义: z.string().prefault('枪花乱舞'),
        物品栏: z
            .record(z.string(), z.object({
                描述: z.string(),
                数量: z.coerce.number(),
                品级: 品级键.optional(),
            }))
            .transform(data => _.pickBy(data, ({ 数量 }) => 数量 > 0))
            .prefault({}),
    })
    .prefault({});

export const Schema = z.object({
    世界: z
        .object({
        当前时间: z.string().prefault(''),
        当前地点: z.string().prefault(''),
        entrance: z
            .object({
            海报诱惑: z.string().prefault(''),
        })
            .prefault({}),
        status_in_Eden: z
            .object({
            编号: z.coerce.number().prefault(9527),
            分配: z.string().prefault('A厂区维修组'),
            幻灭: z.string().prefault(''),
        })
            .prefault({}),
        /** 世界环境：势力信息（S市四势力等，状态栏「世界信息」选项卡用）、附近信息、小道消息、任务列表 */
        势力信息: z
            .array(
                z.object({
                    名称: z.string(),
                    领袖: z.string().prefault(''),
                    人数: z.string().prefault(''),
                    背景: z.string().prefault(''),
                    地点: z.string().prefault(''),
                    近期活动: z.string().prefault(''),
                }),
            )
            .prefault([]),
        附近信息: z.array(z.string()).prefault([]),
        /** 小道消息：状态栏「世界信息」-「小道消息」选项卡用，每条含 标题、来源、内容 */
        小道消息: z
            .array(
                z.object({
                    标题: z.string().prefault(''),
                    来源: z.string().prefault(''),
                    内容: z.string().prefault(''),
                }),
            )
            .prefault([]),
        任务列表: z
            .array(z.object({ 标题: z.string(), 描述: z.string(), 状态: z.string().optional() }))
            .prefault([]),
    })
        .prefault({}),
    主角: z
        .object({
        /** 种族，如 人类、变异体、改造体 */
        种族: z.string().prefault('人类'),
        /** DnD 六维属性 (1–30)，用于检定修正：属性修正 = Math.floor((能力值 - 10) / 2) */
        能力值: 能力值Schema.prefault({
            力量: 10,
            敏捷: 10,
            体质: 10,
            智力: 10,
            感知: 10,
            魅力: 10,
        }),
        /** 经验值，击败敌人/丧尸/变异种等获得，用于升级 */
        经验值: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
        /** 等级 1–60，经验值达标后提升，影响最大HP与熟练加值等 */
        等级: z.coerce.number().transform(v => _.clamp(v, 1, 60)).prefault(1),
        当前HP: z.coerce.number().transform(v => Math.max(0, v)).prefault(10),
        最大HP: z.coerce.number().transform(v => Math.max(1, v)).prefault(10),
        /** 体力 0–100，劳作、受伤会降低 */
        体力: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(100),
        /** 理智 0–100，幻灭、恐惧、压迫会降低 */
        理智: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(70),
        /** 熟练加值，用于技能检定 */
        熟练加值: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
        /** 状态效果，如 "轻伤" "疲惫" "鞭痕" */
        状态效果: z.array(z.string()).prefault([]),
        /** 货币（废土券），幸存者通用，≥0；伊甸园内不流通，进园时通常被没收 */
        货币: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
        /** 最近一次检定记录，便于剧情连贯 */
        最近检定: z
            .object({
            类型: z.string(),
            结果: z.string(),
            是否成功: z.boolean(),
        })
            .prefault({ 类型: '', 结果: '', 是否成功: false }),
        物品栏: z
            .record(z.string().describe('物品名'), z.object({
            描述: z.string(),
            数量: z.coerce.number(),
            品级: 品级键.optional(),
            /** 道具分类：消耗品(药品/食物/投掷)、材料(打造/合成/升级)、杂物(垃圾/任务杂物)、任务重要(剧情关键/不可丢弃)；仅道具栏展示分组用 */
            分类: z.enum(['消耗品', '材料', '杂物', '任务重要']).optional(),
            /** 核心功能/效果（须为可执行机制，如「使用：一个动作。恢复 X 点 HP。消耗 1 件」），禁止模糊表述 */
            功能描述: z.string().optional(),
            /** 使用与限制（须为可执行机制，如「使用：一个动作。消耗后数量-1」），禁止「适当时机」「使用场景」等模糊描述 */
            使用与限制: z.string().optional(),
            /** 装备类物品：可装备到的身体栏位，与已装备键一致（Head/Neck/Body/Back/Waist/Wrists/Hands/Feet/Trinket1/Trinket2/MainHand/OffHand） */
            可装备部位: z.string().optional(),
            /** 伤害骰，如 "1d8"、"2d6"，状态栏弹窗展示用 */
            伤害骰: z.string().optional(),
            /** 攻击力或固定伤害，与 DnD/战斗规则衔接，状态栏弹窗展示用 */
            攻击力: z.coerce.number().optional(),
            固定伤害: z.coerce.number().optional(),
            /** 防御/AC 加成或减伤数值，状态栏弹窗展示用 */
            防御: z.coerce.number().optional(),
            /** 装备属性加成说明（弹窗单独分区展示），与「装备与物品生成规则」衔接 */
            属性说明: z.string().optional(),
            /** 装备词条列表（弹窗单独分区展示），与「装备与物品生成规则」衔接 */
            词条: z.array(z.string()).optional(),
        }))
            .transform(data => _.pickBy(data, ({ 数量 }) => 数量 > 0))
            .prefault({}),
        /** 已装备：栏位标识 → 物品名（与物品栏键对应），见「装备栏位规则」 */
        已装备: z
            .record(z.string().describe('栏位标识'), z.string().describe('物品名'))
            .prefault({}),
        /** 与未单独建表的 NPC 的好感度，键为 NPC 标识，值为 0～100；见「NPC好感度规则」 */
        NPC好感度: z
            .record(z.string().describe('NPC标识'), z.coerce.number().transform(v => _.clamp(v, 0, 100)))
            .prefault({}),
        /** RP 点：每升 1 级获得 2 点；在特质商店购买正面特质消耗 8/12 点；见「特质商店」 */
        RP点: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
        /** 特质商店累计抽奖次数，达到保底（100 次）发放奖励后重置为 0；见「特质商店」 */
        抽奖次数: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
        /** 本期奖池展示：红色容器内随机展示 4 件物品（神器～传说），仅展示用，抽奖从该池随机获得 */
        本期奖池: z
            .array(z.object({
            名称: z.string(),
            类型: z.enum(['装备', '道具']),
            品级: 品级键.optional(),
            描述: z.string().optional(),
            装备子类型: z.enum(['武器', '防具', '饰物']).optional(),
            /** 可装备部位（MainHand/OffHand/Body/Head/Feet 等），来自世界书部位，打包与展示用 */
            可装备部位: z.string().optional(),
            /** 世界书词条，打包时写入物品栏供详情弹窗「效果」展示 */
            词条: z.array(z.string()).optional(),
            伤害骰: z.string().optional(),
            攻击力: z.coerce.number().optional(),
            固定伤害: z.coerce.number().optional(),
            防御: z.coerce.number().optional(),
            }))
            .max(4)
            .prefault([]),
        /** 抽奖奖池：单次/十连抽到的装备或道具暂存于此，点击「打包带走」后转入物品栏；抽奖不再产出特质 */
        奖池: z
            .array(z.object({
            名称: z.string(),
            类型: z.enum(['装备', '道具']),
            品级: 品级键.optional(),
            描述: z.string().optional(),
            /** 装备子类型，仅前端抽奖用：打包时据此决定可装备部位与名称描述一致 */
            装备子类型: z.enum(['武器', '防具', '饰物']).optional(),
            /** 可装备部位（来自世界书装备部位），打包时写入物品栏 */
            可装备部位: z.string().optional(),
            /** 世界书词条/数值，打包时写入物品栏供详情弹窗展示 */
            词条: z.array(z.string()).optional(),
            伤害骰: z.string().optional(),
            攻击力: z.coerce.number().optional(),
            固定伤害: z.coerce.number().optional(),
            防御: z.coerce.number().optional(),
        }))
            .prefault([]),
        /** 个人想法（状态栏展示用，随剧情可更新） */
        个人想法: z.string().prefault(''),
        /** 队友名单：成为队友的 NPC 标识列表，状态栏「队伍」选项卡仅当此列表非空时展示 */
        队友: z.array(z.string()).prefault([]),
        /** 已掌握技能（状态栏技能槽展示与快速释放用） */
        技能: z.array(z.string()).max(4).prefault(['初级维修']),
        /** 已拥有的特质（在 RP 商店购买，最多 8 样），状态栏「特质栏」展示 */
        特质: z.array(z.string()).max(8).prefault([]),
    })
        .transform(data => ({
            ...data,
            /** 物品栏数量为 0 的已移除，已装备中指向不存在或数量为 0 的条目须清理 */
            已装备: _.pickBy(data.已装备 ?? {}, name => (data.物品栏 && data.物品栏[name]) != null),
        }))
        .prefault({}),
    /** A厂区「处刑姬」/ 女武神，教授的专属性奴隶与改造体 */
    陈莹姬: 陈莹姬结构Schema.prefault({}),
    /** 队伍栏中的陈莹姬卡片专用数据，与主卡陈莹姬互不共用，可由脚本/变量单独更新（向后兼容，新数据请用 队伍[id]） */
    队伍陈莹姬: 陈莹姬结构Schema.prefault({}),
    /** 队伍成员数据：key 为 主角.队友 中的 NPC 标识，value 为与陈莹姬结构同构的数据，随队友自动更新 */
    队伍: z.record(z.string(), 陈莹姬结构Schema).prefault({}),
    /** 新队友默认模板：入队时种族等沿用此处；职业随机，武器/躯干按等级→品级与职业自动生成 */
    新队友默认: 陈莹姬结构Schema.prefault({}),
    /** B厂区「屠妇」，变异体执刀人，护士服+巨型杀猪刀 */
    屠妇: z
        .object({
        /** 种族：变异体（执念突变+改造） */
        种族: z.string().prefault('变异体'),
        /** 六维 (1–30)，瘦弱身形却力气惊人、刀法精准、智商高、冷血 */
        能力值: 能力值Schema.prefault({
            力量: 18,
            敏捷: 16,
            体质: 14,
            智力: 14,
            感知: 15,
            魅力: 6,
        }),
        /** 等级 1–60，与主角/陈莹姬等 NPC 同一套等级体系 */
        等级: z.coerce.number().transform(v => _.clamp(v, 1, 60)).prefault(25),
        当前HP: z.coerce.number().transform(v => Math.max(0, v)).prefault(220),
        最大HP: z.coerce.number().transform(v => Math.max(1, v)).prefault(220),
        最近检定: z
            .object({
            类型: z.string(),
            结果: z.string(),
            是否成功: z.boolean(),
        })
            .prefault({ 类型: '', 结果: '', 是否成功: false }),
        /** 对主角的好感度 0～100，见「NPC好感度规则」 */
        好感度: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(40),
        /** 内心想法（附近的人面板展示用） */
        内心想法: z.string().prefault(''),
        /** 角色简单描写（附近的人展开详情用） */
        简述: z.string().prefault(''),
    })
        .prefault({}),
    /** 伊甸园最高统治者，李维，陈莹姬的创造者，人类 */
    教授: z
        .object({
        /** 种族：人类（未感染/未变异，病毒研究者） */
        种族: z.string().prefault('人类'),
        能力值: 能力值Schema.prefault({
            力量: 10,
            敏捷: 10,
            体质: 10,
            智力: 20,
            感知: 16,
            魅力: 18,
        }),
        等级: z.coerce.number().transform(v => _.clamp(v, 1, 60)).prefault(33),
        当前HP: z.coerce.number().transform(v => Math.max(0, v)).prefault(198),
        最大HP: z.coerce.number().transform(v => Math.max(1, v)).prefault(198),
        最近检定: z
            .object({
            类型: z.string(),
            结果: z.string(),
            是否成功: z.boolean(),
        })
            .prefault({ 类型: '', 结果: '', 是否成功: false }),
        /** 对主角的好感度 0～100，见「NPC好感度规则」 */
        好感度: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(40),
        /** 内心想法（附近的人面板展示用） */
        内心想法: z.string().prefault(''),
        /** 角色简单描写（附近的人展开详情用） */
        简述: z.string().prefault(''),
    })
        .prefault({}),
});
