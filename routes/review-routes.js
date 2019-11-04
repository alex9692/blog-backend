const express = require("express");
const router = express.Router({ mergeParams: true });

const { passport } = require("../config/passport");
const acl = require("../config/nacl");

const reviewController = require("../controllers/reviewController");

router
	.route("/")
	.get(reviewController.getAllReviews)
	.post(
		passport.authenticate("jwt", { session: false }),
		acl.authorize,
		reviewController.setArticleId,
		reviewController.createReview
	);

router
	.route("/:id")
	.get(reviewController.getReview)
	.patch(
		passport.authenticate("jwt", { session: false }),
		acl.authorize,
		reviewController.checkOwnReview,
		reviewController.updateReview
	)
	.delete(
		passport.authenticate("jwt", { session: false }),
		acl.authorize,
		reviewController.checkOwnReview,
		reviewController.deleteReview
	);

module.exports = router;
