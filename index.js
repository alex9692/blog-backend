const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const passport = require("passport");

require("./config/passport");

const userRouter = require("./routes/user-routes");
const articleRouter = require("./routes/article-routes");
const adminRouter = require("./routes/admin-routes");
const reviewRouter = require("./routes/review-routes");

const errorController = require("./controllers/errorController");
const errorHandler = require("./config/errorHandler");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));

if (process.env.NODE_ENV === "development") {
	app.use(morgan("dev"));
}

app.use(passport.initialize());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/articles", articleRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/reviews", reviewRouter);

app.all("*", (req, res, next) => {
	// const err = new AppError(`Can't find ${req.originalUrl} on the server!`, 404);
	// const err = new Error();
	// err.status = "fail";
	// err.statusCode = 404;

	return next(
		errorHandler(`Can't find ${req.originalUrl} on the server!`, "fail", 404)
	);
});

app.use(errorController);

module.exports = app;
