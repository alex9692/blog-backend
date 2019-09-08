const acl = require("express-acl");

let configObject = {
	baseUrl: "api/v1",
	filename: "nacl.json",
	path: "config",
	decodedObjectName: "user"
};

acl.config({
	baseUrl: "api/v1",
	filename: "nacl.json",
	decodedObjectName: "user",
	path: "config",
	denyCallback: res => {
		return res.status(403).json({
			status: "fail",
			message: "You are not authorized to access this resource"
		});
	}
});

module.exports = acl;
