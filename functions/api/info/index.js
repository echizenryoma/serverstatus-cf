import { queryInflux } from "../../utils";

export async function onRequest({ request, env }) {
  if (request.method === 'GET') {
    try {
      const influxQl = `
from(bucket: "server")
  |> range(start: -60s)
  |> filter(fn: (r) => r["_measurement"] == "info")
  |> last(column: "host")
  |> pivot(rowKey:["host"], columnKey: ["_field"], valueColumn: "_value")
  |> keep(columns: ["host", "loc", "have_ipv4", "have_ipv6", "up_mbps", "down_mbps", "cpu", "kernel", "traffic_quota_gb"])
`
      return await queryInflux(env, influxQl);
    } catch (error) {
      return new Response('Internal Server Error', { status: 500 });
    }
  }
  return new Response('Method Not Allowed', { status: 405 });
}
