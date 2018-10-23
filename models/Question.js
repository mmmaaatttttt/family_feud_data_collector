class Question {
  constructor({
    id,
    episode_id,
    text,
    order,
    round_type,
    team_decides_to_play
  }) {
    this.id = id;
    this.episode_id = episode_id;
    this.text = text;
    this.order = order;
    this.round_type = round_type;
    this.team_decides_to_play = team_decides_to_play;
  }

  static async create(dataObj) {
    const result = await db.query(`
      INSERT INTO episodes (
        episode_id,
        text,
        order,
        round_type,
        team_decides_to_play
      )
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [
      dataObj.episode_id,
      dataObj.text,
      dataObj.order,
      dataObj.round_type,
      dataObj.team_decides_to_play
    ]);
    let newQuestion = result.rows[0];
    return new Question(newQuestion);
  }
}

module.exports = Question;
