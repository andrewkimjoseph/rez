"use client";

import { ChartContainer } from '@/components/ui/chart';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const data = [
  { country: 'USA', completions: 120 },
  { country: 'UK', completions: 90 },
  { country: 'Kenya', completions: 150 },
  { country: 'Nigeria', completions: 110 },
  { country: 'India', completions: 80 },
  { country: 'Canada', completions: 60 },
];

const chartConfig = {
  completions: {
    label: 'Completions',
    color: '#ff9966',
  },
};

export default function CountryDistribution() {
  return (
    <ChartContainer config={chartConfig} className="bg-white rounded-lg border p-6">
      <>
        <h3 className="font-semibold mb-4">Country Distribution</h3>
        <BarChart width={500} height={250} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="country" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="completions" fill="#ff9966" />
        </BarChart>
      </>
    </ChartContainer>
  );
} 