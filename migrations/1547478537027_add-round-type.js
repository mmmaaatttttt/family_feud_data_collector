exports.shorthands = undefined;

exports.up = pgm => {
  pgm.dropConstraint("questions", "round_types");
  pgm.addConstraint(
    "questions",
    "round_types",
    "CHECK (round_type IN ('single', 'double', 'triple', 'fast_money', 'sudden_death'))"
  );
};
