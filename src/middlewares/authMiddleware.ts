import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import pool from "../config/db";
import { CustomRequest } from "../types/express";

export const authMiddleware = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      res.status(401).json({ message: "Not authorized" });
    }

    // Верификация токена
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };

    // Проверка существования пользователя
    const user = await pool.query("SELECT id, email FROM users WHERE id = $1", [
      decoded.id,
    ]);

    if (user.rows.length === 0) {
      res.status(401).json({ message: "User not found" });
    }

    req.user = user.rows[0];
    req.userId = user.rows[0].id;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Not authorized" });
  }
};

export const checkBlogOwner = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const { blogId } = req.params;

  const userId = req.userId; // Получаем ID пользователя из токена

  // Проверка, является ли пользователь владельцем блога
  const query = "SELECT * FROM blogs WHERE id = $1 AND owner_id = $2";
  pool.query(query, [blogId, userId], (err, result) => {
    if (err || result.rowCount === 0) {
      return res
        .status(403)
        .json({ message: "You are not the owner of this blog" });
    }
    next();
  });
};

export const checkPostOwner = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const { postId } = req.params;
  const userId = req.userId;

  // Проверка, является ли пользователь автором поста
  const query = "SELECT * FROM posts WHERE id = $1 AND author_id = $2";
  pool.query(query, [postId, userId], (err, result) => {
    if (err || result.rowCount === 0) {
      return res
        .status(403)
        .json({ message: "You are not the author of this post" });
    }
    next();
  });
};

export const checkCommentOwner = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const { commentId } = req.params;
  const userId = req.userId;

  // Проверка, является ли пользователь автором комментария
  const query = "SELECT * FROM comments WHERE id = $1 AND user_id = $2";
  pool.query(query, [commentId, userId], (err, result) => {
    if (err || result.rowCount === 0) {
      return res
        .status(403)
        .json({ message: "You are not the author of this comment" });
    }
    next();
  });
};
