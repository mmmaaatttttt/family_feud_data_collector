exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable("teams", {
    id: "id",
    name: {
      type: "text",
      notNull: true
    }
  });

  pgm.addColumns("episodes", {
    first_team_id: {
      type: "integer",
      notNull: true,
      references: '"teams"'
    },
    second_team_id: {
      type: "integer",
      notNull: true,
      references: '"teams"'
    }
  });

  pgm.addColumns("guesses", {
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
