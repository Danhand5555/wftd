export class TimePickerUI {
    constructor() {
        this.modal = document.getElementById('tp-modal');
        if (!this.modal) return;

        this.colHour = document.getElementById('tp-hour');
        this.colMin = document.getElementById('tp-min');
        this.colAmpm = document.getElementById('tp-ampm');
        this.confirmBtn = document.getElementById('tp-confirm');
        this.closeBtn = this.modal.querySelector('.tp-close');

        this.targetInput = null;
        this.scrollTimeout = null;

        this.initDials();
        this.bindEvents();
    }

    initDials() {
        // Hours 1-12
        for (let i = 1; i <= 12; i++) {
            let li = document.createElement('li');
            li.textContent = i;
            this.colHour.appendChild(li);
        }
        // Minutes 00, 15, 30, 45
        for (let i = 0; i < 60; i += 15) {
            let li = document.createElement('li');
            li.textContent = i === 0 ? '00' : i;
            this.colMin.appendChild(li);
        }
        // AM/PM
        ['AM', 'PM'].forEach(p => {
            let li = document.createElement('li');
            li.textContent = p;
            this.colAmpm.appendChild(li);
        });

        [this.colHour, this.colMin, this.colAmpm].forEach(col => {
            col.addEventListener('scroll', () => {
                if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
                this.scrollTimeout = setTimeout(() => {
                    this.updateActive(col);
                }, 50); // slight debounce
            });
        });
    }

    updateActive(col) {
        const center = col.scrollTop + (col.offsetHeight / 2);
        let closest = null;
        let minDist = Infinity;

        Array.from(col.children).forEach(li => {
            li.classList.remove('active');
            const liCenter = li.offsetTop + (li.offsetHeight / 2) - col.offsetTop;
            const dist = Math.abs(liCenter - center);
            if (dist < minDist) {
                minDist = dist;
                closest = li;
            }
        });
        if (closest) closest.classList.add('active');
    }

    open(targetInput) {
        this.targetInput = targetInput;
        this.modal.classList.remove('hidden');

        // Parse current value or fallback
        let cur = targetInput.value;
        if (!cur || cur.toLowerCase() === 'now' || cur === '') {
            const now = new Date();
            let h = now.getHours();
            let ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            // floor to nearest 15 to match dial natively
            let m = Math.floor(now.getMinutes() / 15) * 15;
            let mStr = m === 0 ? '00' : m.toString();
            cur = `${h}:${mStr} ${ampm}`;
        }

        this.scrollToValue(cur);
    }

    close() {
        this.modal.classList.add('hidden');
        this.targetInput = null;
    }

    scrollToValue(valStr) {
        const match = valStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (!match) return;
        let h = parseInt(match[1]).toString();
        let m = match[2];
        let ampm = match[3] ? match[3].toUpperCase() : 'AM';

        setTimeout(() => {
            this.snapToText(this.colHour, h);
            this.snapToText(this.colMin, m);
            this.snapToText(this.colAmpm, ampm);
        }, 50);
    }

    snapToText(col, text) {
        const match = Array.from(col.children).find(li => li.textContent === text);
        if (match) {
            col.scrollTop = match.offsetTop - col.offsetTop - (col.offsetHeight / 2) + (match.offsetHeight / 2);
            this.updateActive(col);
        }
    }

    getValue() {
        const hr = this.colHour.querySelector('li.active')?.textContent || '12';
        const min = this.colMin.querySelector('li.active')?.textContent || '00';
        const ampm = this.colAmpm.querySelector('li.active')?.textContent || 'AM';
        return `${hr}:${min} ${ampm}`;
    }

    bindEvents() {
        this.closeBtn.addEventListener('click', () => this.close());
        this.confirmBtn.addEventListener('click', () => {
            if (this.targetInput) {
                this.targetInput.value = this.getValue();
                this.targetInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            this.close();
        });

        [this.colHour, this.colMin, this.colAmpm].forEach(col => {
            col.addEventListener('click', (e) => {
                if (e.target.tagName === 'LI') {
                    col.scrollTop = e.target.offsetTop - col.offsetTop - (col.offsetHeight / 2) + (e.target.offsetHeight / 2);
                }
            });
        });

        // Close when clicking outside card
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
    }
}
