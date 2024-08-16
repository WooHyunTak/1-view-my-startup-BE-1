import express from "express";
import * as comparison from "../controllers/comparisonController.js";

const app = express.Router();

app.get("/", comparison.getComparison);
app.get("/rank/:id", comparison.getCompaniesRank);
app.get("/selections", comparison.getSelections);

export default app;
