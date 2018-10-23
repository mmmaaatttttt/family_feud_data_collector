exports.shorthands = undefined;

exports.up = pgm => {
  pgm.dropColumns("guesses", ["team_id"]);
};