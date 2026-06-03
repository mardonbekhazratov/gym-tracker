import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { allBodyWeights } from '../db/queries';
import type { BodyWeight } from '../db/db';
import { kgToLb } from '../lib/units';

interface Props {
  units: 'kg' | 'lb';
  refreshKey?: number;
}

export function BodyWeightChart({ units, refreshKey }: Props) {
  const [data, setData] = useState<BodyWeight[]>([]);

  useEffect(() => {
    void allBodyWeights().then(setData);
  }, [refreshKey]);

  const chartData = data.map((b) => ({
    date: b.date.slice(5),
    weight: units === 'kg' ? b.weightKg : kgToLb(b.weightKg),
  }));

  if (data.length === 0) {
    return (
      <div className="card p-4 text-sm text-slate-400">
        No bodyweight entries yet — add one to start your chart.
      </div>
    );
  }

  return (
    <div className="card p-3">
      <h2 className="font-semibold mb-2 px-1">Bodyweight ({units})</h2>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="rgb(30 41 59)" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="rgb(100 116 139)" fontSize={11} />
            <YAxis stroke="rgb(100 116 139)" fontSize={11} domain={['dataMin - 1', 'dataMax + 1']} />
            <Tooltip
              contentStyle={{
                background: 'rgb(15 23 42)',
                border: '1px solid rgb(30 41 59)',
                borderRadius: 8,
                color: 'rgb(226 232 240)',
              }}
              labelStyle={{ color: 'rgb(148 163 184)' }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="rgb(59 130 203)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
