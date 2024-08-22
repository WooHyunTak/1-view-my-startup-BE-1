import express from "express";
import * as comparison from "../controllers/comparisonController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const app = express.Router();

app.post("/", asyncHandler(comparison.getComparison));
app.get("/rank/:id", asyncHandler(comparison.getCompaniesRank));
app.get("/selections", asyncHandler(comparison.getSelections));
app.get("/status", asyncHandler(comparison.getComparisonStatus));
app.patch("/comparison-counts", asyncHandler(comparison.fetchCompanyCounts));

export default app;
