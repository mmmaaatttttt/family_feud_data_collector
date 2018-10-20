exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable("episodes", {
    id: "id",
    episode_number: { type: "integer", notNull: true, unique: true },
    title: { type: "text", notNull: true }
  });
};

