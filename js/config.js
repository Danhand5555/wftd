export const CORE_REGIMEN = [
    { time: '7:00 AM', t: 'Morning Routine', d: 'Coffee, hydration, warm-up.', cat: 'leisure', dr: '1h', loc: 'Home Base', cost: 0 },
    { time: '8:00 AM', t: 'Deep Work', d: 'Execution on highest priority goal.', cat: 'work', dr: '3h' },
    { time: '11:00 AM', t: 'Break', d: 'Step away and stretch.', cat: 'leisure', dr: '1h' },
    { time: '12:00 PM', t: 'Emails & Admin', d: 'Process messages and organize.', cat: 'work', dr: '2h' },
    { time: '2:00 PM', t: 'Secondary Tasks', d: 'Exploratory tasks and side projects.', cat: 'work', dr: '2h', loc: 'Local Library / Desk' },
    { time: '4:00 PM', t: 'Wind Down', d: 'Log off and rest.', cat: 'leisure', dr: 'EOD' }
];

export const WEATHER_CODES = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Fog",
    51: "Drizzle", 53: "Drizzle", 55: "Drizzle",
    61: "Rain", 63: "Rain", 65: "Heavy Rain",
    80: "Showers", 81: "Showers", 82: "Heavy Showers",
    95: "Thunderstorm"
};
