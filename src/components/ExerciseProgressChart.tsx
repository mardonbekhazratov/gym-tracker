import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { exerciseHistory, type ExerciseHistoryPoint } from '../db/queries';
import { kgToLb } from '../lib/units';
import { Icon } from './Icon';

interface Props {
  exerciseSlug: string;
  exerciseName: string;
  units: 'kg' | 'lb';
}

export function ExerciseProgressChart({
  exerciseSlug,
  exerciseName,
  units,
}: Props) {
  const [points, setPoints] = useState<ExerciseHistoryPoint[]>([]);

  useEffect(() => {
    void exerciseHistory(exerciseSlug).then(setPoints);
  }, [exerciseSlug]);

  if (points.length === 0) {
    return (
      <div className="card p-4 text-sm text-ink-400 flex items-center gap-3">
        <Icon name="chart" size={18} className="text-ink-500" />
        No logged sets for {exerciseName} yet.
      </div>
    );
  }

  const chartData = points.map((p) => ({
    date: p.date.slice(5),
    top: units === 'kg' ? p.topWeightKg : kgToLb(p.topWeightKg),
    e1rm: units === 'kg' ? p.est1RM : kgToLb(p.est1RM),
  }));

  return (
    <div className="card p-3">
      <h2 className="font-semibold text-ink-100 mb-2 px-1 inline-flex items-center gap-2">
        <Icon name="chart" size={16} className="text-ember-400" />
        {exerciseName} ({units})
      </h2>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="rgb(31 37 51)" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="rgb(109 117 135)" fontSize={11} />
            <YAxis stroke="rgb(109 117 135)" fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} />
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
            <Legend wrapperStyle={{ fontSize: 11, color: 'rgb(154 161 176)' }} />
            <Line
              type="monotone"
              dataKey="top"
              name="Top set"
              stroke="rgb(242 90 14)"
              strokeWidth={2.2}
              dot={{ r: 3, fill: 'rgb(242 90 14)' }}
            />
            <Line
              type="monotone"
              dataKey="e1rm"
              name="Est 1RM"
              stroke="rgb(16 185 129)"
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={{ r: 3, fill: 'rgb(16 185 129)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
