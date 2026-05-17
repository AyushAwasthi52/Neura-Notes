import { JwtPayload, SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { CookieOptions, NextFunction, Request, Response } from "express";
import { userModel, userSchema } from "../models/userModel.js";
import { Model, InferSchemaType, HydratedDocument } from "mongoose";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

const signToken: Function = (id: number): string => {
  const secretKey: string = process.env.JWT_KEY || "default_fallback_secret";
  const expiresIn: string = process.env.JWT_EXPIRE || "1d";

  return jwt.sign({ id }, secretKey, {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  });
};

const createSendToken: Function = (
  user: HydratedDocument<InferSchemaType<typeof userSchema>>,
  statusCode: number,
  res: Response,
) => {
  const token: string = signToken(user._id);

  const cookieOptions: CookieOptions = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: false,
  };

  if ((process.env.NODE_ENV = "production")) cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password)
      return next(new AppError("Please Provide an email and a password", 400));

    const user = await userModel.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError("Incorrect email or password", 401));
    }

    createSendToken(user, 201, res);
  },
);

const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const newUser = await userModel.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });
  },
);
