import cors from "cors";
import express from "express";
import "dotenv/config";

import router from './routes/index.js'
const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors("*"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api-v1", router)

app.get("/", (req, res) => {
  res.send("Expense Tracker App");
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
