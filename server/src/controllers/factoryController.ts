import APIFeatures from "../utils/APIFeatures.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { Model, Document} from "mongoose";

type MongooseDoc = Document & {
  createdAt?: Date;
};

const deleteOne = <T extends MongooseDoc>(Model: Model<T>,) : RequestHandler => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError("No document found by ID", 404));
    }

    res.status(204).json({
      status: "Success",
      data: null,
    });
  });
};

const updateOne = <T extends MongooseDoc>(Model: Model<T>,) : RequestHandler => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) return next(new AppError("No document found by ID", 404));

    res.status(204).json({
      status: "Success",
      data: doc,
    });
  });
};

const createOne = <T extends MongooseDoc>(Model: Model<T>,) : RequestHandler => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Model.create(req.body);

    res.status(204).json({
      status: "Success",
      data: doc,
    });
  });
};

const getOne = <T extends MongooseDoc>(Model: Model<T>,) : RequestHandler => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Model.findById(req.params.id);

    res.status(204).json({
      status: "Success",
      data: doc,
    });
  });
};

const getAll = <T extends MongooseDoc>(Model: Model<T>,) : RequestHandler => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let filter = {};
    const features = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination();
    const Models = await features.query;
    res.status(200).json({
      status: "Success",
      results: Models.length,
      data: {
        Models,
      },
    });
  });
};

export { deleteOne, updateOne, createOne, getOne, getAll };
