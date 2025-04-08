class CustomParamsError extends Error {
    constructor(error, file, _function) {
        super(error);
        this.statusCode = 403
        this.name = 'ParamsError';
        this.stack = error.stack
        this.code = 'ERR_PARAM'
        this.message = error.message
        this.file = file
        this._function = _function
    }
}

module.exports = { CustomParamsError }