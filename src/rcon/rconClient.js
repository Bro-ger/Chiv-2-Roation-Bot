/**
 * RCON varies by game.
 * Chivalry 2 unofficial servers often expose an admin console via the host panel.
 *
 * This file provides a thin abstraction so you can plug in the correct RCON protocol if available.
 * For now, it is implemented as a NO-OP stub that throws unless configured and implemented.
 *
 * If your host exposes a TCP RCON compatible with Source/Valve RCON, you can swap in a library.
 */
class RconClient {
  constructor({ host, port, password, log }) {
    this.host = host;
    this.port = port;
    this.password = password;
    this.log = log;
  }

  async exec(command) {
    // Intentionally not implemented (protocol differs). Keep the interface.
    const err = new Error('RCON is not implemented in this template. See README to wire in your server protocol.');
    err.code = 'RCON_NOT_IMPLEMENTED';
    throw err;
  }
}

module.exports = { RconClient };
