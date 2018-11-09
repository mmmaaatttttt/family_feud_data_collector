exports.shorthands = undefined;

exports.up = pgm => {
  pgm.dropConstraint("episodes", "episodes_episode_number_key");
};
