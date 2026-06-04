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
import { Icon } from './Icon';

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
      <div className="card p-4 text-sm text-ink-400 flex items-center gap-3">
        <Icon name="chart" size={18} className="text-ink-500" />
        No bodyweight entries yet — add one to start your chart.
      </div>
    );
  }

  return (
    <div className="card p-3">
      <h2 className="font-semibold text-ink-100 mb-2 px-1 inline-flex items-center gap-2">
        <Icon name="weight" size={16} className="text-ember-400" />
        Bodyweight ({units})
      </h2>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="rgb(31 37 51)" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="rgb(109 117 135)" fontSize={11} />
            <YAxis stroke="rgb(109 117 135)" fontSize={11} domain={['dataMin - 1', 'dataMax + 1']} />
            <Tooltip
              contentStyle={{
                background: 'rgb(14 18 27)',
                border: '1px solid rgb(31 37 51)',
                borderRadius: 12,
                color: 'rgb(231 233 238)',
                fontFamily: 'Manrope, sans-serif',
              }}
              labelStyle={{ color: 'rgb(154 161 176)' }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="rgb(242 90 14)"
              strokeWidth={2.2}
              dot={{ r: 3, fill: 'rgb(242 90 14)' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
