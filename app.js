import express from "express";
import companyRoute from "./routes/companyRoute.js";
import comparisonRoute from "./routes/comparisonRoute.js";
import investmentRoute from "./routes/investmentRoute.js";
import { PORT } from "./env";
import { core } from "core";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(core());
app.use(express.json());

app.use("/api/companies", companyRoute);
app.use("/api/comparisons", comparisonRoute);
app.use("/api/investments", investmentRoute);

app.use((err, req, res, next) => {
  console.log(err);
  if (err.name === "ValidationError") {
    res.status(400).send({ message: err.message });
  } else {
    res.status(500).send({ message: "internal server error" });
  }
});

app.listen(PORT, () => console.log("Server Started"));
