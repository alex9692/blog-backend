const errorHandler = (message, status, statusCode) => {
	const err = new Error(message);
	err.statusCode = statusCode;
	err.status = status;
	return err;
};

module.exports = errorHandler;
