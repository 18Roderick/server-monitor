import { getPingHistory } from "@/api/pings";
import { queryOptions } from "@tanstack/react-query";

export type PingRange = "24h" | "7d" | "30d";

const RANGE_MS: Record<PingRange, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export function rangeToFromIso(range: PingRange, now = new Date()): string {
  return new Date(now.getTime() - RANGE_MS[range]).toISOString();
}

export const pingHistoryQueryOptions = (idServer: string, range: PingRange) => {
  return queryOptions({
    queryKey: ["pings", idServer, range],
    queryFn: () => getPingHistory(idServer, { from: rangeToFromIso(range) }),
  });
};
