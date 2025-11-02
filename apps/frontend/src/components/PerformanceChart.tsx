import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";

const COLORS = [
  "hsl(210 100% 50%)", "hsl(0 73% 52%)", "hsl(39 100% 50%)", "hsl(142 71% 27%)", "hsl(300 100% 30%)",
  "hsl(191 100% 39%)", "hsl(340 62% 55%)", "hsl(88 60% 35%)", "hsl(0 65% 43%)", "hsl(207 55% 38%)",
  "hsl(300 55% 38%)", "hsl(174 60% 40%)", "hsl(60 100% 33%)", "hsl(260 60% 50%)", "hsl(24 100% 45%)",
  "hsl(0 91% 28%)", "hsl(290 55% 23%)", "hsl(157 53% 35%)", "hsl(216 45% 48%)", "hsl(241 38% 46%)",
];

interface PerformanceChartProps {
  data: any[];
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
  const { chartData, seriesNames } = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return { chartData: [], seriesNames: [] as string[] };
    }

    const points = data
      .map((item: any) => ({
        t: new Date(item.createdAt).getTime(),
        name: item.model?.name ?? item.modelId ?? "unknown",
        v: Number(item.netPortfolio),
      }))
      .filter((p) => Number.isFinite(p.v))
      .sort((a, b) => a.t - b.t);

    const names = new Set<string>();
    for (const p of points) names.add(p.name);

    const uniqueTs = Array.from(new Set(points.map((p) => p.t))).sort((a, b) => a - b);
    const gaps: number[] = [];
    for (let i = 1; i < uniqueTs.length; i++) gaps.push(uniqueTs[i] - uniqueTs[i - 1]);
    const medianGap = gaps.length ? gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)] : 60_000;
    const tolerance = Math.min(5 * 60_000, Math.max(5_000, Math.floor((medianGap || 60_000) * 1.5)));

    const rows: any[] = [];
    let bucketStart = points[0].t;
    let bucketEnd = points[0].t;
    let bucketRows: Record<string, number> = {};

    const flush = () => {
      const center = Math.round((bucketStart + bucketEnd) / 2);
      rows.push({ t: center, ...bucketRows });
      bucketRows = {};
    };

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p.t - bucketEnd > tolerance) {
        flush();
        bucketStart = p.t;
        bucketEnd = p.t;
      }
      bucketEnd = Math.max(bucketEnd, p.t);
      bucketRows[p.name] = p.v;
    }
    flush();

    return { chartData: rows, seriesNames: Array.from(names.values()) };
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground">No performance data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="t"
            type="number"
            domain={["auto", "auto"]}
            tickFormatter={(v: number) => new Date(v).toLocaleTimeString()}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            domain={[600, 1500]}
            ticks={[600, 1000, 1500]}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip
            labelFormatter={(label: any) => new Date(label).toLocaleString()}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              boxShadow: "var(--shadow-elegant)",
            }}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          {seriesNames.map((name, idx) => (
            <Line
              key={name}
              type="basis"
              dataKey={name}
              dot={false}
              strokeWidth={2}
              stroke={COLORS[idx % COLORS.length]}
              strokeLinecap="round"
              strokeLinejoin="round"
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
