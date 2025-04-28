import { Request } from "express";

export interface CustomRequest extends Request {
  userId?: number;
  user?: {
    id: string;
    username: string;
    email: string;
  };
}
