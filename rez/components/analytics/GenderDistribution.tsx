"use client";

import { ChartContainer } from '@/components/ui/chart';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const data = [
  { name: 'Male', value: 320 },
  { name: 'Female', value: 280 },
  { name: 'Other', value: 40 },
];

const COLORS = ['#5C29A3', '#f857a6', '#ff9966'];

const chartConfig = {
  Male: { label: 'Male', color: '#5C29A3' },
  Female: { label: 'Female', color: '#f857a6' },
  Other: { label: 'Other', color: '#ff9966' },
};

export default function GenderDistribution() {
  return (
    <ChartContainer config={chartConfig} className="bg-white rounded-lg border p-6">
      <>
        <h3 className="font-semibold mb-4">Gender Distribution</h3>
        <PieChart width={350} height={250}>
          <Pie
            data={data}
            cx={175}
            cy={120}
            innerRadius={50}
            outerRadius={90}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </>
    </ChartContainer>
  );
} 