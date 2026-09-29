exports.up = function (knex) {
    // Add new columns to table monitor for configurable HTTP response saving
    return knex.schema.alterTable("monitor", function (table) {
        table.boolean("save_error_response").notNullable().defaultTo(true);
        table.boolean("save_successful_response").notNullable().defaultTo(false);
        table.integer("response_max_length").notNullable().defaultTo(10240);
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("monitor", function (table) {
        table.dropColumn("save_error_response");
        table.dropColumn("save_successful_response");
        table.dropColumn("response_max_length");
    });
};
