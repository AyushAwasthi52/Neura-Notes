import { JwtPayload, SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { CookieOptions, NextFunction, Request, Response } from "express";
import { userModel, userSchema } from "../models/userModel.js";
import { Model, InferSchemaType, HydratedDocument } from "mongoose";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { promisify } from "util";

const secretKey: string = process.env.JWT_KEY || "default_fallback_secret";
const expiresIn: string = process.env.JWT_EXPIRE || "1d";

const signToken: Function = (id: number): string => {
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

const login: Function = catchAsync(
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

const signup: Function = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const newUser = await userModel.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });
  },
);

const logout: Function = (req: Request, res: Response) => {
  res.cookie("jwt", "", {
    expires: new Date(0),
    httpOnly: true,
  });

  res.status(200).json({
    status: "success",
    message: "Logged Out Successfully",
  });
};

const protect: Function = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    )
      token = req.headers.authorization.split(" ")[1];
    else if (req.cookies.jwt) token = req.cookies.jwt;

    if (!token)
      return next(new AppError("You are not logged in log in first", 401));

    const decoded = await promisify(jwt.verify as any)(token, secretKey);

    const freshUser = await userModel.findById(decoded.id);

    if (!freshUser)
      return next(new AppError("The user no longer exists!", 401));

    if (freshUser.changedPasswordAfter(decoded.iat))
      return next(
        new AppError(
          "The user changed password after the toke  was issued",
          401,
        ),
      );

    res.locals.user = freshUser;

    next();
  },
);

const isLoggedIn: Function = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.cookies.jwt) {
      const decoded = await promisify(jwt.verify as any)(
        req.cookies.jwt,
        secretKey,
      );

      const freshUser = await userModel.findById(decoded.id);

      if (!freshUser) return next();

      if (freshUser.changedPasswordAfter(decoded.iat)) return next();

      res.locals.user = freshUser;
    }
    next();
  },
);

export { login, signup, logout, protect, isLoggedIn };
