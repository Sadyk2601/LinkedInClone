import { Request, Response } from "express";
import pool from "../db/pool"; // Подключение к базе данных
import { CustomRequest } from "../types/express";

// Создание блога
export const createBlog = async (req: CustomRequest, res: Response) => {
  try {
    const { title, description } = req.body;
    const userId = req.userId; // Пользователь, который создает блог

    // Вставка нового блога в базу данных
    const result = await pool.query(
      "INSERT INTO blogs (title, description, owner_id) VALUES ($1, $2, $3) RETURNING id, title, description, owner_id, created_at, updated_at",
      [title, description, userId]
    );

    res.status(201).json({ message: "Blog created", blog: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Получить блоги, принадлежащие текущему пользователю
export const getMyBlogs = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      "SELECT b.*, u.username AS owner_username, u.email AS owner_email FROM blogs b JOIN users u ON b.owner_id = u.id WHERE b.owner_id = $1;",
      [userId]
    );

    res.status(200).json({ blogs: result.rows });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Получить блоги, в которые пользователь вступил
export const getMyJoinedBlogs = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      "SELECT b.* FROM blogs b JOIN blog_members bm ON b.id = bm.blog_id WHERE bm.user_id = $1",
      [userId]
    );

    res.status(200).json({ blogs: result.rows });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Получить информацию о блоге по ID
export const getBlogInfo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT id, title, description, owner_id, created_at, updated_at FROM blogs WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Blog not found" });
      return;
    }

    res.status(200).json({ blog: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Обновить блог (только для владельца)
export const updateBlog = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const { id, title, description } = req.body;
    const userId = req.userId;

    // Проверка, что блог существует и принадлежит текущему пользователю
    const result = await pool.query(
      "SELECT * FROM blogs WHERE id = $1 AND owner_id = $2",
      [id, userId]
    );

    if (result.rows.length === 0) {
      res
        .status(403)
        .json({ message: "You do not have permission to update this blog" });
      return;
    }

    // Обновление блога
    await pool.query(
      "UPDATE blogs SET title = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
      [title, description, id]
    );

    res.status(200).json({ message: "Blog updated", result: result.rows });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Удалить блог (только для владельца)
export const deleteBlog = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Проверка, что блог существует и принадлежит текущему пользователю
    const result = await pool.query(
      "SELECT * FROM blogs WHERE id = $1 AND owner_id = $2",
      [id, userId]
    );

    if (result.rows.length === 0) {
      res
        .status(403)
        .json({ message: "You do not have permission to delete this blog" });
      return;
    }

    // Удаление блога
    await pool.query("DELETE FROM blogs WHERE id = $1", [id]);

    res.status(200).json({ message: "Blog deleted" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Поиск блога по названию
export const searchBlogs = async (req: CustomRequest, res: Response) => {
  try {
    const { title } = req.query;

    const result = await pool.query(
      "SELECT b.*, u.username AS owner_username, u.email AS owner_email, COUNT(bm.user_id) AS members_count FROM blogs b JOIN users u ON b.owner_id = u.id LEFT JOIN blog_members bm ON b.id = bm.blog_id WHERE b.title ILIKE $1 GROUP BY b.id, u.id;",
      [`%${title}%`]
    );

    res.status(200).json({ blogs: result.rows });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Присоединиться к блогу
export const joinBlog = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const { blogId } = req.body;
    const userId = req.userId;

    // Проверка, что пользователь не является уже участником
    const result = await pool.query(
      "SELECT * FROM blog_members WHERE blog_id = $1 AND user_id = $2",
      [blogId, userId]
    );

    if (result.rows.length > 0) {
      res.status(400).json({ message: "User already joined this blog" });
      return;
    }

    // Добавление пользователя в блог
    await pool.query(
      "INSERT INTO blog_members (blog_id, user_id) VALUES ($1, $2)",
      [blogId, userId]
    );

    res.status(200).json({ message: "User joined the blog" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Выйти из блога
export const leaveBlog = async (req: CustomRequest, res: Response) => {
  try {
    const { blogId } = req.body;
    const userId = req.userId;

    // Удаление пользователя из блога
    await pool.query(
      "DELETE FROM blog_members WHERE blog_id = $1 AND user_id = $2",
      [blogId, userId]
    );

    res.status(200).json({ message: "User left the blog" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Получить всех пользователей блога
export const getBlogUsers = async (req: Request, res: Response) => {
  try {
    const { blogId } = req.query;

    const result = await pool.query(
      "SELECT u.username, u.email, bm.role, bm.joined_at SELECT u.username, u.email, bm.joined_at FROM blog_members bm JOIN users u ON bm.user_id = u.id WHERE bm.blog_id = 1; FROM blog_members bm JOIN users u ON bm.user_id = u.id WHERE bm.blog_id = $1;",
      [blogId]
    );

    res.status(200).json({ users: result.rows });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
