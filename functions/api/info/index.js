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
from(bucket: "server")
  |> range(start: -5s)
  |> filter(fn: (r) => r["_measurement"] == "info")
  |> filter(fn: (r) =>
    r["_field"] == "loc" or
    r["_field"] == "have_ipv4" or
    r["_field"] == "have_ipv6" or
    r["_field"] == "up_mbps" or
    r["_field"] == "down_mbps"
  )
  |> last(column: "host")
  |> pivot(rowKey:["host"], columnKey: ["_field"], valueColumn: "_value")
  |> keep(columns: ["host", "loc", "have_ipv4", "have_ipv6", "up_mbps", "down_mbps"])
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
