import { queryInflux } from "../../utils";

export async function onRequest({ request, env }) {
  if (request.method === 'GET') {
    try {
      const influxQl = `
from(bucket: "server")
  |> range(start: -10s)
  |> filter(fn: (r) => r["_measurement"] == "disk")
  |> filter(fn: (r) =>
    (r["_field"] == "used" or r["_field"] == "total")
    and (r["path"] == "/" or r["path"] == "/opt")
  )
  |> last()
  |> group(columns: ["_field", "host"])
  |> sum()
  |> pivot(rowKey:["host"], columnKey: ["_field"], valueColumn: "_value")
  |> keep(columns: ["host", "total", "used"])
`
      return await queryInflux(env, influxQl);
    } catch (error) {
      return new Response('Internal Server Error', { status: 500 });
    }
  }
  return new Response('Method Not Allowed', { status: 405 });
}
