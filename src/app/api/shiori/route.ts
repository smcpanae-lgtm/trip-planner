import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "AI生成APIは /api/generate に移動しました。画面を更新してから再度お試しください。",
      errorType: "moved_to_generate",
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error: "AI生成APIは /api/generate に移動しました。",
      errorType: "moved_to_generate",
    },
    { status: 410 }
  );
}
