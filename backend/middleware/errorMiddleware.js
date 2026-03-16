const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHandler = (err, req, res, next) => {
    // Express 5 may set err.status or err.statusCode
    const statusCode = err.status || err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
    res.status(statusCode);
    res.json({
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { notFound, errorHandler };

