const { HackvisionClient } = require('../src/sdk');

(async () => {
  const client = new HackvisionClient({ apiKey: 'demo' });
  const res = await client.echo('hello from SDK');
  console.log(res);
})();
