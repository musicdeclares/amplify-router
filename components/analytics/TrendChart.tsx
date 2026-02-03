"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DailyCount {
  date: string;
  total: number;
  fallbacks: number;
}

interface TrendChartProps {
  dailyCounts: DailyCount[];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TrendChart({ dailyCounts }: TrendChartProps) {
  if (dailyCounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No routing data for this period.
      </div>
    );
  }

  const chartData = dailyCounts.map((d) => ({
    ...d,
    dateLabel: formatDate(d.date),
  }));

  return (
    <div className="w-full overflow-hidden">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={35} />
          <Tooltip
            labelFormatter={(_, payload) => {
              if (payload?.[0]?.payload?.date) {
                return new Date(
                  payload[0].payload.date + "T00:00:00",
                ).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });
              }
              return "";
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="total"
            name="Total Routes"
            stroke="hsl(221, 83%, 53%)"
            fill="hsl(221, 83%, 53%)"
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="fallbacks"
            name="Fallbacks"
            stroke="hsl(0, 84%, 60%)"
            fill="hsl(0, 84%, 60%)"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
