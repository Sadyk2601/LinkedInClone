import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db";
import config from "../config/config";

interface User {
  id: string;
  username: string;
  email: string;
  password: string;
}

// Регистрация нового пользователя
export const register = async (
  req: Request<{}, {}, { username: string; email: string; password: string }>,
  res: Response
): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    if (!email || !password || !username) {
      res.status(400).json({
        message: "Missing required fields",
        fields: ["username", "email", "password"],
      });
      return;
    }

    // Проверка, существует ли уже пользователь с таким email
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userExists.rows.length > 0) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание нового пользователя
    const newUser = await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email",
      [username, email, hashedPassword]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Registration error" });
  }
};

// Логин пользователя
export const login = async (
  req: Request<{}, {}, { username: string; email: string; password: string }>,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Поиск пользователя по email
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    // Проверка пароля
    const isMatch = await bcrypt.compare(password, user.rows[0].password);

    if (!isMatch) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    // Генерация JWT
    const token = jwt.sign({ id: user.rows[0].id }, config.jwtSecret, {
      expiresIn: parseInt(config.jwtExpire),
    });

    // Установка куки с токеном
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({ message: "Login successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
