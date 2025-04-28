import { Request, Response } from "express";
import pool from "../config/db";

// Cоздать коммент
export const createComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { post_id, user_id, content } = req.body;

  try {
    const newComment = await pool.query(
      "INSERT INTO comments (post_id, user_id, content, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *",
      [post_id, user_id, content]
    );

    res.status(201).json(newComment.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating comment" });
  }
};

// Обновить коомент
export const updateComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { commentId } = req.params;
  const { content } = req.body;

  try {
    const updatedComment = await pool.query(
      "UPDATE comments SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [content, commentId]
    );

    if (updatedComment.rows.length === 0) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    res.status(200).json(updatedComment.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating comment" });
  }
};

// Удалить коммент
export const deleteComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { commentId } = req.params;

  try {
    const deletedComment = await pool.query(
      "DELETE FROM comments WHERE id = $1 RETURNING *",
      [commentId]
    );

    if (deletedComment.rows.length === 0) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting comment" });
  }
};
