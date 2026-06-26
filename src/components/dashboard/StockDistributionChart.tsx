"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface StockDistributionChartProps {
  healthy: number;
  low: number;
  empty: number;
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444"]; // Emerald for Healthy, Amber for Low, Red for Empty

export default function StockDistributionChart({ healthy, low, empty }: StockDistributionChartProps) {
  const chartData = [
    { name: "Healthy Stock", value: healthy },
    { name: "Low Stock Alert", value: low },
    { name: "Empty Stock", value: empty },
  ].filter(d => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-secondary text-sm">
        No stock data available
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="rgba(24, 24, 27, 0.8)"
            strokeWidth={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(24, 24, 27, 0.9)', 
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              backdropFilter: 'blur(12px)'
            }} 
            itemStyle={{ color: '#fafafa', fontSize: '12px' }}
          />
          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
