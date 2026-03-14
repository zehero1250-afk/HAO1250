import _ from 'lodash';

const 六维键 = z.enum(['力量', '敏捷', '体质', '智力', '感知', '魅力']);
const 能力值Schema = z.record(六维键, z.coerce.number().transform(v => _.clamp(v, 1, 30)));

export const Schema = z.object({
  /** 主角：性转勇者艾丽丝，DnD 跑团用六维/等级/HP/熟练加值等 */
  主角: z
    .object({
      能力值: 能力值Schema.prefault({
        力量: 14,
        敏捷: 16,
        体质: 14,
        智力: 10,
        感知: 12,
        魅力: 8,
      }),
      经验值: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
      等级: z.coerce.number().transform(v => _.clamp(v, 1, 20)).prefault(1),
      当前HP: z.coerce.number().transform(v => Math.max(0, v)).prefault(12),
      最大HP: z.coerce.number().transform(v => Math.max(1, v)).prefault(12),
      熟练加值: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
      状态效果: z.array(z.string()).prefault([]),
      最近检定: z
        .object({
          类型: z.string(),
          结果: z.string(),
          是否成功: z.boolean(),
        })
        .prefault({ 类型: '', 结果: '', 是否成功: false }),
    })
    .prefault({}),
});
export type Schema = z.output<typeof Schema>;
