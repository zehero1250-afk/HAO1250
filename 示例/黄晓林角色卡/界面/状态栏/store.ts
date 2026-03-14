import { defineMvuDataStore } from '@util/mvu';
import { Schema } from '../../schema';

/** 使用最新楼层变量，保证「成为队友」等剧情更新后队友选项卡能立即显示；状态栏各楼层均显示，读写一致用 latest */
export const useDataStore = defineMvuDataStore(Schema, {
  type: 'message',
  message_id: 'latest',
});
