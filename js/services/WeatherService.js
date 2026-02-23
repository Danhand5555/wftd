import { WEATHER_CODES } from '../config.js';

export async function getWeatherContext(lat = 13.7563, lon = 100.5018) {
    try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m&daily=precipitation_probability_max&timezone=Asia%2FBangkok&forecast_days=1`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();

        const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,us_aqi`;
        const aqiRes = await fetch(aqiUrl);
        const aqiData = await aqiRes.json();

        if (!weatherData.current || !aqiData.current) throw new Error("Weather API returned malformed data.");

        const cur = weatherData.current;
        const daily = weatherData.daily;
        const curAqi = aqiData.current;

        const desc = WEATHER_CODES[cur.weather_code] || "Variable";
        const temp = Math.round(cur.temperature_2m);
        const rainProb = daily.precipitation_probability_max[0] || 0;
        const pm25 = Math.round(curAqi.pm2_5);
        const usAqi = curAqi.us_aqi;

        return {
            temp,
            desc,
            pm25,
            usAqi,
            rainProb,
            contextString: `Weather: ${desc}, ${temp}°C. PM2.5: ${pm25}. Rain: ${rainProb}%.`
        };
    } catch (e) {
        console.error("Failed to fetch weather context:", e);
        return {
            temp: '--', desc: 'Unavailable', pm25: '--', usAqi: '--', rainProb: '--',
            contextString: "Weather unavailable."
        };
    }
}
