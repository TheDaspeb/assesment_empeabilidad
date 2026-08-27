import { NextResponse } from "next/server";

import { query } from "@/infrastructure/database/postgres";

export async function GET() {
  try {
    const result = await query<{
      database: string;
      current_time: Date;
    }>(
      `
      SELECT
        current_database() AS database,
        NOW() AS current_time
      `,
    );

    return NextResponse.json({
      status: "ok",
      database: result.rows[0].database,
      currentTime: result.rows[0].current_time,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
      },
      { status: 500 },
    );
  }
}