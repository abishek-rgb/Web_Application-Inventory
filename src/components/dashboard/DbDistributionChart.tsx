"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface DbDistributionChartProps {
  tables: Array<{ name: string; sizeBytes: number }>;
}

const COLORS = ["#f59e0b", "#3b82f6", "#ef4444", "#10b981", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function DbDistributionChart({ tables }: DbDistributionChartProps) {
  // Take top 5 tables, aggregate the rest as "Other"
  const sortedTables = [...tables].sort((a, b) => b.sizeBytes - a.sizeBytes);
  const topTables = sortedTables.slice(0, 5);
  const otherBytes = sortedTables.slice(5).reduce((acc, t) => acc + t.sizeBytes, 0);

  const data = topTables.map(t => ({ name: t.name, value: t.sizeBytes }));
  if (otherBytes > 0) {
    data.push({ name: "Other", value: otherBytes });
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (tables.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-secondary text-sm">
        No table data available
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
            paddingAngle={2}
            dataKey="value"
            stroke="rgba(24, 24, 27, 0.8)"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any) => formatBytes(Number(value) || 0)}
            contentStyle={{ 
              backgroundColor: 'rgba(24, 24, 27, 0.9)', 
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              backdropFilter: 'blur(12px)'
            }} 
            itemStyle={{ color: '#fafafa', fontSize: '12px' }}
            labelStyle={{ display: 'none' }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
