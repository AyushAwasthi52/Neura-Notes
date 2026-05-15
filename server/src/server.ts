import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import type { Request, Response } from "express";

dotenv.config({ path: "./config.env" });

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World with TypeScript!");
});

if (process.env.DATABASE_MONGO != undefined) {
  mongoose
    .connect(process.env.DATABASE_MONGO)
    .then(() => {
      console.log("MongoDB connected successfully.");
    })
    .catch((err) => {
      console.log(err);
    });
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
