import { waitUntil } from 'async-wait-until';
import App from './App.vue';
import './global.css';

/** 判断当前状态栏是否位于「最新楼层」；仅最新楼层显示，其余隐藏 */
function isLatestMessage(): boolean {
    try {
        const frame = window.frameElement;
        if (!frame) return true;
        const parentDoc = window.parent?.document;
        if (!parentDoc) return true;
        const $ = (window.parent as Window & { jQuery?: typeof import('jquery') }).jQuery ?? (window.parent as Window & { $?: typeof import('jquery') }).$;
        if (typeof $ !== 'function') return true;
        const $mes = $(frame, parentDoc).closest('.mes');
        if (!$mes.length) return true;
        const myId = $mes.attr('mesid');
        const $chat = $(parentDoc).find('#chat');
        if (!$chat.length) return true;
        const lastId = $chat.find('.mes').last().attr('mesid');
        return myId === lastId;
    } catch {
        return true;
    }
}

function applyLatestOnlyVisibility(): void {
    if (isLatestMessage()) {
        document.body.style.removeProperty('display');
    } else {
        document.body.style.display = 'none';
    }
}

$(async () => {
    await waitGlobalInitialized('Mvu');
    await waitUntil(() => _.has(getVariables({ type: 'message' }), 'stat_data'));
    createApp(App).use(createPinia()).mount('#app');

    // 仅最新楼层显示状态栏：初始判断 + 监听 #chat 变化
    applyLatestOnlyVisibility();
    try {
        const parentDoc = window.parent?.document;
        const frame = window.frameElement;
        if (parentDoc && frame) {
            const $ = (window.parent as Window & { jQuery?: typeof import('jquery') }).jQuery ?? (window.parent as Window & { $?: typeof import('jquery') }).$;
            if (typeof $ === 'function') {
                const $chat = $(parentDoc).find('#chat');
                if ($chat.length) {
                    const obs = new MutationObserver(() => applyLatestOnlyVisibility());
                    obs.observe($chat[0], { childList: true, subtree: true });
                }
            }
        }
    } catch {
        // 跨域或无法访问父文档时忽略
    }
});
