import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { seedIfEmpty } from './db/seed';
import { migrateProgram } from './db/migrate';
import './index.css';

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
    await seedIfEmpty();
    await migrateProgram();
  } catch (err) {
    console.error('DB init failed', err);
  }
  renderApp();
}

void boot();
