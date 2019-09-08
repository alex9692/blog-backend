const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const passport = require("passport");

const passportSetup = require("./config/passport");

const userRoutes = require("./routes/user-routes");
const articleRoutes = require("./routes/article-routes");
const adminRoutes = require("./routes/admin-routes");

const errorController = require("./controllers/errorController");

const app = express();

app.use(helmet());
app.use(express.json({ limit: "10kb" }));

if (process.env.NODE_ENV === "development") {
	app.use(morgan("dev"));
}

app.use(passport.initialize());

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/articles", articleRoutes);

app.all("*", (req, res, next) => {
	// const err = new AppError(`Can't find ${req.originalUrl} on the server!`, 404);
	const err = new Error(`Can't find ${req.originalUrl} on the server!`);
	err.status = "fail";
	err.statusCode = 404;
	next(err);
});

app.use(errorController);

module.exports = app;
