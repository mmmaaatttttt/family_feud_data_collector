exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addColumns("questions", {
    deciding_team_id: {
      type: "integer",
      references: '"teams"'
    },
    winning_team_id: {
      type: "integer",
      references: '"teams"'
    }
  });

  pgm.alterColumn("questions", "team_decides_to_play", {
    notNull: false
  });
};
