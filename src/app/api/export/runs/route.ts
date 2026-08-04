import { NextResponse } from "next/server";
import { formatPace } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Run } from "@/lib/types";

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  let query = supabase.from("runs").select("*").order("run_date", { ascending: true });
  if (start) query = query.gte("run_date", start);
  if (end) query = query.lte("run_date", end);

  const { data: runs, error } = await query.returns<Run[]>();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = [
    "date",
    "distance_mi",
    "duration_sec",
    "pace_per_mi",
    "avg_hr",
    "max_hr",
    "elevation_gain_ft",
    "rpe",
    "run_type",
    "felt",
    "notes",
  ];

  const rows = (runs ?? []).map((r) => [
    r.run_date,
    r.distance_mi,
    r.duration_sec,
    formatPace(r.duration_sec / r.distance_mi),
    r.avg_hr,
    r.max_hr,
    r.elevation_gain_ft,
    r.rpe,
    r.run_type,
    r.felt,
    r.notes,
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  const filename = `split-runs${start ? `-${start}` : ""}${end ? `-to-${end}` : ""}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
