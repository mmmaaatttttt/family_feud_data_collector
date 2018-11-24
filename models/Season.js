const { prompt, choose } = require("promptly");
const db = require("../db");
const Host = require("./Host");

class Season {
  constructor ({ season_num, host_id }) {
    this.season_num = season_num;
    this.host_id = host_id;
  }

  static async create(season_num, host_id) {
    const result = await db.query(`
      INSERT INTO seasons (season_num, host_id) VALUES ($1, $2) RETURNING *
    `, [season_num, host_id]);
    let newSeason = result.rows[0];
    return new Season(newSeason);
  }

  static async findOrCreate(season_num) {
    const result = await db.query(`
      SELECT * FROM seasons WHERE season_num = $1
    `, [season_num]);
    if (result.rows[0]) return new Season(result.rows[0]);
    let hosts = await Host.findAll();
    let hostSelectMessage = `This appears to be a new season. Please select the host for the season.\n`
    hosts.forEach(host => {
      hostSelectMessage += `${host.id}: ${host.fullName}\n`;
    });
    hostSelectMessage += "Enter the team's id if you've found id here.\nOtherwise, hit enter and I'll ask you about the new host."
    let host_id = +(await choose(hostSelectMessage, hosts.map(h => h.id).concat(""), {
      default: ""
    }));
    if (!host_id) {
      let hostFullName = await prompt("Please enter the first and last name of the host (space separated).")
      let names = hostFullName.split(" ");
      let newHost = await Host.create(...names);
      host_id = newHost.id;
    }
    let newSeason = await Season.create(season_num, host_id);
    return newSeason;
  }
}

module.exports = Season;
