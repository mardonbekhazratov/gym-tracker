import { NavLink } from 'react-router-dom';

const items: { to: string; label: string; icon: string }[] = [
  { to: '/', label: 'Today', icon: '🏋️' },
  { to: '/history', label: 'History', icon: '📅' },
  { to: '/progress', label: 'Progress', icon: '📈' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-20 border-t border-slate-800 bg-slate-950/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-4">
        {items.map((it) => (
          <li key={it.to}>
            <NavLink
              to={it.to}
              end={it.to === '/'}
              className={({ isActive }) =>
                `tap flex flex-col items-center justify-center py-2 text-xs ${
                  isActive ? 'text-brand-500' : 'text-slate-400'
                }`
              }
            >
              <span className="text-lg leading-none">{it.icon}</span>
              <span className="mt-1">{it.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
