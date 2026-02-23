import { $ } from './utils.js';
import { store } from './store/index.js';
import { processChatAction } from './services/AIService.js';

export const chatHistory = [];

export function _appendChatMsg(text, role) {
    const container = $('#chat-messages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = `chat-msg msg-${role}`;
    div.innerHTML = `<span class="msg-bubble">${text}</span>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
}

export async function _sendChatMessage() {
    const input = $('#chat-input');
    const userText = input.value.trim();
    if (!userText) return;
    input.value = '';

    _appendChatMsg(userText, 'user');
    const typingNode = _appendChatMsg('Thinking...', 'ai msg-typing');

    let scheduleContext = '';
    const state = store.getState();
    if (state.itinerary && state.itinerary.length) {
        scheduleContext = JSON.stringify(state.itinerary);
    }

    chatHistory.push({ role: 'user', text: userText });
    const { job, food, memory } = state.userProfile;

    try {
        const result = await processChatAction(chatHistory, scheduleContext, job, food, memory);

        chatHistory.push({ role: 'model', text: result.rawText || result.text });
        typingNode.remove();

        if (result.type === 'json') {
            const parsed = result.data;
            if (parsed.type === 'schedule_update' && parsed.schedule) {
                _appendChatMsg(parsed.message || 'Schedule updated!', 'ai');

                const saved = JSON.parse(localStorage.getItem('wftd_today_schedule') || '{}');
                saved.itinerary = parsed.schedule;
                localStorage.setItem('wftd_today_schedule', JSON.stringify(saved));

                store.setState({ itinerary: parsed.schedule });

                window.dispatchEvent(new CustomEvent('wftd-mount-surface', {
                    detail: { payload: state.payload || {}, itinerary: parsed.schedule, insights: state.insights || [] }
                }));
                return;
            }
            if (parsed.type === 'memory_update' && parsed.new_fact) {
                _appendChatMsg(parsed.message || 'Got it. I will remember this for next time!', 'ai');

                const existingMem = state.userProfile.memory || '';
                const newMem = existingMem ? existingMem + '\n- ' + parsed.new_fact : '- ' + parsed.new_fact;

                store.setProfile({ memory: newMem });

                const profileMemNode = document.getElementById('profile-memory');
                if (profileMemNode) profileMemNode.value = newMem;
                return;
            }
        }

        _appendChatMsg(result.text, 'ai');
    } catch (err) {
        console.error(err);
        typingNode.remove();
        _appendChatMsg('Error reaching AI.', 'ai');
        chatHistory.pop();
    }
}

export function _initChat() {
    const panel = $('#chat-panel'), toggleBtn = $('#chat-toggle-btn'), header = $('.chat-header'), floatBtn = $('#chat-float-btn'), sendBtn = $('#chat-send-btn'), input = $('#chat-input');
    if (!panel) return;

    header.addEventListener('click', () => panel.classList.toggle('collapsed'));
    toggleBtn.addEventListener('click', (e) => { e.stopPropagation(); panel.classList.toggle('collapsed'); });
    sendBtn.addEventListener('click', _sendChatMessage);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') _sendChatMessage(); });
    if (floatBtn) floatBtn.addEventListener('click', () => { panel.classList.remove('hide'); panel.classList.remove('collapsed'); floatBtn.classList.add('hide'); });
}
