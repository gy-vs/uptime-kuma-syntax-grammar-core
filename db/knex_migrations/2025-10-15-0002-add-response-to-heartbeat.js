exports.up = function (knex) {
    // Add new column to table heartbeat for the gzip + base64 encoded response body
    return knex.schema.alterTable("heartbeat", function (table) {
        table.text("response").nullable().defaultTo(null);
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("heartbeat", function (table) {
        table.dropColumn("response");
    });
};
