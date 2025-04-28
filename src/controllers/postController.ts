import { Request, Response } from "express";
import pool from "../config/db"; // Ваш пул подключений
import { CustomRequest } from "../types/express";

// 1. Создание поста (только для владельцев блога)
export const createPost = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const { title, content, blog_id } = req.body;

    const userId = req.userId;

    const newPost = await pool.query(
      "INSERT INTO posts (title, content, blog_id, author_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, content, blog_id, userId]
    );

    res.status(201).json({ post: newPost.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating post" });
  }
};

// 2. Получить все посты блога по blog_id
export const getAllPosts = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { blogId } = req.params;

  try {
    const posts = await pool.query("SELECT * FROM posts WHERE blog_id = $1", [
      blogId,
    ]);
    res.status(200).json(posts.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching posts" });
  }
};

// 3. Получить пост по ID (с увеличением просмотров)
export const getPostById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { postId } = req.params;

  try {
    // Увеличиваем количество просмотров
    await pool.query("UPDATE posts SET views = views + 1 WHERE id = $1", [
      postId,
    ]);

    const post = await pool.query("SELECT * FROM posts WHERE id = $1", [
      postId,
    ]);

    if (post.rows.length === 0) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    res.status(200).json(post.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching post" });
  }
};

// 4. Обновить пост (только для владельцев блога)
export const updatePost = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  const { postId } = req.params;
  const { title, content, blog_id } = req.body;

  const userId = req.userId;

  try {
    // Сначала получаем существующий пост, чтобы проверить, кто является его автором
    const existingPostResult = await pool.query(
      "SELECT * FROM posts WHERE id = $1",
      [postId]
    );

    if (existingPostResult.rows.length === 0) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const existingPost = existingPostResult.rows[0];

    // Проверка, что автор, переданный в запросе, соответствует автору поста
    if (existingPost.author_id !== userId) {
      res
        .status(403)
        .json({ message: "You are not authorized to update this post" });
      return;
    }

    // Массив для хранения полей, которые нужно обновить
    const fields: string[] = [];
    const values: any[] = [];

    // Динамическое добавление полей для обновления
    if (title) {
      fields.push(`title = $${fields.length + 1}`);
      values.push(title);
    }

    if (content) {
      fields.push(`content = $${fields.length + 1}`);
      values.push(content);
    }

    if (blog_id) {
      fields.push(`blog_id = $${fields.length + 1}`);
      values.push(blog_id);
    }

    // Если нет ни одного поля для обновления, возвращаем ошибку
    if (fields.length === 0) {
      res.status(400).json({ message: "No fields provided to update" });
      return;
    }

    // Добавляем условие для обновления времени
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(postId);

    // Формируем запрос с динамическими параметрами
    const setClause = fields.join(", ");
    const query = `UPDATE posts SET ${setClause} WHERE id = $${values.length} RETURNING *`;

    // Выполнение SQL-запроса
    const updatedPost = await pool.query(query, values);

    if (updatedPost.rows.length === 0) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    res.status(200).json(updatedPost.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating post" });
  }
};

// 5. Удалить пост (только для владельцев блога)
export const deletePost = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  const { postId } = req.params;

  const userId = req.userId;

  try {
    const post = await pool.query("SELECT * FROM posts WHERE id = $1", [
      postId,
    ]);

    if (post.rows[0].author_id != userId) {
      res
        .status(403)
        .json({ message: "You are not authorized to delete this post" });
      return;
    }

    const result = await pool.query(
      "DELETE FROM posts WHERE id = $1 RETURNING *",
      [postId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    res.status(200).json({ message: "Post deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting post" });
  }
};

// 6. Получить посты по дате (по blog_id)
export const getPostsSortedByDate = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { blogId } = req.params;
  const { page = 1 } = req.query; // по умолчанию первая страница
  const limit = 5;
  const offset = (Number(page) - 1) * limit;

  try {
    const posts = await pool.query(
      `SELECT 
        posts.id AS post_id,
        posts.title,
        posts.content,
        posts.created_at,
        posts.updated_at,
        posts.views,
        users.id AS author_id,
        users.username AS author_username,
        users.email AS author_email
      FROM posts
      JOIN users ON posts.author_id = users.id
      WHERE posts.blog_id = $1
      ORDER BY posts.created_at DESC
      LIMIT $2 OFFSET $3`,
      [blogId, limit, offset]
    );
    res.status(200).json(posts.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching posts" });
  }
};

// 7. Получить комментарии для поста
export const getCommentsForPost = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { postId } = req.params;
  const { page = 1 } = req.query;
  const limit = 5;
  const offset = (Number(page) - 1) * limit;

  try {
    const comments = await pool.query(
      `SELECT 
        comments.id AS comment_id,
        comments.content,
        comments.created_at,
        users.id AS user_id,
        users.username,
        users.email
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE comments.post_id = $1
      ORDER BY comments.created_at ASC
      LIMIT $2 OFFSET $3`,
      [postId, limit, offset]
    );
    res.status(200).json(comments.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching comments" });
  }
};
