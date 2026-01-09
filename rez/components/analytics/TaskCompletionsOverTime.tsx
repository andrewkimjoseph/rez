"use client";

import { ChartContainer } from '@/components/ui/chart';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const data = [
  { month: 'Jan', completions: 120 },
  { month: 'Feb', completions: 200 },
  { month: 'Mar', completions: 150 },
  { month: 'Apr', completions: 180 },
  { month: 'May', completions: 220 },
  { month: 'Jun', completions: 170 },
];

const chartConfig = {
  completions: {
    label: 'Completions',
    color: '#5C29A3',
  },
};

export default function TaskCompletionsOverTime() {
  return (
    <ChartContainer config={chartConfig} className="bg-white rounded-lg border p-6">
      <>
        <h3 className="font-semibold mb-4">Task Completions Over Time</h3>
        <LineChart width={500} height={250} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="completions" stroke="#5C29A3" strokeWidth={2} />
        </LineChart>
      </>
    </ChartContainer>
  );
} 