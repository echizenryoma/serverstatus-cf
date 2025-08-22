export async function onRequest({ request, env }) {
  const influxdb_host = env.INFLUXDB_HOST;
  const influxdb_token = env.INFLUXDB_TOKEN;
  const influxdb_org = env.INFLUXDB_ORG;

  if (request.method === 'GET') {
    try {
      const query_url = new URL(`https://${influxdb_host}/api/v2/query?org=${influxdb_org}&t=${Date.now()}`);
      const influx_ql = `
ping = from(bucket: "server")
  |> range(start: -5s)
  |> filter(fn: (r) => r["_measurement"] == "ping")
  |> filter(fn: (r) => r["_field"] == "average_response_ms")
  |> group(columns: ["_field", "host", "url"])
  |> last()
  |> pivot(rowKey:["host"], columnKey: ["url"], valueColumn: "_value")
  |> fill(column: "cd.ct.rdbg.net", value: 850.0)
  |> fill(column: "cd.cm.rdbg.net", value: 850.0)
  |> fill(column: "cd.cu.rdbg.net", value: 850.0)
  |> fill(column: "6.cd.ct.rdbg.net", value: 850.0)
  |> fill(column: "6.cd.cm.rdbg.net", value: 850.0)
  |> fill(column: "6.cd.cu.rdbg.net", value: 850.0)
  |> rename(columns: {
      "6.cd.ct.rdbg.net": "ping_ctv6",
      "6.cd.cm.rdbg.net": "ping_cmv6",
      "6.cd.cu.rdbg.net": "ping_cuv6",
      "cd.ct.rdbg.net": "ping_ctv4",
      "cd.cm.rdbg.net": "ping_cmv4",
      "cd.cu.rdbg.net": "ping_cuv4",
  })
  |> keep(columns: ["host", "ping_ctv4", "ping_cmv4", "ping_cuv4", "ping_ctv6", "ping_cmv6", "ping_cuv6"])

loss = from(bucket: "server")
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
  |> fill(column: "cd.ct.rdbg.net", value: 100.0)
  |> fill(column: "cd.cm.rdbg.net", value: 100.0)
  |> fill(column: "cd.cu.rdbg.net", value: 100.0)
  |> fill(column: "6.cd.ct.rdbg.net", value: 100.0)
  |> fill(column: "6.cd.cm.rdbg.net", value: 100.0)
  |> fill(column: "6.cd.cu.rdbg.net", value: 100.0)
  |> rename(columns: {
      "6.cd.ct.rdbg.net": "loss_ctv6",
      "6.cd.cm.rdbg.net": "loss_cmv6",
      "6.cd.cu.rdbg.net": "loss_cuv6",
      "cd.ct.rdbg.net": "loss_ctv4",
      "cd.cm.rdbg.net": "loss_cmv4",
      "cd.cu.rdbg.net": "loss_cuv4",
  })
  |> keep(columns: ["host", "loss_ctv4", "loss_cmv4", "loss_cuv4", "loss_ctv6", "loss_cmv6", "loss_cuv6"])

join(
  tables: {
    ping: ping,
    loss: loss,
  },
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
      return new Response(csvText, {
        headers: { "content-type": "text/csv" },
      });
    } catch (error) {
      return new Response('Internal Server Error', { status: 500 });
    }
  }
  return new Response('Method Not Allowed', { status: 405 });
}
