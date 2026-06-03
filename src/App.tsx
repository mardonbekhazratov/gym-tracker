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

export default function App() {
  const setUnits = useStore((s) => s.setUnits);

  useEffect(() => {
    void db.settings.get(1).then((s) => {
      if (s) setUnits(s.units);
    });
  }, [setUnits]);

  return (
    <div className="min-h-full flex flex-col">
      <main className="flex-1 pb-20">
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
  );
}
