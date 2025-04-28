import { Router } from "express";
import {
  createComment,
  updateComment,
  deleteComment,
} from "../controllers/commentController";

import {
  authMiddleware,
  checkCommentOwner,
} from "../middlewares/authMiddleware";

const router = Router();

router.post("/create", authMiddleware, createComment);

router.post(
  "/update/:commentId",
  authMiddleware,
  checkCommentOwner,
  updateComment
);

router.delete(
  "/delete/:commentId",
  authMiddleware,
  checkCommentOwner,
  deleteComment
);

export default router;
