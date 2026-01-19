import { queryInflux } from "../../utils";

export async function onRequest({ request, env }) {
  if (request.method === 'GET') {
    try {
      const influxQl = `
cpu = from(bucket: "server")
  |> range(start: -10s)
  |> filter(fn: (r) => r["_measurement"] == "cpu")
  |> filter(fn: (r) =>
    r["_field"] == "usage_steal" or
    r["_field"] == "usage_system" or
    r["_field"] == "usage_user"
  )
  |> filter(fn: (r) => r["cpu"] == "cpu-total")
  |> last()
  |> pivot(rowKey:["host"], columnKey: ["_field"], valueColumn: "_value")
  |> keep(columns: ["host", "usage_system", "usage_user", "usage_steal"])

system = from(bucket: "server")
  |> range(start: -10s)
  |> filter(fn: (r) => r["_measurement"] == "system")
  |> filter(fn: (r) =>
    r["_field"] == "uptime" or
    r["_field"] == "load1" or
    r["_field"] == "load5" or
    r["_field"] == "load15" or
    r["_field"] == "n_cpus"
  )
  |> last()
  |> pivot(rowKey:["host"], columnKey: ["_field"], valueColumn: "_value")
  |> keep(columns: ["host", "uptime", "load1", "load5", "load15", "n_cpus"])

join(
  tables: {cpu: cpu, system: system},
  on: ["host"]
)
`
      return await queryInflux(env, influxQl);
    } catch (error) {
      return new Response('Internal Server Error', { status: 500 });
    }
  }
  return new Response('Method Not Allowed', { status: 405 });
}

