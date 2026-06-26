"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface OrderDistributionChartProps {
  received: number;
  pending: number;
}

const COLORS = ["#10b981", "#fbbf24"];

export default function OrderDistributionChart({ received, pending }: OrderDistributionChartProps) {
  const data = [
    { name: "Received", value: received },
    { name: "Pending", value: pending },
  ];

  if (received === 0 && pending === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-secondary text-sm">
        No order data available
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="rgba(24, 24, 27, 0.8)"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
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
            itemStyle={{ color: '#fafafa' }}
          />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
