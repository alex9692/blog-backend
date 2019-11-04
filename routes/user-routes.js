const express = require("express");
const router = express.Router();

const { passport } = require("../config/passport");
const acl = require("../config/nacl");

const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const articleRouter = require("./article-routes");
const reviewRouter = require("./review-routes");

router.use("/:userId/articles", articleRouter);
router.use("/:userId/reviews", reviewRouter);

router.get(
	"/secret",
	passport.authenticate("jwt", { session: false }),
	function(req, res, next) {
		res.json({
			message:
				"Welcome " + req.user.name.split(" ")[0] + "! You are now logged in."
		});
	}
);

// AUTHENTICATE USER
router.post("/signup", authController.signUp);
router.post("/signin", authController.signIn);

// VERIFY ACCOUNT USING OTP
router
	.route("/verify-otp")
	.get(
		passport.authenticate("jwt", { session: false }),
		authController.requestOTP
	)
	.patch(authController.confirmOTP);

// VERIFY ACCOUNT USING EMAIL
router
	.route("/verify-email")
	.get(
		passport.authenticate("jwt", { session: false }),
		authController.verifyEmailStart
	);
router.patch("/verify-email/:token", authController.verifyEmailEnd);

// RECOVER FORGOTTEN PASSWORD USING EMAIL
router.post("/forgot-password", authController.forgotPassword);
router.get('/getUserName/:token', authController.getResetUserName)
router.patch("/reset-password/:token", authController.resetPassword);

// GET LOGGED-IN USER DETAILS
router.get(
	"/getMe",
	passport.authenticate("jwt", { session: false }),
	acl.authorize,
	userController.setMe,
	userController.getUser
);

// UPDATE LOGGED-IN USER DETAILS
router.patch(
	"/update-my-account-data",
	passport.authenticate("jwt", { session: false }),
	userController.updateUserData
);

// UPDATE LOGGED-IN USER PASSWORD
router.patch(
	"/update-my-account-password",
	passport.authenticate("jwt", { session: false }),
	authController.changeMyPassword
);

// DEACTIVATE YOUR ACCOUNT
router.delete(
	"/deactivate-me",
	passport.authenticate("jwt", { session: false }),
	acl.authorize,
	userController.deleteMe
);

// REACTIVATE YOUR ACCOUNT
router.post("/reactivate-me", userController.reactivateMeStart);
router.patch("/reactivate-me/:token", userController.reactivateMeEnd);

// OAUTH RELATED
// router.get(
// 	"/google",
// 	passport.authenticate("google", {
// 		scope: ["profile", "email"]
// 	})
// );

// router.get(
// 	"/google/redirect",
// 	passport.authenticate("google", { session: false }),
// 	(req, res) => {
// 		if (req.user) {
// 			const token = jwt.sign(
// 				{
// 					googleId: req.user.googleID,
// 					email: req.user.email
// 				},
// 				process.env.JWT_SECRET_KEY,
// 				{ expiresIn: 60 * 60 }
// 			);
// 			return res.send({ message: "success", token: token });
// 		}
// 		return res.send({ message: "login with different email!" });
// 	}
// );

// router.get(
// 	"/facebook",
// 	passport.authenticate("facebook", { scope: ["public_profile", "email"] })
// );

// router.get(
// 	"/facebook/redirect",
// 	passport.authenticate("facebook", { session: false }),
// 	(req, res) => {
// 		console.log(req.user);
// 		if (!req.user.err) {
// 			console.log(req.user);
// 			const token = jwt.sign(
// 				{
// 					facebookId: req.user.facebookID,
// 					email: req.user.email
// 				},
// 				key.jwt.secretKey,
// 				{ expiresIn: 60 * 60 }
// 			);
// 			return res.send({ message: "Success", token: token });
// 		}
// 		return res.send({ message: "login with different email!" });
// 	}
// );

module.exports = router;
