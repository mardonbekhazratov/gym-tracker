import { useEffect } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { useStore } from '../store/useStore';
import { restChimeAction } from './restChime';

interface RestChimePlugin {
  /** Arm the chime for `at` (epoch ms, integer), replacing any earlier one. */
  schedule(options: { at: number; headphonesOnly: boolean }): Promise<void>;
  cancel(): Promise<void>;
}

/**
 * Native side (RestChimePlugin.java) hands the chime to AlarmManager, so it
 * plays even after the screen locks and the WebView stops running JS.
 */
const NativeChime = registerPlugin<RestChimePlugin>('RestChime');

/**
 * Web/PWA fallback: a plain timeout, so it only chimes while the tab is
 * running, and browsers can't tell whether headphones are connected — it
 * plays on any output.
 */
let webTimer: number | undefined;
const WebChime: RestChimePlugin = {
  async schedule({ at }) {
    window.clearTimeout(webTimer);
    webTimer = window.setTimeout(() => {
      void new Audio(`${import.meta.env.BASE_URL}rest-chime.wav`).play().catch(() => {});
    }, at - Date.now());
  },
  async cancel() {
    window.clearTimeout(webTimer);
  },
};

/** Keeps the pending rest-over chime in step with the rest timer and setting. */
export function useRestChime() {
  const endsAt = useStore((s) => s.rest?.endsAt ?? null);
  const mode = useStore((s) => s.restChime);

  useEffect(() => {
    const chime = Capacitor.isNativePlatform() ? NativeChime : WebChime;
    const action = restChimeAction(endsAt, mode, Date.now());
    const done =
      action.type === 'schedule'
        ? chime.schedule({ at: Math.round(action.at), headphonesOnly: action.headphonesOnly })
        : chime.cancel();
    done.catch((err) => console.warn('[rest-chime]', err));
  }, [endsAt, mode]);
}
