import express from "express";
import cors from "cors";
import { connectDB } from "./db/index.js";
import authRouter from "./routes/auth.routes.js";
const app = express();

app.use(cors());
app.use(express.json());

app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error(err);
        res.status(503).json({
            status: false,
            message: "Database unavailable",
        });
    }
});

app.get("/", (req, res) => {
  res.send("Hello World");
});


// Routes
app.use("/api/v1/auth", authRouter);

export default app;