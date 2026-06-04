import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { RestTimer } from './components/RestTimer';
import { TodayScreen } from './screens/TodayScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SessionDetailScreen } from './screens/SessionDetailScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { db } from './db/db';
import { useStore } from './store/useStore';
import { ConfirmProvider } from './components/ui/ConfirmDialog';

export default function App() {
  const setUnits = useStore((s) => s.setUnits);

  useEffect(() => {
    void db.settings.get(1).then((s) => {
      if (s) setUnits(s.units);
    });
  }, [setUnits]);

  return (
    <ConfirmProvider>
      <div className="min-h-full flex flex-col">
        {/* Soft status-bar scrim so content fades cleanly under the notch */}
        <div
          className="fixed inset-x-0 top-0 z-20 pointer-events-none h-safe-top
            bg-gradient-to-b from-ink-950 via-ink-950/85 to-transparent"
        />
        <main className="flex-1 pt-safe pb-[calc(env(safe-area-inset-bottom)+84px)] px-safe">
          <Routes>
            <Route path="/" element={<TodayScreen />} />
            <Route path="/history" element={<HistoryScreen />} />
            <Route path="/history/:sessionId" element={<SessionDetailScreen />} />
            <Route path="/progress" element={<ProgressScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
          </Routes>
        </main>
        <RestTimer />
        <BottomNav />
      </div>
    </ConfirmProvider>
  );
}
