const Percent = z.coerce.number().transform((value) => _.clamp(value, 0, 100));
const NonNegative = z.coerce.number().transform((value) => Math.max(0, value));
const Positive = z.coerce.number().transform((value) => Math.max(1, value));
const ThreatSchema = z.preprocess((value) => {
  if (value === '\u4F4E') return 'I';
  if (value === '\u4E2D') return 'II';
  if (value === '\u9AD8') return 'III';
  return value;
}, z.enum(['I', 'II', 'III', 'IV', 'V', 'VI']));

const EncounterOptionSchema = z.object({
  label: z.string().default('观察情况'),
  risk: z.enum(['低', '中', '高']).default('低'),
});

const QuestSchema = z.object({
  id: z.string().default('none'),
  title: z.string().default('暂无任务'),
  stage: z.string().default('待命'),
  target: z.string().default('无'),
  progress: z.string().default('未开始'),
  reward: z.string().default('无'),
});

const EnemySchema = z.object({
  name: z.string().default('无'),
  category: z.string().default('无'),
  threat: ThreatSchema.default('I'),
  level: Positive.default(1),
  hp: NonNegative.default(0),
  maxHp: Positive.default(1),
  intent: z.string().default('观望'),
  expReward: NonNegative.default(0),
  elite: z.boolean().default(false),
  bountyBoss: z.boolean().default(false),
});

const BaseStatsSchema = z.object({
  maxHp: Positive.default(100),
  atk: Positive.default(12),
  def: Positive.default(8),
  speed: Positive.default(10),
  crit: Percent.default(5),
});

const EquipmentBonusSchema = z.object({
  maxHp: NonNegative.default(0),
  atk: NonNegative.default(0),
  def: NonNegative.default(0),
  speed: NonNegative.default(0),
  crit: NonNegative.default(0),
  notes: z.array(z.string()).default([]),
});

const EffectSchema = z.object({
  name: z.string().default('无'),
  description: z.string().default('无'),
});

const GearDetailSchema = z.object({
  name: z.string().default('无'),
  slot: z.string().default('无'),
  grade: z.string().default('普通'),
  summary: z.string().default('无'),
  flavor: z.string().default('无'),
  maxHp: NonNegative.default(0),
  atk: NonNegative.default(0),
  def: NonNegative.default(0),
  speed: NonNegative.default(0),
  crit: NonNegative.default(0),
  effects: z.array(EffectSchema).default([]),
});

const SupplyDetailSchema = z.object({
  name: z.string().default('无'),
  category: z.string().default('材料'),
  summary: z.string().default('无'),
  flavor: z.string().default('无'),
  effects: z.array(EffectSchema).default([]),
});

