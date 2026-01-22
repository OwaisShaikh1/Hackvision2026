const { HackvisionClient } = require('../src/sdk/index.cjs');

test('echo returns message', async () => {
  const c = new HackvisionClient();
  const res = await c.echo('x');
  expect(res).toEqual({ ok: true, message: 'x' });
});
