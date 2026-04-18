const mysql = require('mysql2/promise');
const config = require('./config')
const pool = mysql.createPool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  charset: config.DB_CHARSET,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}
module.exports = { query };