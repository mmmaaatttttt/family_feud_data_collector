exports.shorthands = undefined;

exports.up = pgm => {
  pgm.renameColumn("episodes", "first_team_id", "left_team_id");
  pgm.renameColumn("episodes", "second_team_id", "right_team_id");
};
