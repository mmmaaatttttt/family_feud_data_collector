exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addColumns("teams", {
    city: {
      type: "string"
    },
    state: {
      type: "string"
    }
  });
};
