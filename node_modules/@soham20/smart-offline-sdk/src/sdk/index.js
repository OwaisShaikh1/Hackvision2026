class HackvisionClient {
  constructor({ apiKey } = {}) {
    this.apiKey = apiKey || process.env.HACKVISION_API_KEY;
  }

  async echo(message) {
    return { ok: true, message };
  }
}

module.exports = { HackvisionClient };
