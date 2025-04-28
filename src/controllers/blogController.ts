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
    const { blog_id } = req.params;
    const limit = parseInt(req.query.limit as string, 10) || 5;
    const page = parseInt(req.query.page as string, 10) || 1;
    const offset = (page - 1) * limit;

    if (!blog_id) {
      res.status(400).json({ message: "Blog ID is required" });
      return;
    }

    const result = await pool.query(
      `SELECT 
            blogs.id AS blog_id,
            blogs.title AS blog_title,
            blogs.description AS blog_description,
            blogs.owner_id AS blog_owner_id,
            blogs.created_at AS blog_created_at,
            blogs.updated_at AS blog_updated_at,
            
            posts.id AS post_id,
            posts.title AS post_title,
            posts.content AS post_content,
            posts.author_id AS post_author_id,
            posts.views AS post_views,
            posts.created_at AS post_created_at,
            posts.updated_at AS post_updated_at,
            
            users.username AS author_name
          FROM posts
          INNER JOIN users ON posts.author_id = users.id
          INNER JOIN blogs ON posts.blog_id = blogs.id
          WHERE blogs.id = $1
          ORDER BY posts.created_at DESC
          LIMIT $2 OFFSET $3`,
      [blog_id, limit, offset]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Blog not found or no posts available" });
      return;
    }

    const blogInfo = {
      blog_id: result.rows[0].blog_id,
      title: result.rows[0].blog_title,
      description: result.rows[0].blog_description,
      owner_id: result.rows[0].blog_owner_id,
      created_at: result.rows[0].blog_created_at,
      updated_at: result.rows[0].blog_updated_at,
    };

    const posts = result.rows.map((row) => ({
      id: row.post_id,
      title: row.post_title,
      content: row.post_content,
      author_id: row.post_author_id,
      views: row.post_views,
      created_at: row.post_created_at,
      updated_at: row.post_updated_at,
      author_name: row.author_name,
    }));

    res.status(200).json({ blog: blogInfo, posts });
  } catch (error) {
    console.error("Error in getBlogInfo:", error);
    res.status(500).json({ message: "Error fetching blog and posts" });
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
      `SELECT 
    u.username, 
    u.email, 
    bm.joined_at
  FROM blog_members bm 
  JOIN users u ON bm.user_id = u.id 
  WHERE bm.blog_id = $1;`,
      [blogId]
    );

    res.status(200).json({ users: result.rows });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
