/* SQL:
ALTER TABLE heartbeat ADD response TEXT;
*/
exports.up = function (knex) {
    // Add the response column, it stores the response body gzip compressed and base64 encoded
    return knex.schema.alterTable("heartbeat", function (table) {
        table.text("response").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("heartbeat", function (table) {
        table.dropColumn("response");
    });
};
