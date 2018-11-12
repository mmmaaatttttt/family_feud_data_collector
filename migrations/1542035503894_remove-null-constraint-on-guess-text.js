exports.shorthands = undefined;

exports.up = pgm => {
  pgm.alterColumn("guesses", "text", {
    notNull: false
  });
};
