import { $ } from './utils.js';
import { _mountSurface } from './ui.js';

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
    try {
        const saved = JSON.parse(localStorage.getItem('wftd_today_schedule'));
        if (saved && saved.itinerary) scheduleContext = JSON.stringify(saved.itinerary);
    } catch (e) { }

    chatHistory.push({ role: 'user', text: userText });
    const foodPref = localStorage.getItem('wftd_food') || 'No restrictions';
    const userJob = localStorage.getItem('wftd_job') || 'Professional';
    const systemPrompt = `You are SCHED AI. Schedule: ${scheduleContext}. User: ${userJob}, ${foodPref}. Return JSON for updates: {"type":"schedule_update","message":"...","schedule":[...]}. Otherwise plain text.`;

    try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') throw new Error('No API key');

        const messages = chatHistory.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ system_instruction: { parts: [{ text: systemPrompt }] }, contents: messages, generationConfig: { temperature: 0.6 } })
        });

        const raw = await response.json();
        const replyText = raw.candidates[0].content.parts[0].text.trim();
        chatHistory.push({ role: 'model', text: replyText });
        typingNode.remove();

        try {
            const cleanedReply = replyText.replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonMatch = cleanedReply.match(/\{[\s\S]*\}/);
            const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleanedReply);

            if (parsed.type === 'schedule_update' && parsed.schedule) {
                _appendChatMsg(parsed.message || 'Schedule updated!', 'ai');
                const saved = JSON.parse(localStorage.getItem('wftd_today_schedule') || '{}');
                saved.itinerary = parsed.schedule;
                localStorage.setItem('wftd_today_schedule', JSON.stringify(saved));
                _mountSurface(saved.state || {}, parsed.schedule, saved.insights || []);
                return;
            }
        } catch (e) { }
        _appendChatMsg(replyText, 'ai');
    } catch (err) {
        typingNode.remove();
        _appendChatMsg('Error reaching AI.', 'ai');
    }
}

export function _initChat() {
    const panel = $('#chat-panel'), toggleBtn = $('#chat-toggle-btn'), header = $('.chat-header'), floatBtn = $('#chat-float-btn'), sendBtn = $('#chat-send-btn'), input = $('#chat-input');
    if (!panel) return;
    panel.classList.add('hide');
    header.addEventListener('click', () => panel.classList.toggle('collapsed'));
    toggleBtn.addEventListener('click', (e) => { e.stopPropagation(); panel.classList.toggle('collapsed'); });
    sendBtn.addEventListener('click', _sendChatMessage);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') _sendChatMessage(); });
    if (floatBtn) floatBtn.addEventListener('click', () => { panel.classList.remove('hide'); panel.classList.remove('collapsed'); floatBtn.classList.add('hide'); });
}

export function _showChat() {
    const panel = $('#chat-panel');
    if (panel) { panel.classList.remove('hide'); panel.classList.remove('collapsed'); }
}
