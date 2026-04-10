import express from "express";
import morgan from "morgan";

const app = express();

// Middleware
app.use(express.json());
app.use(morgan("tiny"));

// Routes
// TODO: add routes

// Errors
// TODO: add error fallback routes

export default app;
