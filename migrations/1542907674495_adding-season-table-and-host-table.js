exports.up = pgm => {
  pgm.createTable("hosts", {
    id: "id",
    first_name: { type: "text", notNull: true, default: "Steve" },
    last_name: { type: "text", notNull: true, default: "Harvey" }
  });

  pgm.createTable("seasons", {
    season_num: {
      type: "integer",
      primaryKey: true
    },
    host_id: {
      type: "integer",
      notNull: true,
      references: '"hosts"',
      onDelete: "cascade"
    }
  });
};