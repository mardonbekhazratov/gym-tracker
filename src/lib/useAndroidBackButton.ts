import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { decideBackAction, HOME_PATH } from './navigation';
import { closeTopOverlay } from './overlayStack';

// Wire Android's hardware/gesture back button into the router.
//
// Without this, Capacitor core has no back-button handling at all, so every
// press falls through to the Activity and closes the app — including when you
// drill into a session from History and expect to return to the list.
//
// On a top-level tab we let the app exit (standard Android behaviour); anywhere
// deeper we navigate back through the in-app history instead.
export function useAndroidBackButton(): void {
  const navigate = useNavigate();
  const location = useLocation();

  // Keep the latest path in a ref so we can register the native listener once
  // (avoids tearing it down and re-adding it on every navigation, which can
  // briefly leave two listeners attached and fire the handler twice).
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;

    const listener = App.addListener('backButton', () => {
      // 1. An open sheet/dialog takes priority — close it, don't navigate.
      if (closeTopOverlay()) return;

      // 2. Otherwise route based on where we are.
      switch (decideBackAction(pathRef.current)) {
        case 'exit':
          void App.exitApp();
          break;
        case 'home':
          navigate(HOME_PATH);
          break;
        case 'back':
          navigate(-1);
          break;
      }
    });

    return () => {
      void listener.then((l) => l.remove());
    };
  }, [navigate]);
}
