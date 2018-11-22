const db = require("../db");

class Host {
  constructor({ id, first_name, last_name }) {
    this.id = id;
    this.first_name = first_name;
    this.last_name = last_name;
  }

  static async create(first_name, last_name) {
    const result = await db.query(`
      INSERT INTO hosts (first_name, last_name) VALUES ($1, $2) RETURNING *
    `, [first_name, last_name]);
    let newHost = result.rows[0];
    return new Host(newHost);
  }
}

module.exports = Host;
