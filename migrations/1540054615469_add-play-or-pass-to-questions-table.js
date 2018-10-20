exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addColumns("questions", {
    team_decides_to_play: {
      type: "boolean",
      notNull: true,
      default: true
    }
  });
};
