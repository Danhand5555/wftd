# WFTD — What's For Today

> **An AI-powered daily schedule generator for Bangkok.** Tell it your goal and your professional role, and it builds your entire day — real places, live map, strategic insights, and an AI chat assistant.

**Live Demo: [https://wftd.vercel.app](https://wftd.vercel.app)**

---

## ✦ What It Does

You answer a few quick questions about your day. The AI builds a full, rich, job-specific schedule for you.

- **Professional Personalization** — Tell it you're a "Hedge Fund Manager" or "Architect", and it suggests work tasks and teammates (LPs, Risk Team, Site Syncs) specific to your field.
- **Dynamic AI Suggestions** — The onboarding flow uses Gemini to generate hyper-personalized goal and meeting suggestions live as you sign up.
- **Strategic AI Insights** — Beyond the timeline, look at the sidebar for high-level advice on productivity, travel, and local context tailored to your day.
- **Strict 12h AM/PM Format** — Clean, human-readable time formatting enforced across all AI generations and UI displays.
- **Dietary & Proximity Intelligence** — AI suggests real Bangkok restaurants that strictly match your dietary preferences (Vegan, Keto, etc.) located near your starting point.
- **Uses real places** — Every location is a real venue pinned on a live map with one-tap Google Maps navigation.
- **Lives with you** — The schedule tracks real time. Past blocks fade, current block pulses with a focus glow.
- **Has a chat assistant** — Ask SCHED AI to shift your meetings, find a nearby lunch spot, or rewrite the whole day instantly.

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
| UI/UX | Premium Brutalist · Custom Micro-animations · Interactive Map |

**Zero backend. Zero database. Local-first performance.**

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

### Schedule & Strategy Generation

The system prompt tells Gemini to return a structured JSON object including:

1.  **`itinerary`**: A full day of 8–12 blocks from morning routine to EOD.
2.  **`insights`**: 3–4 high-level strategic tips (Productivity hacks, travel alerts, or local tips).

**Rules followed by AI:**
- Use **12-hour AM/PM format** strictly.
- Suggest **Job-Specific** work activities (never generic "Work").
- Respect **Dietary Preferences** for all restaurant suggestions.
- Calculate costs in **THB (Thai Baht)**.
- Use **Real, Searchable Place Names** from OSM.

### Dynamic Suggestions System

The onboarding chips are powered by a hybrid engine:
- **Instant Fallback**: Logic-based chips for core categories (Tech, Finance, Design, Legal).
- **AI Upgrade**: Gemini generates 4 hyper-specific suggestions for whatever job title you type, swapping them in live.

### Location & Transport

```
AI outputs "loc": "Dining Room at The House on Sathorn"
         ↓
Photon geocoder (POI-optimized, Bangkok-biased)
         ↓
Haversine GPS distance calculation
         ↓
Bangkok-tuned Transport Engine:
  🚶 Walk (4.5 km/h) | 🚇 BTS/MRT | 🚗 Grab | 🛵 Motorbike
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

For a daily personal use app, this is essentially free:

| Service | Cost |
|---------|------|
| Gemini 2.5 Flash Lite | Free Tier (up to 15 RPM) |
| Leaflet + OpenStreetMap | Free forever |
| Geocoding APIs | Free (Fair Use) |

---

## ✦ Roadmap

- [x] Hyper-personalized AI roles
- [x] Strategic AI Insight Cards
- [x] Standardized AM/PM & THB
- [ ] PWA / Add to Home Screen support
- [ ] Multiple saved schedules (history)
- [ ] Share schedule as link

---

## ✦ License

MIT — use it, fork it, ship it.

---

<div align="center">
  <sub>Built in Bangkok · Powered by Gemini · Mapped by OpenStreetMap</sub>
</div>
