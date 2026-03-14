import { StoreDefinition } from 'pinia';

export function defineMvuDataStore<T extends z.ZodObject>(
  schema: T,
  variable_option: VariableOption,
  additional_setup?: (data: Ref<z.infer<T>>) => void,
): StoreDefinition<`mvu_data.${string}`, { data: Ref<z.infer<T>> }> {
  if (
    variable_option.type === 'message' &&
    (variable_option.message_id === undefined || variable_option.message_id === 'latest')
  ) {
    variable_option.message_id = -1;
  }

  return defineStore(
    `mvu_data.${_(variable_option)
      .entries()
      .sortBy(entry => entry[0])
      .map(entry => entry[1])
      .join('.')}`,
    errorCatched(() => {
      const data = ref(
        schema.parse(_.get(getVariables(variable_option), 'stat_data', {}), { reportInput: true }),
      ) as Ref<z.infer<T>>;
      if (additional_setup) {
        additional_setup(data);
      }

      useIntervalFn(() => {
        const stat_data = _.get(getVariables(variable_option), 'stat_data', {});
        const result = schema.safeParse(stat_data);
        if (result.error) {
          return;
        }
        if (!_.isEqual(data.value, result.data)) {
          ignoreUpdates(() => {
            data.value = result.data;
          });
          if (!_.isEqual(stat_data, result.data)) {
            const dataToWrite = applyStatDataToWrite(result.data);
            updateVariablesWith(variables => _.set(variables, 'stat_data', dataToWrite), variable_option);
          }
        }
      }, 2000);

      /** 写回前保留变量中已有的 主角.队友，避免 schema 默认 [] 覆盖剧情写入的队友名单 */
      function applyStatDataToWrite(toWrite: z.infer<T>): z.infer<T> {
        const current = _.get(getVariables(variable_option), 'stat_data', {}) as Record<string, unknown>;
        const current队友 = (current?.主角 as Record<string, unknown> | undefined)?.队友;
        if (!Array.isArray(current队友) || current队友.length === 0) return toWrite;
        const write主角 = (toWrite as Record<string, unknown>)?.主角 as Record<string, unknown> | undefined;
        const write队友 = write主角?.队友;
        if (Array.isArray(write队友) && write队友.length > 0) return toWrite;
        return _.set(_.cloneDeep(toWrite), '主角.队友', current队友) as z.infer<T>;
      }

      const { ignoreUpdates } = watchIgnorable(
        data,
        new_data => {
          const result = schema.safeParse(new_data);
          if (result.error) {
            return;
          }
          if (!_.isEqual(new_data, result.data)) {
            ignoreUpdates(() => {
              data.value = result.data;
            });
          }
          console.info('[MVU] 写回变量', variable_option.type, variable_option.type === 'message' ? `message_id:${variable_option.message_id}` : '');
          const dataToWrite = applyStatDataToWrite(result.data);
          updateVariablesWith(variables => _.set(variables, 'stat_data', dataToWrite), variable_option);
        },
        { deep: true },
      );

      return { data };
    }),
  );
}
