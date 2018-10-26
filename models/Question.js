class Question {
  constructor(obj) {
    this.id = obj.id;
    this.episode_id = obj.episode_id;
    this.text = obj.text;
    this.order = obj.order;
    this.round_type = obj.round_type;
    this.team_decides_to_play = obj.team_decides_to_play;
  }

  static async create(dataObj) {
    const result = await db.query(`
      INSERT INTO questions (
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
