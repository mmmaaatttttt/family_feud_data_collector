exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addColumns("guesses", {
    person_id: {
      type: "integer",
      references: '"people"',
    },
  });
};
