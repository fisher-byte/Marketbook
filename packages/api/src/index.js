require('dotenv').config();
const app = require('./app');
const { initDb } = require('./config/database');
const PORT = process.env.PORT || 3000;

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Marketbook API running at http://localhost:${PORT}`);
  });
}
start().catch((e) => {
  console.error(e);
  process.exit(1);
});
