const express = require("express");
const router = express.Router({ mergeParams: true });

const { passport } = require("../config/passport");
const acl = require("../config/nacl");

const articleController = require("../controllers/articleController");

router
	.route("/")
	.get(articleController.getAllArticles)
	.post(
		passport.authenticate("jwt", { session: false }),
		acl.authorize,
		articleController.createArticle
	);

router
	.route("/:id")
	.get(articleController.getArticle)
	.patch(
		passport.authenticate("jwt", { session: false }),
		acl.authorize,
		articleController.checkOwnedArticle,
		articleController.updateArticle
	)
	.delete(
		passport.authenticate("jwt", { session: false }),
		acl.authorize,
		articleController.checkOwnedArticle,
		articleController.deleteArticle
	);

module.exports = router;

// router.get("/all-posts", postCtrl.getAllPosts);

// router.get("/all-posts/:postId", postCtrl.getSinglePostByUser);

// router.get(
// 	"/user-posts/:userId",
// 	passport.authenticate("jwt", { session: false }),
// 	authorize.auth,
// 	postCtrl.getPostsByUser
// );

// router.get(
// 	"/user-posts/post/:postId",
// 	passport.authenticate("jwt", { session: false }),
// 	authorize.auth,
// 	postCtrl.getSinglePostByUser
// );

// router.post(
// 	"/create",
// 	passport.authenticate("jwt", { session: false }),
// 	authorize.auth,
// 	postCtrl.createPost
// );

// router.delete(
// 	"/delete/:postId",
// 	passport.authenticate("jwt", { session: false }),
// 	authorize.auth,
// 	postCtrl.deletePost
// );

// router.patch(
// 	"/update/:postId",
// 	passport.authenticate("jwt", { session: false }),
// 	authorize.auth,
// 	postCtrl.updatePost
// );
