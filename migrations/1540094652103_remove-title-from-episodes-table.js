exports.shorthands = undefined;

exports.up = pgm => {
  pgm.dropColumns("episodes", ["title"]);
};