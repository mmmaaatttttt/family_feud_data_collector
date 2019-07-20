exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addColumns("seasons", {
    first_to_300_points_wins: {
      type: "boolean",
      default: true
    }
  });
};
