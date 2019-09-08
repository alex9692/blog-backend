const express = require("express");
const router = express.Router({ mergeParams: true });

const { passport } = require("../config/passport");
const acl = require("../config/nacl");

const userController = require("../controllers/userController");

router
	.route("/")
	.get(
		passport.authenticate("jwt", { session: false }),
		acl.authorize,
		userController.getAllUsers
	)
	.post(
		passport.authenticate("jwt", { session: false }),
		acl.authorize,
		userController.createUser
	);

router
	.route("/:id")
	.get(
		passport.authenticate("jwt", { session: false }),
		acl.authorize,
		userController.getUser
	)
	.patch(
		passport.authenticate("jwt", { session: false }),
		acl.authorize,
		userController.updateUser
	)
	.delete(
		passport.authenticate("jwt", { session: false }),
		acl.authorize,
		userController.deleteUser
	);

module.exports = router;
