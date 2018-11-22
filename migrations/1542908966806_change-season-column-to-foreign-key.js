exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addConstraint("episodes", "episodes_season_fkey", {
    foreignKeys: {
      columns: "season",
      references: '"seasons"',
      onDelete: "cascade"
    }
  });
};
