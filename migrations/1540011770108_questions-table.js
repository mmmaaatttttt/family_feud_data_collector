exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable("questions", {
    id: "id",
    episode_id: {
      type: "integer",
      notNull: true,
      references: '"episodes"',
      onDelete: "cascade"
    },
    text: { type: "text", notNull: true },
    order: { type: "integer", notNull: true },
    round_type: { type: "text", default: "single" }
  });
  pgm.addConstraint(
    "questions",
    "round_types",
    "CHECK (round_type IN ('single', 'double', 'triple', 'fast_money'))"
  );
};
