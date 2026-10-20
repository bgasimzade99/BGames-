"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ResultChart({
  data,
}: {
  data: { name: string; value: number; fill: string }[];
}) {
  if (data.every((item) => item.value === 0)) return null;

  return (
    <div className="chart-frame">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" stroke="#929aaa" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} stroke="#929aaa" fontSize={12} tickLine={false} axisLine={false} width={28} />
          <Tooltip
            cursor={{ fill: "rgba(244,246,250,0.04)" }}
            contentStyle={{
              background: "#141821",
              border: "1px solid rgba(244,246,250,0.12)",
              borderRadius: 4,
              color: "#f4f6fa",
            }}
          />
          <Bar dataKey="value" radius={[2, 2, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
