import { Router } from "express";
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  getPostsSortedByDate,
  getCommentsForPost,
} from "../controllers/postController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// 1. Создание поста
router.post("/create", authMiddleware, createPost);

// 2. Получить все посты блога по blog_id
router.get("/get-all/:blogId", getAllPosts);

// 3. Получить пост по ID (с увеличением просмотров)
router.get("/:postId", getPostById);

// 4. Обновить пост
router.post("/:postId", authMiddleware, updatePost);

// 5. Удалить пост
router.delete("/delete/:postId", authMiddleware, deletePost);

// 6. Получить посты, отсортированные по дате
router.get("/sort-by-date/:blogId", getPostsSortedByDate);

// 7. Получить комментарии для поста
router.get("/:postId/get-comments", getCommentsForPost);

export default router;
