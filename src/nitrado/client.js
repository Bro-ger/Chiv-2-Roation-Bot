/**
 * Minimal Nitrado API client using native fetch (Node 18+).
 * Removes any axios dependency so a fresh clone just works.
 */

class NitradoClient {
  constructor({ token, log }) {
    this.token = token;
    this.log = log;
    this.baseUrl = 'https://api.nitrado.net';
  }

  async request(method, path, { body } = {}) {
    const url = `${this.baseUrl}${path}`;

    const headers = {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/json',
    };

    let payload;
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }

    const res = await fetch(url, {
      method,
      headers,
      body: payload,
    });

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      const err = new Error(`Nitrado API error ${res.status}`);
      err.status = res.status;
      err.url = url;
      err.body = data;
      throw err;
    }

    return data;
  }

  // --- Common endpoints used by this bot ---

  async getGameserver(serviceId) {
    // Nitrado uses: /services/{id}/gameservers
    return this.request('GET', `/services/${serviceId}/gameservers`);
  }

  async updateGameserverSettings(serviceId, settingsPayload) {
    // PUT /services/{id}/gameservers/settings
    return this.request('PUT', `/services/${serviceId}/gameservers/settings`, {
      body: settingsPayload,
    });
  }

  async restartGameserver(serviceId) {
    // POST /services/{id}/gameservers/restart
    return this.request('POST', `/services/${serviceId}/gameservers/restart`);
  }
}

module.exports = { NitradoClient };
