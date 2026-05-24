import APIFeatures from "../utils/APIFeatures.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { Request, Response, NextFunction } from "express";

const deleteOne: Function = (Model: any) => {
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
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

const updateOne: Function = (Model: any) => {
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
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

const createOne: Function = (Model: any) => {
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Model.create(req.body);

    res.status(204).json({
      status: "Success",
      data: doc,
    });
  });
};

const getOne: Function = (Model: any) => {
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Model.findById(req.params.id);

    res.status(204).json({
      status: "Success",
      data: doc,
    });
  });
};

const getAll: Function = (Model: any) => {
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
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
