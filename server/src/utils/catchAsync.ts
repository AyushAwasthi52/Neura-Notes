import { Request, Response, NextFunction } from "express";

function catchAsync(fn: Function): Function {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export default catchAsync;