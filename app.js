import express from "express";
import companyController from "./controllers/companyController.js";
import comparisonController from "./controllers/comparisonController.js";
import investmentController from "./controllers/investmentController.js";
import { PORT } from "./env";
import { core } from "core";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(core());
app.use(express.json());

app.use("/companyController", companyController);
app.use("/comparisonController", comparisonController);
app.use("/investmentController", investmentController);

app.use((err, req, res, next) => {
  console.log(err);
  if (err.name === "ValidationError") {
    res.status(400).send({ message: err.message });
  } else {
    res.status(500).send({ message: "internal server error" });
  }
});

app.listen(PORT, () => console.log("Server Started"));
