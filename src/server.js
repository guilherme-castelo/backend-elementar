require("dotenv").config();
const app = require("./app");
const config = require("./config/config");

const http = require("http");
const socketIo = require("./utils/socket");

const server = http.createServer(app);
socketIo.init(server);

server.listen(config.PORT, () => {
  console.log(`Backend MVP running on port ${config.PORT}`);
  console.log("Environment:", process.env.NODE_ENV || "development");
});
// Restart trigger for Prisma Client update
