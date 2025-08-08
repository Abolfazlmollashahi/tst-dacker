const http = require("http")
const app = require("./server");
const { Server } = require("socket.io");
const chatSocket = require("./socket/chatSocket");


const server = http.createServer(app)
const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  chatSocket(io)

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// module.exports = app;