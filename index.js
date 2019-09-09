const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const passport = require("passport");

const passportSetup = require("./config/passport");

const userRouter = require("./routes/user-routes");
const articleRouter = require("./routes/article-routes");
const adminRouter = require("./routes/admin-routes");

const errorController = require("./controllers/errorController");

const app = express();

app.use(helmet());
app.use(express.json({ limit: "10kb" }));

if (process.env.NODE_ENV === "development") {
	app.use(morgan("dev"));
}

app.use(passport.initialize());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/articles", articleRouter);
app.use("/api/v1/admin", adminRouter);

app.all("*", (req, res, next) => {
	// const err = new AppError(`Can't find ${req.originalUrl} on the server!`, 404);
	const err = new Error(`Can't find ${req.originalUrl} on the server!`);
	err.status = "fail";
	err.statusCode = 404;
	next(err);
});

app.use(errorController);

module.exports = app;
