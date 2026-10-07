import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import auth from "./routes/auth.js";
import donors from "./routes/donors.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json({ limit: "10kb" }));
app.use("/api/auth", auth);
app.use("/api/donors", donors);
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error. Thodi der baad try karo." });
});

await mongoose.connect(process.env.MONGO_URI);
app.listen(process.env.PORT || 5000, () => console.log("API ready"));
