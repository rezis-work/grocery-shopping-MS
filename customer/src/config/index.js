const dotEnv = require("dotenv");

if (process.env.NODE_ENV === "prod") {
  dotEnv.config();
} else {
  const configFile = process.env.NODE_ENV ? `./.env.${process.env.NODE_ENV}` : `./.env`;
  dotEnv.config({ path: configFile });
}

module.exports = {
  PORT: process.env.PORT,
  DB_URL: process.env.MONGODB_URI,
  APP_SECRET: process.env.APP_SECRET,
};
