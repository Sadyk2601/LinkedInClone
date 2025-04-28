import { Router } from "express";
import {
  createComment,
  updateComment,
  deleteComment,
} from "../controllers/commentController";

const router = Router();

router.post("/create", createComment);

router.post("/update/:commentId", updateComment);

router.delete("/delete/:commentId", deleteComment);

export default router;
