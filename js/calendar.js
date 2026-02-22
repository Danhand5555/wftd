import { _parseTimeParts } from './utils.js';

export function _handleExportCalendar() {
    try {
        const saved = JSON.parse(localStorage.getItem('wftd_today_schedule'));
        if (!saved || !saved.itinerary) {
            alert("No schedule found to export.");
            return;
        }

        const itinerary = saved.itinerary;
        let icsContent = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//WFTD//Bangkok Scheduler//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH"
        ];

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;

        itinerary.forEach((node, i) => {
            if (node.dr === 'EOD') return;
            const parts = _parseTimeParts(node.time);
            if (!parts) return;

            const startStr = `${dateStr}T${String(parts.hours).padStart(2, '0')}${String(parts.minutes).padStart(2, '0')}00`;
            let endHours = parts.hours, endMinutes = parts.minutes;
            const drMatch = node.dr.match(/(\d+)(h|m)/);
            if (drMatch) {
                const val = parseInt(drMatch[1], 10);
                if (drMatch[2] === 'h') endHours += val; else endMinutes += val;
                if (endMinutes >= 60) { endHours += Math.floor(endMinutes / 60); endMinutes %= 60; }
            } else endHours += 1;

            const endStr = `${dateStr}T${String(endHours % 24).padStart(2, '0')}${String(endMinutes).padStart(2, '0')}00`;

            icsContent.push("BEGIN:VEVENT");
            icsContent.push(`UID:${Date.now()}-${i}@wftd.app`);
            icsContent.push(`DTSTAMP:${startStr}Z`);
            icsContent.push(`DTSTART:${startStr}`);
            icsContent.push(`DTEND:${endStr}`);
            icsContent.push(`SUMMARY:[WFTD] ${node.t}`);
            icsContent.push(`DESCRIPTION:${node.d}`);
            icsContent.push(`LOCATION:${node.loc || 'Bangkok'}`);
            icsContent.push("END:VEVENT");
        });

        icsContent.push("END:VCALENDAR");
        const calendarString = icsContent.join("\r\n");
        const fileName = `WFTD_Schedule_${dateStr}.ics`;
        const uri = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(calendarString);
        const link = document.createElement('a');
        link.href = uri;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        setTimeout(() => document.body.removeChild(link), 100);
    } catch (e) {
        console.error("Calendar export failed", e);
        alert("Failed to export calendar.");
    }
}
