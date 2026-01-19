import { queryInflux } from "../../../utils";

export async function onRequest({ request, env }) {
  if (request.method === 'GET') {
    try {
      const now = new Date();

      const stop = new Date(now);
      stop.setUTCHours(0, 5, 0, 0);
      if (now < stop) {
        stop.setUTCDate(stop.getUTCDate() - 1);
      }
      const start = new Date(stop);
      start.setUTCHours(0, 0, 0, 0);

      console.log("start: ", start.toISOString());
      console.log("stop: ", stop.toISOString());

      const influxQl = `
from(bucket: "history")
  |> range(start: ${start.toISOString()}, stop: ${stop.toISOString()})
  |> filter(fn: (r) => r["_measurement"] == "net")
  |> filter(fn: (r) => r["_field"] == "bytes_recv" or r["_field"] == "bytes_sent")
  |> last()
  |> group(columns: ["_field", "host"])
  |> sum()
  |> pivot(rowKey:["host"], columnKey: ["_field"], valueColumn: "_value")
  |> keep(columns: ["host", "bytes_recv", "bytes_sent"])
`
      return await queryInflux(env, influxQl);
    } catch (error) {
      return new Response('Internal Server Error', { status: 500 });
    }
  }
  return new Response('Method Not Allowed', { status: 405 });
}
