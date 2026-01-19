export async function queryInflux(env, influxQl) {
  const influxDbHost = env.INFLUXDB_HOST;
  const influxDbToken = env.INFLUXDB_TOKEN;
  const influxDbOrg = env.INFLUXDB_ORG;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  const queryUrl = new URL(`https://${influxDbHost}/api/v2/query?org=${influxDbOrg}&t=${Date.now()}`);
  const response = await fetch(queryUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${influxDbToken}`,
      'Content-Type': 'application/vnd.flux',
    },
    body: influxQl,
  });
  if (!response.ok) throw new Error(`fetch CSV failed: ${response.status} ${response.statusText}`);
  const csvText = await response.text();
  const headers = corsHeaders;
  headers['Content-Type'] = 'text/csv';
  return new Response(csvText, {
    headers: headers,
  });
}
