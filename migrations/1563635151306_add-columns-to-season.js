exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addColumns("seasons", {
    fast_money_total: {
      type: "integer"
    },
    can_play_or_pass: {
      type: "boolean",
      default: true
    },
    num_seconds_for_fast_money_round_1: {
      type: "integer"
    },
    num_seconds_for_fast_money_round_2: {
      type: "integer"
    },
    num_single_rounds: {
      type: "integer"
    },
    num_double_rounds: {
      type: "integer"
    },
    num_triple_rounds: {
      type: "integer"
    },
    has_sudden_death: {
      type: "boolean"
    },
    num_strikes_for_triple_rounds: {
      type: "integer",
      default: 3
    },
    steal_includes_stolen_answer_points: {
      type: "boolean"
    }
  });
};
