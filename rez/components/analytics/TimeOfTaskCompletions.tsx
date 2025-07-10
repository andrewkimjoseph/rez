"use client";

import { ChartContainer } from '@/components/ui/chart';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const data = [
  { hour: '0-3', completions: 20 },
  { hour: '3-6', completions: 35 },
  { hour: '6-9', completions: 50 },
  { hour: '9-12', completions: 80 },
  { hour: '12-15', completions: 120 },
  { hour: '15-18', completions: 90 },
  { hour: '18-21', completions: 60 },
  { hour: '21-24', completions: 30 },
];

const chartConfig = {
  completions: {
    label: 'Completions',
    color: '#f857a6',
  },
};

export default function TimeOfTaskCompletions() {
  return (
    <ChartContainer config={chartConfig} className="bg-white rounded-lg border p-6">
      <>
        <h3 className="font-semibold mb-4">Time of Task Completions</h3>
        <BarChart width={500} height={250} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="completions" fill="#f857a6" />
        </BarChart>
      </>
    </ChartContainer>
  );
} 