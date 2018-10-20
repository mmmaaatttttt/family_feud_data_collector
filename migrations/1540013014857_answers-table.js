exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable("answers", {
    id: "id",
    question_id: {
      type: "integer",
      notNull: true,
      references: '"questions"',
      onDelete: "cascade"
    },
    text: { type: "text", notNull: true },
    points: { type: "integer", notNull: true }
  });
};
