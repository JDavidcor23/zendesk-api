class CustomError extends Error {
    constructor(error, file, _function) {
        super(error);
        this.name = 'GenericError';
        this.stack = error.stack
        this.code = 'ERR_GENERIC'
        this.message = error.message
        this.file = file
        this._function = _function
    }
}

module.exports = { CustomError }