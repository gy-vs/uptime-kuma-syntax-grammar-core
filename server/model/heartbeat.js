const { BeanModel } = require("redbean-node/dist/bean-model");
const zlib = require("zlib");
const { promisify } = require("util");

const gzipAsync = promisify(zlib.gzip);
const gunzipAsync = promisify(zlib.gunzip);

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
     * Return an object that ready to parse to JSON
     * @param {object} options Serialization options
     * @param {boolean} options.includeResponse Include the decoded response body as "response"
     * @returns {object} Object ready to parse
     */
    toJSON(options = {}) {
        const json = {
            monitorID: this._monitorId,
            status: this._status,
            time: this._time,
            msg: this._msg,
            ping: this._ping,
            important: this._important,
            duration: this._duration,
            retries: this._retries,
        };

        // Decoded response, keep being omitted by default for backwards compatibility
        if (options.includeResponse) {
            json.response = Heartbeat.decodeResponse(this._response);
        }

        return json;
    }

    /**
     * Asynchronous variant of toJSON(), the response is decoded from
     * the gzip + base64 encoded value stored in the database.
     * @param {object} options Serialization options
     * @param {boolean} options.includeResponse Include the decoded response body as "response"
     * @returns {Promise<object>} Object ready to parse
     */
    async toJSONAsync(options = {}) {
        const json = this.toJSON();

        if (options.includeResponse) {
            json.response = await Heartbeat.decodeResponseAsync(this._response);
        }

        return json;
    }

    /**
     * Truncate, gzip and base64 encode a response body for storage
     * @param {string} response Response body to store
     * @param {number} maxLength Maximum number of characters to keep
     * @returns {Promise<string|null>} Encoded response body
     */
    static async encodeResponse(response, maxLength) {
        if (response === null || response === undefined) {
            return null;
        }

        let text;
        if (typeof response === "string") {
            text = response;
        } else if (Buffer.isBuffer(response)) {
            text = response.toString("utf8");
        } else {
            try {
                text = JSON.stringify(response);
            } catch (_) {
                text = String(response);
            }
        }

        if (typeof maxLength === "number" && Number.isFinite(maxLength) && maxLength >= 0) {
            text = text.substring(0, maxLength);
        }

        const gzipped = await gzipAsync(Buffer.from(text, "utf8"));
        return gzipped.toString("base64");
    }

    /**
     * Decode a gzip + base64 encoded response body synchronously
     * @param {string|null|undefined} encoded Encoded response body
     * @returns {string|null} Decoded response body
     */
    static decodeResponse(encoded) {
        if (!encoded) {
            return null;
        }

        try {
            return zlib.gunzipSync(Buffer.from(encoded, "base64")).toString("utf8");
        } catch (e) {
            // Be lenient with data that was not stored in the expected format
            try {
                return Buffer.from(encoded, "base64").toString("utf8");
            } catch (_) {
                return null;
            }
        }
    }

    /**
     * Decode a gzip + base64 encoded response body asynchronously
     * @param {string|null|undefined} encoded Encoded response body
     * @returns {Promise<string|null>} Decoded response body
     */
    static async decodeResponseAsync(encoded) {
        if (!encoded) {
            return null;
        }

        try {
            const unzipped = await gunzipAsync(Buffer.from(encoded, "base64"));
            return unzipped.toString("utf8");
        } catch (e) {
            // Be lenient with data that was not stored in the expected format
            try {
                return Buffer.from(encoded, "base64").toString("utf8");
            } catch (_) {
                return null;
            }
        }
    }
}

module.exports = Heartbeat;
