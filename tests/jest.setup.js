const path = require("path");
require("dotenv").config({
  path: path.resolve(process.cwd(), ".env"),
});

require("ts-node").register({
  transpileOnly: true,
  files: true,
});
