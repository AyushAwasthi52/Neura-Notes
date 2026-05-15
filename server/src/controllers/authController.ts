import { JwtPayload, SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import userModel from "../models/userModel.js";

const signToken: Function = (id: number): string => {
  const secretKey: string = process.env.JWT_KEY || "default_fallback_secret";
  const expiresIn: string = process.env.JWT_EXPIRE || "1d";

  return jwt.sign({ id }, secretKey, {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  });
};

const createSendToken: Function = (user, statusCode, res) => {

}