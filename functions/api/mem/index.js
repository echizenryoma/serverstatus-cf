import { queryInflux } from "../../utils";

export async function onRequest({ request, env }) {
  if (request.method === 'GET') {
    try {
      const influxQl = `
from(bucket: "server")
  |> range(start: -10s)
  |> filter(fn: (r) => r["_measurement"] == "mem")
  |> filter(fn: (r) =>
    r["_field"] == "total" or
    r["_field"] == "used" or
    r["_field"] == "swap_total" or
    r["_field"] == "swap_free"
  )
  |> last()
  |> pivot(rowKey:["host"], columnKey: ["_field"], valueColumn: "_value")
  |> keep(columns: ["host", "total", "used", "swap_total", "swap_free"])
`
      return await queryInflux(env, influxQl);
    } catch (error) {
      return new Response('Internal Server Error', { status: 500 });
    }
  }
  return new Response('Method Not Allowed', { status: 405 });
}
