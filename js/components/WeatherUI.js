import { $ } from '../utils.js';

export class WeatherUI {
    render(weatherData) {
        const { temp, desc, pm25, usAqi, rainProb } = weatherData;

        const tempNode = $('#weather-temp');
        const descNode = $('#weather-desc');
        const aqiNode = $('#weather-aqi');
        const rainNode = $('#weather-rain');

        if (tempNode) tempNode.textContent = `${temp}°`;
        if (descNode) descNode.textContent = desc;

        if (aqiNode) {
            aqiNode.textContent = `${pm25} (AQI ${usAqi})`;
            aqiNode.className = 'metric-val';
            if (usAqi <= 50) aqiNode.classList.add('aqi-good');
            else if (usAqi <= 100) aqiNode.classList.add('aqi-moderate');
            else aqiNode.classList.add('aqi-unhealthy');
        }

        if (rainNode) rainNode.textContent = `${rainProb}%`;
    }
}
