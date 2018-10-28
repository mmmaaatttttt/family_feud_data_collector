exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addColumns("answers", {
    order: {
      type: "integer"
    },
  });
};
