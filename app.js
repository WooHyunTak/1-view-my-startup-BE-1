import express from "express";
import { Prisma } from "@prisma/client";
import companyRoute from "./routes/companyRoute.js";
import comparisonRoute from "./routes/comparisonRoute.js";
import investmentRoute from "./routes/investmentRoute.js";
import { PORT } from "./env.js";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/companies", companyRoute);
app.use("/api/comparisons", comparisonRoute);
app.use("/api/investments", investmentRoute);

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.name === "ValidationError") {
    res.status(400).send({ message: err.message });
  } else if (
    err.name === "StructError" ||
    err instanceof Prisma.PrismaClientValidationError
  ) {
    res.status(400).send({ message: err.message });
  } else if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2025"
  ) {
    res.status(404).send({ message: err.message });
  } else {
    res.status(500).send({ message: "Internal Server Error" });
  }
});

app.listen(PORT, () => console.log("Server Started"));
