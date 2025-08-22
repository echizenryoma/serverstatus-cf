export async function onRequest({ request, env }) {
  const influxdb_host = env.INFLUXDB_HOST;
  const influxdb_token = env.INFLUXDB_TOKEN;
  const influxdb_org = env.INFLUXDB_ORG;

  if (request.method === 'GET') {
    try {
      const query_url = new URL(`https://${influxdb_host}/api/v2/query?org=${influxdb_org}&t=${Date.now()}`);
      const influx_ql = `
from(bucket: "server")
  |> range(start: -120s)
  |> filter(fn: (r) => r["_measurement"] == "ping")
  |> filter(fn: (r) => r["_field"] == "packets_transmitted" or r["_field"] == "packets_received")
  |> group(columns: ["_field", "host", "url"])
  |> sum()
  |> pivot(rowKey:["host"], columnKey: ["_field"], valueColumn: "_value")
  |> map(fn: (r) => ({
        r with
        packets_loss_rate: (float(v: r.packets_transmitted - r.packets_received) / float(v: r.packets_transmitted)) * 100.0
    }))
  |> pivot(rowKey:["host"], columnKey: ["url"], valueColumn: "packets_loss_rate")
  |> rename(columns: {
      "6.cd.ct.rdbg.net": "ctv6",
      "6.cd.cm.rdbg.net": "cmv6",
      "6.cd.cu.rdbg.net": "cuv6",
      "cd.ct.rdbg.net": "ctv4",
      "cd.cm.rdbg.net": "cmv4",
      "cd.cu.rdbg.net": "cuv4",
  })
  |> keep(columns: ["host", "ctv4", "cmv4", "cuv4", "ctv6", "cmv6", "cuv6"])
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
      return new Response(csvText, {
        headers: { "content-type": "text/csv" },
      });
    } catch (error) {
      return new Response('Internal Server Error', { status: 500 });
    }
  }
  return new Response('Method Not Allowed', { status: 405 });
}
