"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardChartsProps {
  growthData: { name: string; users: number; rooms: number }[];
  distributionData: { name: string; value: number; color: string }[];
}

export function DashboardCharts({ growthData, distributionData }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Platform Growth Chart */}
      <div className="neo-card p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>
          Platform Growth (Last 7 Days)
        </h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--color-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip
                cursor={{ fill: "var(--color-muted)" }}
                contentStyle={{
                  background: "var(--color-background)",
                  border: "2px solid var(--color-border)",
                  boxShadow: "4px 4px 0px var(--color-border)",
                  borderRadius: "0",
                  fontWeight: "bold",
                }}
              />
              <Bar dataKey="users" name="New Users" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rooms" name="Rooms Created" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Distribution Chart */}
      <div className="neo-card p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>
          User Distribution
        </h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                stroke="var(--color-border)"
                strokeWidth={2}
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  background: "var(--color-background)",
                  border: "2px solid var(--color-border)",
                  boxShadow: "4px 4px 0px var(--color-border)",
                  borderRadius: "0",
                  fontWeight: "bold",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4">
          {distributionData.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-black" style={{ background: entry.color }} />
              <span className="text-sm font-bold">{entry.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
