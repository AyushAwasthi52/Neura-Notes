class AppError extends Error {
  statusCode: number = 0;
  status: string = "";
  isOperational: boolean = false;
  constructor(message: string, statuscode: number) {
    super(message);

    this.statusCode = statuscode;
    this.status = `${statuscode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
