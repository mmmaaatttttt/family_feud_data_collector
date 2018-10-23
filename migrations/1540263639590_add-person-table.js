exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable("people", {
    id: "id",
    first_name: {
      type: "text",
      notNull: true
    },
    order: {
      type: "integer",
      notNull: true
    },
    team_id: {
      type: "integer",
      notNull: true,
      references: '"teams"'
    }
  });
};
