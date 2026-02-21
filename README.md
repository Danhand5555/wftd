# WFTD — What's For Today

> **An AI-powered daily schedule generator for Bangkok.** Tell it your goal, and it builds your entire day — real places, live map, transport times, and a chat assistant that can rewrite your schedule on the fly.

---

## ✦ What It Does

You answer 7 quick questions. The AI builds a full, rich day for you.

- **Understands your goal** — Novel writing? Deep work? Rest day? It tailors the whole day.
- **Fills every hour** — Not just your main task. It infers your interests and suggests complementary activities (temples, cafés, bookshops, parks).
- **Uses real places** — Every location is a real, searchable Bangkok venue pinned on a live map.
- **Shows you how to get there** — Walk, BTS/MRT, Grab, or motorbike. Estimated times from your actual GPS location. One tap opens Google Maps.
- **Lives with you** — The schedule tracks real time. Past blocks fade, current block pulses.
- **Lets you edit** — Tap any block to edit time, duration, or description in place.
- **Has a chat assistant** — Ask it questions or tell it to change your schedule. It rewrites the timeline instantly.

---

## ✦ Tech Stack

| Layer | Technology |
|-------|-----------|
| Core | Vanilla HTML · CSS · JavaScript |
| Build | [Vite](https://vitejs.dev/) |
| AI (Schedule + Chat) | [Google Gemini 2.5 Flash Lite](https://ai.google.dev/) |
| Maps | [Leaflet.js](https://leafletjs.com/) + [OpenStreetMap](https://www.openstreetmap.org/) |
| Geocoding | [Photon by Komoot](https://photon.komoot.io/) + [Nominatim](https://nominatim.openstreetmap.org/) |
| Geolocation | Browser `navigator.geolocation` API |
| Persistence | `localStorage` |
| Fonts | [Inter — Google Fonts](https://fonts.google.com/specimen/Inter) |

**Zero backend. Zero database. Zero paid map API.**

---

## ✦ Getting Started

### 1. Clone

```bash
git clone https://github.com/Danhand5555/wftd.git
cd wftd
```

### 2. Install

```bash
npm install
```

### 3. Add your Gemini API key

```bash
cp .env.example .env
```

Open `.env` and replace the placeholder:

```env
VITE_GEMINI_API_KEY=YOUR_KEY_HERE
```

Get a free key at → [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### 4. Run

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## ✦ How the AI Works

### Schedule Generation

The system prompt tells Gemini to:

1. Give the main goal its dedicated block(s)
2. Infer the user's personality from their goal and suggest enriching complementary activities
3. Use **real, searchable Bangkok venue names** (never "Pizza shop" or "Nearby café")
4. Fill every hour from wake time to EOD — 8–12 blocks minimum
5. Always include morning routine, all meals, and wind-down

**Model:** `gemini-2.5-flash-lite` — chosen for lowest cost while maintaining JSON output quality.

### Chat Assistant (SCHED AI)

The chat panel passes the user's full schedule as context on every message. Gemini can:

- Answer questions about the schedule in plain text
- Return a structured `{ type: "schedule_update", schedule: [...] }` JSON when asked to change something, which instantly re-renders the timeline

### Location Resolution

```
AI outputs "loc": "Supanniga Eating Room, Sathorn"
         ↓
Photon geocoder (POI-optimized, Bangkok-biased)
         ↓ (if not found)
Nominatim fallback (countrycodes=th)
         ↓ (if not found)  
Shorter name retry ("Supanniga Eating Room")
         ↓
Pin dropped on Leaflet/OSM map at zoom 16
```

### Transport Routing

```
GPS distance (Haversine) × 1.4 road factor
         ↓
Bangkok-tuned speeds:
  🚶 Walk      4.5 km/h
  🚇 BTS/MRT   28 km/h  (+10 min station walk)
  🚗 Grab      18 km/h  (+5 min wait)
  🛵 Motorbike 22 km/h
         ↓
Clickable cards → Google Maps with correct travel mode
```

---

## ✦ File Structure

```
wftd/
├── index.html        All markup: Auth · Form · Dashboard · Modal · Chat
├── styles.css        Design system: Brutalist/Notion × Wise aesthetic
├── script.js         Engine: Auth · Gemini API · Schedule · Maps · Chat · Transport
├── .env              Your API key (gitignored)
├── .env.example      Safe template for collaborators
├── package.json      Vite only — no other dependencies
└── README.md
```

---

## ✦ Commands

```bash
npm run dev      # Dev server → http://localhost:5173
npm run build    # Production build → /dist
npm run preview  # Preview production build locally
```

---

## ✦ Cost

For a daily personal use app this is essentially free:

| Service | Cost |
|---------|------|
| Gemini 2.5 Flash Lite | ~$0.00–$0.01 per schedule |
| Leaflet + OpenStreetMap | Free forever |
| Photon geocoder | Free forever |
| Nominatim | Free (fair use) |
| Browser Geolocation API | Free |

---

## ✦ Roadmap

- [ ] PWA / Add to Home Screen support
- [ ] Multiple saved schedules (history)
- [ ] Share schedule as link
- [ ] Push notification reminders for each block
- [ ] Offline fallback without API key

---

## ✦ License

MIT — use it, fork it, ship it.

---

<div align="center">
  <sub>Built in Bangkok · Powered by Gemini · Mapped by OpenStreetMap</sub>
</div>
