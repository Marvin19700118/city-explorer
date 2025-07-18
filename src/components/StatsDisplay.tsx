'use client';

import * as React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

type StatsDisplayProps = {
  percentage: number;
  label: string;
  value: number;
  total: number;
  unit: string;
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];

export const StatsDisplay: React.FC<StatsDisplayProps> = ({ percentage, label, value, total, unit }) => {
  const data = [
    { name: 'Discovered', value: percentage },
    { name: 'Remaining', value: 100 - percentage },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              startAngle={90}
              endAngle={450}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
              <Label
                value={`${Math.round(percentage)}%`}
                position="center"
                fill="hsl(var(--foreground))"
                className="text-3xl font-bold font-headline"
              />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center -mt-4">
        <p className="text-xl font-bold font-headline text-primary">{label}</p>
        <p className="text-muted-foreground">
          {value} / {total} {unit}
        </p>
      </div>
    </div>
  );
};
