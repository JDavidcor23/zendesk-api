const axios = require("axios");

class CustomAxiosError extends axios.AxiosError {
  constructor(error, file, _function) {
    super(error.message);
    this.name = "AxiosError";
    this.file = file;
    this._function = _function;

    if (error?.config) {
      this.requestUrl = error?.config?.url;
      this.method = error?.config?.method;
    }

    if (error?.response) {
      this.status = error?.response?.status;
      this.headers = error?.response?.headers || {};
      this.data = error?.response?.data || {};
    } else if (error?.request) {
      this.message = "No response received from server";
    } else {
      this.message = `Error in setting up request: ${error?.message}`;
    }

    this.code = error?.code || null;
  }
}

module.exports = { CustomAxiosError };
