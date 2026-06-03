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
      <div className="card p-4 text-sm text-slate-400">
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
      <h2 className="font-semibold mb-2 px-1">
        {exerciseName} ({units})
      </h2>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="rgb(30 41 59)" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="rgb(100 116 139)" fontSize={11} />
            <YAxis stroke="rgb(100 116 139)" fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} />
            <Tooltip
              contentStyle={{
                background: 'rgb(15 23 42)',
                border: '1px solid rgb(30 41 59)',
                borderRadius: 8,
                color: 'rgb(226 232 240)',
              }}
              labelStyle={{ color: 'rgb(148 163 184)' }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey="top"
              name="Top set"
              stroke="rgb(59 130 203)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="e1rm"
              name="Est 1RM"
              stroke="rgb(16 185 129)"
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
