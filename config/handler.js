const { CustomAxiosError } = require( "./Errors/axios.error" );
require("dotenv").config();
const DEFAULT_CODE = "E_DEFAULT";

exports.handlerErrors = (error, req, res, next) => {
  let statusCode = error.statusCode || 500;

  const formattedError = error.isAxiosError
    ? new CustomAxiosError(error, "error.file", "error._function")
    : error;

  const logData = {
    type: "error",
    file: formattedError.file || "unknown",
    headers: formattedError.headers || {},
    _function: formattedError._function || "unknown",
    message: formattedError.message || "Unknown error",
    data: formattedError.stack || {},
  };


  const responseData = {
    userMessage: `${formattedError.name || "Error"} | ${
      formattedError.message
    }`,
    internalMessage: "ERROR CATALOG: " + (formattedError.code || DEFAULT_CODE),
    moreInfo:
      process.env.NODE_ENV === "local"
        ? formattedError.stack
        : `${formattedError._function} | Revisar logs del sistema para más detalle`,
  };

  res.status(statusCode).send(responseData);
};
