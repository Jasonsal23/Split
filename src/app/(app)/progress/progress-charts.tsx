"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDuration } from "@/lib/format";
import type { DistanceUnit } from "@/lib/units";

interface FinishPoint {
  date: string;
  predictedSec: number;
}

interface MileagePoint {
  weekLabel: string;
  miles: number;
}

interface EfPoint {
  weekLabel: string;
  ef: number | null;
}

const GRID_COLOR = "#27272a"; // zinc-800
const AXIS_COLOR = "#71717a"; // zinc-500
const TOOLTIP_STYLE = {
  background: "#18181b", // zinc-900
  border: "1px solid #27272a",
  borderRadius: 8,
  fontSize: 12,
  color: "#f4f4f5",
};

function formatShortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export default function ProgressCharts({
  finishSeries,
  goalTimeSec,
  weeklyMileage,
  efTrend,
  units,
}: {
  finishSeries: FinishPoint[];
  goalTimeSec: number | null;
  weeklyMileage: MileagePoint[];
  efTrend: EfPoint[];
  units: DistanceUnit;
}) {
  const hasFinishData = finishSeries.length > 0;
  const hasMileageData = weeklyMileage.some((w) => w.miles > 0);
  const hasEfData = efTrend.some((w) => w.ef !== null);

  return (
    <div className="space-y-10">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Predicted finish
        </p>
        {hasFinishData ? (
          <div className="mt-3 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={finishSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
                  stroke={AXIS_COLOR}
                  tick={{ fontSize: 11, fill: AXIS_COLOR }}
                  axisLine={{ stroke: GRID_COLOR }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => formatDuration(v)}
                  stroke={AXIS_COLOR}
                  tick={{ fontSize: 11, fill: AXIS_COLOR }}
                  axisLine={false}
                  tickLine={false}
                  width={64}
                  domain={["dataMin - 300", "dataMax + 300"]}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value) => [formatDuration(Number(value)), "Predicted"]}
                />
                {goalTimeSec !== null && (
                  <ReferenceLine
                    y={goalTimeSec}
                    stroke="#52525b"
                    strokeDasharray="4 4"
                    label={{
                      value: `Goal ${formatDuration(goalTimeSec)}`,
                      position: "insideTopRight",
                      fill: "#a1a1aa",
                      fontSize: 11,
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="predictedSec"
                  stroke="#f4f4f5"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#f4f4f5", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">
            No fitness snapshots yet — log a run or generate a plan to start
            this trend.
          </p>
        )}
      </section>

      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Weekly mileage
        </p>
        {hasMileageData ? (
          <div className="mt-3 h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyMileage} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                <XAxis
                  dataKey="weekLabel"
                  stroke={AXIS_COLOR}
                  tick={{ fontSize: 11, fill: AXIS_COLOR }}
                  axisLine={{ stroke: GRID_COLOR }}
                  tickLine={false}
                />
                <YAxis
                  stroke={AXIS_COLOR}
                  tick={{ fontSize: 11, fill: AXIS_COLOR }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value) => [`${value} ${units}`, "Mileage"]}
                />
                <Bar dataKey="miles" fill="#60a5fa" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">
            No mileage logged in the last 8 weeks yet.
          </p>
        )}
      </section>

      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Efficiency factor
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          Easy-run pace per heartbeat — rising means your aerobic fitness is
          improving at the same effort.
        </p>
        {hasEfData ? (
          <div className="mt-3 h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={efTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                <XAxis
                  dataKey="weekLabel"
                  stroke={AXIS_COLOR}
                  tick={{ fontSize: 11, fill: AXIS_COLOR }}
                  axisLine={{ stroke: GRID_COLOR }}
                  tickLine={false}
                />
                <YAxis
                  stroke={AXIS_COLOR}
                  tick={{ fontSize: 11, fill: AXIS_COLOR }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  domain={["auto", "auto"]}
                  tickFormatter={(v: number) => v.toFixed(3)}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value) => [Number(value).toFixed(4), "EF"]}
                />
                <Line
                  type="monotone"
                  dataKey="ef"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#a78bfa", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">
            Log easy runs with heart rate to start this trend.
          </p>
        )}
      </section>
    </div>
  );
}
