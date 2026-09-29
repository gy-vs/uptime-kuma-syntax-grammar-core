const { BeanModel } = require("redbean-node/dist/bean-model");
const { promisify } = require("util");
const zlib = require("zlib");

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * Encode a response body for storage in heartbeat.response:
 * the text is gzip compressed and then base64 encoded.
 * @param {string|null|undefined} text Decoded response body
 * @returns {Promise<string|null>} gzip + base64 encoded response body
 */
async function encodeResponse(text) {
    if (text === null || text === undefined || text === "") {
        return null;
    }

    const compressed = await gzip(Buffer.from(String(text), "utf-8"));
    return compressed.toString("base64");
}

/**
 * Decode a heartbeat.response value (base64 encoded gzip data) back to text.
 * Returns null if there is no stored response or it cannot be decoded.
 * @param {string|null|undefined} encoded gzip + base64 encoded response body
 * @returns {Promise<string|null>} Decoded response body
 */
async function decodeResponse(encoded) {
    if (!encoded) {
        return null;
    }

    try {
        const compressed = Buffer.from(encoded, "base64");
        const decompressed = await gunzip(compressed);
        return decompressed.toString("utf-8");
    } catch (e) {
        return null;
    }
}

/**
 * status:
 *      0 = DOWN
 *      1 = UP
 *      2 = PENDING
 *      3 = MAINTENANCE
 */
class Heartbeat extends BeanModel {
    /**
     * Return an object that ready to parse to JSON for public
     * Only show necessary data to public
     * @returns {object} Object ready to parse
     */
    toPublicJSON() {
        return {
            status: this.status,
            time: this.time,
            msg: "", // Hide for public
            ping: this.ping,
        };
    }

    /**
     * Return an object that ready to parse to JSON.
     *
     * The stored response is gzip compressed and base64 encoded, therefore the
     * response body is intentionally not included here for backwards
     * compatibility and to keep payloads small. Use {@link toJSONAsync} with
     * includeResponse = true when the decoded response is required
     * (e.g. for notifications).
     * @returns {object} Object ready to parse
     */
    toJSON() {
        return {
            monitorID: this._monitorId,
            status: this._status,
            time: this._time,
            msg: this._msg,
            ping: this._ping,
            important: this._important,
            duration: this._duration,
            retries: this._retries,
        };
    }

    /**
     * Asynchronous variant of toJSON() which can additionally include the
     * decoded response body.
     * @param {boolean} includeResponse Decode and include the response body?
     * @returns {Promise<object>} Object ready to parse
     */
    async toJSONAsync(includeResponse = false) {
        let result = this.toJSON();

        if (includeResponse) {
            result.response = await decodeResponse(this._response);
        }

        return result;
    }
}

module.exports = Heartbeat;
module.exports.encodeResponse = encodeResponse;
module.exports.decodeResponse = decodeResponse;
