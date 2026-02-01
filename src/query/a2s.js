const dgram = require('dgram');

function u8(n) { return Buffer.from([n & 0xff]); }
function u16le(n) { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; }
function u32le(n) { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0); return b; }

function readCString(buf, offset) {
    let end = offset;
    while (end < buf.length && buf[end] !== 0x00) end++;
    const str = buf.slice(offset, end).toString('utf8');
    return { str, next: end + 1 };
}

function withTimeout(promise, ms, label = 'timeout') {
    let t;
    const timeout = new Promise((_, rej) => {
        t = setTimeout(() => rej(new Error(label)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

function sendUdp({ host, port, payload, timeoutMs = 1500 }) {
    return withTimeout(new Promise((resolve, reject) => {
        const sock = dgram.createSocket('udp4');
        const onError = (err) => {
            try { sock.close(); } catch (_) { }
            reject(err);
        };
        sock.once('error', onError);

        sock.send(payload, port, host, (err) => {
            if (err) return onError(err);
        });

        sock.once('message', (msg) => {
            try { sock.close(); } catch (_) { }
            resolve(msg);
        });
    }), timeoutMs);
}

// A2S_INFO: https://developer.valvesoftware.com/wiki/Server_queries#A2S_INFO
async function a2sInfo({ host, port, timeoutMs = 1500 }) {
    const header = Buffer.from([0xff, 0xff, 0xff, 0xff]);
    const query = Buffer.from('TSource Engine Query\0', 'utf8');
    const payload = Buffer.concat([header, u8(0x54), query]);

    const res = await sendUdp({ host, port, payload, timeoutMs });

    // Expected: 0xFFFFFFFF 0x49 ...
    if (res.length < 6) throw new Error('short_response');
    if (res.readInt32LE(0) !== -1) throw new Error('bad_header');
    const type = res[4];
    if (type !== 0x49) throw new Error(`unexpected_type_${type}`);

    let off = 5;
    const protocol = res[off]; off += 1;

    const name = readCString(res, off); off = name.next;
    const map = readCString(res, off); off = map.next;
    const folder = readCString(res, off); off = folder.next;
    const game = readCString(res, off); off = game.next;

    const id = res.readUInt16LE(off); off += 2;
    const players = res[off]; off += 1;
    const maxPlayers = res[off]; off += 1;
    const bots = res[off]; off += 1;

    const serverType = String.fromCharCode(res[off]); off += 1; // 'd' 'l'
    const environment = String.fromCharCode(res[off]); off += 1; // 'w' 'l' 'm'
    const visibility = res[off]; off += 1;
    const vac = res[off]; off += 1;

    const version = readCString(res, off); off = version.next;

    return {
        protocol,
        name: name.str,
        map: map.str,
        folder: folder.str,
        game: game.str,
        id,
        players,
        maxPlayers,
        bots,
        serverType,
        environment,
        visibility,
        vac,
        version: version.str
    };
}

// A2S_PLAYER flow: send A2S_PLAYER with challenge 0xFFFFFFFF, receive challenge, resend with challenge
async function a2sPlayer({ host, port, timeoutMs = 1500 }) {
    const header = Buffer.from([0xff, 0xff, 0xff, 0xff]);

    const makeReq = (challengeInt32LE) =>
        Buffer.concat([header, u8(0x55), u32le(challengeInt32LE)]);

    // first request with -1
    let res = await sendUdp({ host, port, payload: makeReq(0xffffffff), timeoutMs });

    if (res.length < 6) throw new Error('short_response');
    if (res.readInt32LE(0) !== -1) throw new Error('bad_header');

    const type = res[4];

    // Challenge response is 0x41
    if (type === 0x41) {
        // bytes 5..8 challenge (int32le)
        if (res.length < 9) throw new Error('bad_challenge');
        const challenge = res.readInt32LE(5);

        // re-send with challenge
        res = await sendUdp({ host, port, payload: makeReq(challenge >>> 0), timeoutMs });
        if (res.length < 6) throw new Error('short_response_2');
        if (res.readInt32LE(0) !== -1) throw new Error('bad_header_2');
    }

    // Expected final response type 0x44
    if (res[4] !== 0x44) throw new Error(`unexpected_player_type_${res[4]}`);

    let off = 5;
    const numPlayers = res[off]; off += 1;

    const players = [];
    for (let i = 0; i < numPlayers; i++) {
        const index = res[off]; off += 1;
        const name = readCString(res, off); off = name.next;
        const score = res.readInt32LE(off); off += 4;
        const duration = res.readFloatLE(off); off += 4;

        players.push({ index, name: name.str, score, duration });
        if (off >= res.length) break;
    }

    return players;
}

module.exports = { a2sInfo, a2sPlayer };