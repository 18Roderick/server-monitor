import ping from 'ping';

import { z } from 'zod';

const pingSchema = z.object({
  inputHost: z.string(),
  host: z.string(),
  alive: z.coerce.boolean(),
  output: z.string(),
  time: z.coerce.number(),
  times: z.array(z.number()),
  numeric_host: z.string(),
  min: z.coerce.number(),
  avg: z.coerce.number(),
  max: z.coerce.number(),
  stddev: z.coerce.number(),
  packetLoss: z.coerce.number(),
});

///make ping

export type Ping = z.infer<typeof pingSchema>;

export async function makePing(destination: string) {
  const data = await ping.promise.probe(destination);
  return pingSchema.safeParse(data);
}
