import express from "express";
import * as investment from "../controllers/investmentController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const app = express.Router();

app.post("/", asyncHandler(investment.createInvestment));
app.patch("/:id", asyncHandler(investment.updateInvestment));
app.delete("/:id", asyncHandler(investment.deleteInvestment));
export default app;
