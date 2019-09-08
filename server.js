const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: "./config.env" });
const app = require("./index");

const dbURI = process.env.DATABASE_URI_LOCAL;

mongoose
	.connect(dbURI, {
		useNewUrlParser: true,
		useCreateIndex: true,
		useFindAndModify: false
	})
	.then(() => {
		console.log("Database connected successfully");
	});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
	console.log("running in port: " + port);
});
