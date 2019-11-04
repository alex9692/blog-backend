const Review = require("../models/reviewModel");
const errorHandler = require("../config/errorHandler");

exports.setArticleId = (req, res, next) => {
	if (!req.body.article) req.body.article = req.params.articleId;
	if (!req.body.user) req.body.user = req.user.id;
	next();
};

exports.checkOwnReview = async (req, res, next) => {
	try {
		const review = await Review.findById(req.params.id);

		if (review.user.id.toString() === req.user.id) return next();

		res.status(403).json({
			status: "fail",
			message: "You are not allowed to modify others reviews"
		});
	} catch (error) {
		return next(errorHandler(error.message));
	}
};

exports.getAllReviews = async (req, res, next) => {
	try {
		let filter = {};
		if (req.params.articleId) {
			filter = { article: req.params.articleId };
		} else if (req.params.userId) {
			filter = { user: req.params.userId };
		}

		const reviews = await Review.find(filter);

		res.status(200).json({
			status: "success",
			results: reviews.length,
			data: {
				reviews
			}
		});
	} catch (error) {
		return next(errorHandler(error.message));
	}
};

exports.createReview = async (req, res, next) => {
	try {
		const review = await Review.create(req.body);

		res.status(201).json({
			status: "success",
			data: {
				review
			}
		});
	} catch (error) {
		return next(errorHandler(error.message));
	}
};

exports.getReview = async (req, res, next) => {
	try {
		const review = await Review.findById(req.params.id);

		if (!review) {
			return next(errorHandler("Review not found", "fail", 404));
		}

		res.status(200).json({
			status: "success",
			data: {
				review
			}
		});
	} catch (error) {
		return next(errorHandler(error.message));
	}
};

exports.updateReview = async (req, res, next) => {
	try {
		const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true
		});

		if (!review) {
			return next(errorHandler("Review not found", "fail", 404));
		}

		res.status(200).json({
			status: "success",
			data: {
				review
			}
		});
	} catch (error) {
		return next(errorHandler(error.message));
	}
};

exports.deleteReview = async (req, res, next) => {
	try {
		const review = await Review.findByIdAndDelete(req.params.id);

		if (!review) {
			return next(errorHandler("Review not found", "fail", 404));
		}

		res.status(204).json({
			status: "success",
			data: null
		});
	} catch (error) {
		return next(errorHandler(error.message));
	}
};
