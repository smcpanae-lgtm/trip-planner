import { NextRequest, NextResponse } from "next/server";
import { searchMunicipalityByName } from "@/lib/hare/search";
import type { HarePlaceMatch } from "@/lib/hare/types";

// 晴れ探しドライブの出発地検索（市区町村名のみ・外部APIなし）。
// ここで見つからない地名は、クライアント側で既存の geocode() にフォールバックする。
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 50);
  const results: HarePlaceMatch[] = searchMunicipalityByName(q).map((m) => ({
    name: m.name,
    pref: m.pref,
    lat: m.lat,
    lng: m.lng,
  }));
  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
