// import "express-async-errors";
import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import { authMiddleware } from "./middlewares/authMiddleware";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);

// // Protected route example
// app.get("/api/protected", authMiddleware, (req, res) => {
//   res.json({ message: "Protected data", user: req.user });
// });

// Error handling
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something broke!" });
  }
);

export default app;
