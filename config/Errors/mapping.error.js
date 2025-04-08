class TicketMappingError extends Error {
    constructor({message, error = null, file = '', _function = ''}) {
        super(message);
        this.name = 'TicketMappingError';
        this.code = 'TicketCouldntBeCreated';
        if (error) {
            this.stack = error.stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }

        this.file = file;
        this._function = _function;
    }
}

module.exports = { TicketMappingError };
