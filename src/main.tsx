import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import App from './App';
import { seedIfEmpty } from './db/seed';
import { migrateProgram } from './db/migrate';
import './index.css';

// Service worker policy:
// - Web: register it for an offline-first PWA.
// - Native (Capacitor): never register, and tear down any worker + caches a
//   previous build left behind. The APK already serves assets locally, and a
//   stale precache makes the WebView keep running an old JS bundle that no
//   longer matches the installed native code (e.g. the hardware back-button
//   listener goes missing, trapping the user in the app). See
//   lib/useAndroidBackButton.ts.
async function setupServiceWorker(): Promise<{ reloading: boolean }> {
  if (!Capacitor.isNativePlatform()) {
    const { registerSW } = await import('virtual:pwa-register');
    registerSW({ immediate: true });
    return { reloading: false };
  }

  let removedStale = false;
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    if (regs.length > 0) removedStale = true;
    await Promise.all(regs.map((r) => r.unregister()));
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    if (keys.length > 0) removedStale = true;
    await Promise.all(keys.map((k) => caches.delete(k)));
  }

  // If we just evicted a stale worker, reload once so the page is served from
  // the freshly installed APK assets instead of the worker's cache. On the next
  // launch there is nothing to remove, so this never loops.
  if (removedStale) {
    location.reload();
    return { reloading: true };
  }
  return { reloading: false };
}

function renderApp() {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
}

// Ensure the database is seeded and migrated to the current program *before*
// the first render, so screens never query for day templates that the
// migration hasn't added yet. Render regardless if init fails.
async function boot() {
  try {
    const { reloading } = await setupServiceWorker();
    if (reloading) return; // page is about to reload; skip the rest
    await seedIfEmpty();
    await migrateProgram();
  } catch (err) {
    console.error('DB init failed', err);
  }
  renderApp();
}

void boot();
