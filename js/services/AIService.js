export async function generateScheduleViaAI(payload, userJob, foodPref, startLocName, startLat, startLon, weatherContext, ocrText = "") {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        throw new Error('No API Key');
    }

    const memory = localStorage.getItem('wftd_memory') || '';
    const startLocClause = (startLat && startLon) ? `\nUser's STARTING LOCATION: "${startLocName}" (lat: ${startLat}, lon: ${startLon}). ${weatherContext}` : `\nUser's location: ${startLocName}, Bangkok. ${weatherContext}`;
    const notesClause = payload.notes ? `\n\nExtra instructions: ${payload.notes}` : '';
    const ocrClause = ocrText ? `\n\nPDF Schedule Context: ${ocrText}` : '';
    const memoryClause = memory ? `\n\nUser's Long-Term Memory / Habits: ${memory}` : '';

    const prompt = `You are a creative personal scheduler for a user in Bangkok. Return ONLY raw JSON.
Format: {"itinerary": [{"time":"9:00 AM","t":"Task","d":"Desc","cat":"work","dr":"2h","loc":"Place", "cost": 500}], "insights": ["tip1", "tip2"]}
User data: ${JSON.stringify(payload)}${notesClause}${memoryClause}${startLocClause}${ocrClause}`;


    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
        })
    });

    if (!response.ok) {
        const errBody = await response.json();
        throw new Error(`Gemini API error: ${response.status} — ${errBody?.error?.message || 'unknown'}`);
    }

    const raw = await response.json();
    const content = raw.candidates[0].content.parts[0].text.trim();
    let cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsedData;
    try {
        parsedData = JSON.parse(cleanJson);
    } catch {
        const lastBrace = cleanJson.lastIndexOf('}');
        if (lastBrace !== -1) {
            cleanJson = cleanJson.substring(0, lastBrace + 1) + (cleanJson.startsWith('[') ? ']' : '}');
            parsedData = JSON.parse(cleanJson);
        } else throw new Error('Could not recover truncated JSON from Gemini response');
    }

    let itinerary = [];
    let insights = [];
    if (Array.isArray(parsedData)) {
        itinerary = parsedData;
    } else if (parsedData.itinerary) {
        itinerary = parsedData.itinerary;
        if (parsedData.insights) insights = parsedData.insights;
    }

    return { itinerary, insights };
}

export async function classifyGoalFlow(goalText) {
    let flow = [1, 2, 4, 5, 6, 7]; // Default
    let isSocial = false, isWork = false, isLeisure = false;

    try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey || apiKey.includes('YOUR_')) throw new Error('No API Key');

        const prompt = `Classify this goal for a scheduling app: "${goalText}"
        Return ONLY a JSON object: {"category": "social" | "work" | "leisure" | "other"}
        - "social": meeting people, events, calls, syncs.
        - "work": focused individual tasks, coding, writing, projects.
        - "leisure": travel, exploration, rest, relaxation, hobby.
        - "other": anything else.`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (res.ok) {
            const data = await res.json();
            const text = data.candidates[0].content.parts[0].text.trim().replace(/```json/g, '').replace(/```/g, '');
            const aiResult = JSON.parse(text);

            if (aiResult.category === 'social') {
                flow = [1, 2, 3, 4, 6, 7];
                isSocial = true;
            } else if (aiResult.category === 'work') {
                flow = [1, 4, 6, 7];
                isWork = true;
            } else if (aiResult.category === 'leisure') {
                flow = [1, 4, 5, 6, 7];
                isLeisure = true;
            } else {
                flow = [1, 4, 6, 7]; // Default to lean flow for "other" like sleep/rest
            }
        }
    } catch (e) {
        console.warn('AI Flow determination failed, using standard.', e);
    }

    return { flow, isSocial, isWork, isLeisure };
}

export async function generateSuggestions(job) {
    try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey || apiKey.includes('YOUR_')) throw new Error('No API Key');

        const prompt = `Generate suggestion chips for a ${job} for two steps in a scheduling app.
        Return ONLY a JSON object: {
            "goals": [{"label": "Action", "val": "Full descriptive task"}], 
            "meets": [{"label": "Who", "val": "Full name/team"}]
        }
        Generate 4 items per list. Maximum 2 words for labels.
        "meets" should be colleagues/teams/clients relevant to a ${job}.`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (res.ok) {
            const data = await res.json();
            const text = data.candidates[0].content.parts[0].text.trim().replace(/```json/g, '').replace(/```/g, '');
            return JSON.parse(text);
        }
    } catch (e) {
        console.warn('AI Suggestions failed', e);
    }
    return null;
}

export async function processChatAction(chatHistory, scheduleContext, userJob, foodPref, memory) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') throw new Error('No API key');

    const systemPrompt = `You are SCHED AI. Schedule: ${scheduleContext}. User: ${userJob}, ${foodPref}. 
User Memory (Habits/Preferences): ${memory}. 
If the user tells you a new habit, preference, or fact to remember for ALWAYS, return a JSON: {"type":"memory_update","message":"Got it.","new_fact":"The new fact"}.
If they want to update the current schedule, return JSON: {"type":"schedule_update","message":"...","schedule":[...]}. 
Schedule updates MUST be an array of objects matching: {"time":"9:00 AM","t":"Task","d":"Desc","cat":"work","dr":"2h","loc":"Place", "cost": 500}.
Otherwise plain text.`;

    const messages = chatHistory.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_instruction: { parts: [{ text: systemPrompt }] }, contents: messages, generationConfig: { temperature: 0.6 } })
    });

    if (!response.ok) {
        throw new Error('Failed to reach AI');
    }

    const raw = await response.json();
    const replyText = raw.candidates[0].content.parts[0].text.trim();

    // Parse the response
    try {
        const cleanedReply = replyText.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonMatch = cleanedReply.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleanedReply);
        return { type: 'json', data: parsed, rawText: replyText };
    } catch {
        return { type: 'text', text: replyText, rawText: replyText };
    }
}
