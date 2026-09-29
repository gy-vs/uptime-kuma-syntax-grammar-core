/* SQL:
ALTER TABLE monitor ADD save_error_response BOOLEAN default true not null;
ALTER TABLE monitor ADD save_success_response BOOLEAN default false not null;
ALTER TABLE monitor ADD response_max_length INTEGER default 10240 not null;
*/
exports.up = function (knex) {
    // Add new columns to table monitor for configurable HTTP response body saving
    return knex.schema.alterTable("monitor", function (table) {
        table.boolean("save_error_response").defaultTo(true).notNullable();
        table.boolean("save_success_response").defaultTo(false).notNullable();
        table.integer("response_max_length").defaultTo(10240).notNullable();
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("monitor", function (table) {
        table.dropColumn("save_error_response");
        table.dropColumn("save_success_response");
        table.dropColumn("response_max_length");
    });
};
