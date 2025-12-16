import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 4000,
    ssl: { rejectUnauthorized: true }
  });

  try {
    const [profile] = await connection.execute('SELECT * FROM profile LIMIT 1');
    const [skills] = await connection.execute('SELECT * FROM skills');
    const [projects] = await connection.execute('SELECT * FROM projects');

    res.status(200).json({
      profile: profile[0],
      skills: skills,
      projects: projects
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await connection.end();
  }
}