import { Router } from "express";
import {
  createBlog,
  getMyBlogs,
  getMyJoinedBlogs,
  getBlogInfo,
  updateBlog,
  deleteBlog,
  searchBlogs,
  joinBlog,
  leaveBlog,
  getBlogUsers,
} from "../controllers/blogController";
import { authMiddleware } from "../middlewares/authMiddleware"; // Аутентификация пользователя

const router = Router();

// Применяем middleware для защиты роутов, требующих аутентификации
router.post("/create", authMiddleware, createBlog);
router.get("/get-my-blogs", authMiddleware, getMyBlogs);
router.get("/get-my-joined-blogs", authMiddleware, getMyJoinedBlogs as any);
router.get("/get-blog-info/:id", authMiddleware, getBlogInfo as any);
router.post("/update", authMiddleware, updateBlog as any);
router.delete("/delete/:id", authMiddleware, deleteBlog as any);
router.get("/search", authMiddleware, searchBlogs);
router.post("/join-blog", authMiddleware, joinBlog as any);
router.post("/leave-blog", authMiddleware, leaveBlog);
router.get("/get-users", authMiddleware, getBlogUsers);

export default router;
