exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addColumns("episodes", {
    season: {
      type: "integer",
      notNull: true
    },
    air_date: {
      type: "date",
      notNull: true
    }
  });
};
