/**
 * WFTD // Central State Store
 * Manages global application state to decouple UI from logic.
 */

class Store {
    constructor() {
        this.state = {
            currentStep: 1,
            activeFlow: [1, 2, 3, 4, 5, 6, 7],
            itinerary: [],
            insights: [],
            payload: {},
            userProfile: {
                alias: localStorage.getItem('wftd_alias') || 'Guest',
                job: localStorage.getItem('wftd_job') || 'Professional',
                food: localStorage.getItem('wftd_food') || '',
                memory: localStorage.getItem('wftd_memory') || '',
                theme: localStorage.getItem('wftd_theme') || '#9fe870'
            },
            location: {
                name: 'Bangkok',
                lat: 13.7563,
                lon: 100.5018
            }
        };
        this.listeners = new Set();
    }

    getState() {
        return this.state;
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }

    setProfile(profileUpdates) {
        const newProfile = { ...this.state.userProfile, ...profileUpdates };
        this.setState({ userProfile: newProfile });

        // Sync to local storage
        if (profileUpdates.alias !== undefined) localStorage.setItem('wftd_alias', profileUpdates.alias);
        if (profileUpdates.job !== undefined) localStorage.setItem('wftd_job', profileUpdates.job);
        if (profileUpdates.food !== undefined) localStorage.setItem('wftd_food', profileUpdates.food);
        if (profileUpdates.memory !== undefined) localStorage.setItem('wftd_memory', profileUpdates.memory);
        if (profileUpdates.theme !== undefined) localStorage.setItem('wftd_theme', profileUpdates.theme);
    }

    setLocation(name, lat, lon) {
        this.setState({ location: { name, lat, lon } });
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify() {
        for (const listener of this.listeners) {
            listener(this.state);
        }
    }
}

export const store = new Store();