export const Schema = z.object({
  version: z.string().default('arpg-0.2'),
  progression: z
    .object({
      levelCap: Positive.default(60),
      expGrowthRate: z.coerce.number().transform((value) => _.clamp(value, 1.05, 2)).default(1.2),
      baseExpToNext: Positive.default(100),
    })
    .default({
      levelCap: 60,
      expGrowthRate: 1.2,
      baseExpToNext: 100,
    }),
  world: z
    .object({
      day: Positive.default(1),
      time: z.string().default('清晨'),
      weather: z.string().default('阴'),
      location: z.string().default('废船村'),
      danger: Percent.default(15),
      noise: Percent.default(0),
      exploration: z.enum(['安全区', '探索中', '遭遇中', '战斗中', '结算中']).default('安全区'),
    })
    .default({
      day: 1,
      time: '清晨',
      weather: '阴',
      location: '废船村',
      danger: 15,
      noise: 0,
      exploration: '安全区',
    }),
  player: z
    .object({
      name: z.string().default('陈春璃'),
      profession: z.string().default('村民'),
      level: Positive.default(1),
      exp: NonNegative.default(0),
      expToNext: Positive.default(100),
      baseStats: BaseStatsSchema.default({
        maxHp: 100,
        atk: 12,
        def: 8,
        speed: 10,
        crit: 5,
      }),
      hp: NonNegative.default(100),
      maxHp: Positive.default(100),
      stamina: Percent.default(100),
      hunger: Percent.default(8),
      thirst: Percent.default(10),
      radiation: Percent.default(0),
      injury: Percent.default(0),
      atk: Positive.default(12),
      def: Positive.default(8),
      speed: Positive.default(10),
      crit: Percent.default(5),
      gold: NonNegative.default(120),
      ammo: NonNegative.default(24),
      medkit: NonNegative.default(2),
      scrap: NonNegative.default(6),
    })
    .default({
      name: '陈春璃',
      profession: '村民',
      level: 1,
      exp: 0,
      expToNext: 100,
      baseStats: {
        maxHp: 100,
        atk: 12,
        def: 8,
        speed: 10,
        crit: 5,
      },
      hp: 100,
      maxHp: 100,
      stamina: 100,
      hunger: 8,
      thirst: 10,
      radiation: 0,
      injury: 0,
      atk: 12,
      def: 8,
      speed: 10,
      crit: 5,
      gold: 120,
      ammo: 24,
      medkit: 2,
      scrap: 6,
    }),
  equipment: z
    .object({
      mainWeapon: z.string().default('锈迹手枪'),
      subWeapon: z.string().default('应急短刀'),
      head: z.string().default('破布头巾'),
      chest: z.string().default('废铁拼接护甲'),
      hands: z.string().default('磨损手套'),
      legs: z.string().default('旧工装裤'),
      accessory1: z.string().default('旧世界指南针'),
      accessory2: z.string().default('空'),
    })
    .default({
      mainWeapon: '锈迹手枪',
      subWeapon: '应急短刀',
      head: '破布头巾',
      chest: '废铁拼接护甲',
      hands: '磨损手套',
      legs: '旧工装裤',
      accessory1: '旧世界指南针',
      accessory2: '空',
    }),
  equipmentMeta: z
    .object({
      mainWeapon: GearDetailSchema.default({}),
      subWeapon: GearDetailSchema.default({}),
      head: GearDetailSchema.default({}),
      chest: GearDetailSchema.default({}),
      hands: GearDetailSchema.default({}),
      legs: GearDetailSchema.default({}),
      accessory1: GearDetailSchema.default({}),
      accessory2: GearDetailSchema.default({}),
    })
    .default({
      mainWeapon: {},
      subWeapon: {},
      head: {},
      chest: {},
      hands: {},
      legs: {},
      accessory1: {},
      accessory2: {},
    }),
  equipmentBonus: EquipmentBonusSchema.default({
    maxHp: 0,
    atk: 0,
    def: 0,
    speed: 0,
    crit: 0,
    notes: [],
  }),
  supplyMeta: z
    .object({
      ammo: SupplyDetailSchema.default({}),
      medkit: SupplyDetailSchema.default({}),
      scrap: SupplyDetailSchema.default({}),
      gold: SupplyDetailSchema.default({}),
    })
    .default({
      ammo: {},
      medkit: {},
      scrap: {},
      gold: {},
    }),
  combat: z
    .object({
      inBattle: z.boolean().default(false),
      round: Positive.default(1),
      enemy: EnemySchema.default({
        name: '无',
        category: '无',
        threat: 'I',
        level: 1,
        hp: 0,
        maxHp: 1,
        intent: '观望',
        expReward: 0,
        elite: false,
        bountyBoss: false,
      }),
      lastCheck: z.string().default('尚未进行判定'),
      lastAction: z.string().default('待命'),
      options: z.array(EncounterOptionSchema).default([
        { label: '观察情况', risk: '低' },
        { label: '谨慎接近', risk: '中' },
        { label: '主动交战', risk: '高' },
      ]),
    })
    .default({
      inBattle: false,
      round: 1,
      enemy: {
        name: '无',
        category: '无',
        threat: 'I',
        level: 1,
        hp: 0,
        maxHp: 1,
        intent: '观望',
        expReward: 0,
        elite: false,
        bountyBoss: false,
      },
      lastCheck: '尚未进行判定',
      lastAction: '待命',
      options: [
        { label: '观察情况', risk: '低' },
        { label: '谨慎接近', risk: '中' },
        { label: '主动交战', risk: '高' },
      ],
    }),
  quest: QuestSchema.default({
    id: 'quest-001',
    title: '废船村外围清剿',
    stage: '可接取',
    target: '清理村外1处低威胁怪物点',
    progress: '0/1',
    reward: '80g，子弹x12，废料x4',
  }),
  status: z
    .object({
      effects: z.array(z.string()).default([]),
      reputationShipVillage: z.coerce.number().transform((value) => _.clamp(value, -100, 100)).default(5),
      wantedLevel: z.coerce.number().transform((value) => _.clamp(value, 0, 5)).default(0),
      campDanger: Percent.default(10),
    })
    .default({
      effects: [],
      reputationShipVillage: 5,
      wantedLevel: 0,
      campDanger: 10,
    }),
  log: z
    .object({
      summary: z.string().default('你是废船村的普通村民，局势恶化后被迫卷入外圈清剿与求生行动。'),
      lootHint: z.string().default('暂无掉落。'),
    })
    .default({
      summary: '你是废船村的普通村民，局势恶化后被迫卷入外圈清剿与求生行动。',
      lootHint: '暂无掉落。',
    }),
});

export type Schema = z.output<typeof Schema>;
