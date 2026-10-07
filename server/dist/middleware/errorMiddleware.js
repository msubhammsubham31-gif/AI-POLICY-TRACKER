"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
function errorHandler(err, req, res, next) {
    console.error('[API Error]:', err);
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            error: 'Validation failed',
            details: err.errors.map(e => ({
                path: e.path.join('.'),
                message: e.message,
            })),
        });
    }
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
        error: message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
}
