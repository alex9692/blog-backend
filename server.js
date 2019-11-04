const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http");

dotenv.config({ path: "./config.env" });

const dbURILocal = process.env.DATABASE_URI_LOCAL;

mongoose
	.connect(dbURILocal, {
		useNewUrlParser: true,
		useCreateIndex: true,
		useFindAndModify: false
	})
	.then(() => {
		console.log("Database connected successfully");
	});

const app = require("./index");
const server = http.createServer(app);

const port = process.env.PORT || 3000;
server.listen(port, () => {
	console.log("running in port: " + port);
});
