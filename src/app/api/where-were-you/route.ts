import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { alert_id, activity } = body;

    if (!alert_id || !activity) {
      return NextResponse.json(
        { error: "alert_id and activity are required" },
        { status: 400 }
      );
    }

    const validActivities = [
      "sleeping", "eating", "shower", "driving",
      "working", "family", "school", "kids",
    ];

    if (!validActivities.includes(activity)) {
      return NextResponse.json(
        { error: "Invalid activity" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("where_were_you")
      .insert({ alert_id, activity, count: 1 });

    if (error) {
      console.error("Supabase error:", error);
      // Don't fail the request — still return success for UX
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get("alert_id");

    if (alertId) {
      const { data } = await supabase
        .from("where_were_you")
        .select("activity, count")
        .eq("alert_id", alertId);

      const stats: Record<string, number> = {};
      let total = 0;
      data?.forEach((row) => {
        stats[row.activity] = (stats[row.activity] || 0) + row.count;
        total += row.count;
      });

      return NextResponse.json({ stats, total });
    }

    // Aggregated stats
    const { data } = await supabase
      .from("where_were_you")
      .select("activity, count");

    const stats: Record<string, number> = {};
    let total = 0;
    data?.forEach((row) => {
      stats[row.activity] = (stats[row.activity] || 0) + row.count;
      total += row.count;
    });

    return NextResponse.json({ stats, total });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
