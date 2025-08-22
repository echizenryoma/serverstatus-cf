export async function onRequest({ request, env }) {
  const influxdb_host = env.INFLUXDB_HOST;
  const influxdb_token = env.INFLUXDB_TOKEN;
  const influxdb_org = env.INFLUXDB_ORG;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (request.method === 'GET') {
    try {
      const query_url = new URL(`https://${influxdb_host}/api/v2/query?org=${influxdb_org}&t=${Date.now()}`);
      const influx_ql = `
cpu = from(bucket: "server")
  |> range(start: -5s)
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
  |> range(start: -5s)
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
      const response = await fetch(query_url, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${influxdb_token}`,
          'Content-Type': 'application/vnd.flux',
        },
        body: influx_ql,
      });
      if (!response.ok) throw new Error(`fetch CSV failed: ${res.status} ${res.statusText}`);
      const csvText = await response.text();
      const headers = corsHeaders;
      headers['Content-Type'] = 'text/csv';
      return new Response(csvText, {
        headers: headers,
      });
    } catch (error) {
      return new Response('Internal Server Error', { status: 500 });
    }
  }
  return new Response('Method Not Allowed', { status: 405 });
}
