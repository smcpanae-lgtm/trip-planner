import shopsData from "@/data/dog-friendly-restaurants.json";

/**
 * 管理人が実際に犬連れで訪問したお店（scripts/dog-friendly-add.mjs で登録）。
 * 犬連れ時の昼食・夕食の地点の近くにあれば、プラン画面に表示する。
 */
export interface DogFriendlyShop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  mapsUrl: string;
  note: string;
  /** 訪問日（YYYY-MM または YYYY-MM-DD）。不明なら空文字。画面には表示しない */
  visitedAt: string;
}

/** 食事の地点からこの距離（km）以内の登録店を表示する */
export const DOG_SHOP_RADIUS_KM = 15;
const MAX_SHOPS = 3;

const shops: DogFriendlyShop[] = shopsData;

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 指定地点から半径内の登録店を、近い順に最大3件返す */
export function findNearbyDogShops(
  lat: number | undefined,
  lng: number | undefined
): { shop: DogFriendlyShop; km: number }[] {
  if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return [];
  }
  return shops
    .map((shop) => ({ shop, km: distanceKm(lat, lng, shop.lat, shop.lng) }))
    .filter((s) => s.km <= DOG_SHOP_RADIUS_KM)
    .sort((a, b) => a.km - b.km)
    .slice(0, MAX_SHOPS);
}
