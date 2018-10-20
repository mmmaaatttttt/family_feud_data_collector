exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable("guesses", {
    id: "id",
    question_id: {
      type: "integer",
      notNull: true,
      references: '"questions"',
      onDelete: "cascade"
    },
    text: { type: "text", notNull: true },
    matching_answer_id: {
      type: "integer",
      references: '"answers"',
      onDelete: "cascade"
    },
  });
};
