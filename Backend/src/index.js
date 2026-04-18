import { connectDB } from "./db/index.js";
import { migrateLegacyDonarRequests } from "./utils/migrateDonarRequests.js";
import http from "http";
import app from "./app.js";
import SocketService from "./socket/index.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const socketService = new SocketService();
socketService.io.attach(server);
socketService.initListener();
app.set("io", socketService.io);

connectDB()
    .then(async () => {
        await migrateLegacyDonarRequests().catch((e) => console.error("[migrateDonarRequests]", e.message));
        server.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });