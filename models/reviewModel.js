const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema(
	{
		review: {
			type: String,
			required: [true, "A review cannot be empty"]
		},
		ratings: {
			type: Number,
			min: 1,
			max: 5
		},
		user: {
			type: mongoose.Schema.ObjectId,
			ref: "User",
			required: [true, "A review must belong to a user"]
		},
		article: {
			type: mongoose.Schema.ObjectId,
			ref: "Article",
			required: [true, "A review must belong to an article"]
		}
	},
	{
		timestamps: true
	}
);

reviewSchema.statics.calcRatings = async function(articleId) {
	const stats = await this.aggregate([
		{
			$match: { article: articleId }
		},
		{
			$group: {
				_id: "$article",
				numOfRatings: { $sum: 1 },
				avgRating: { $avg: "$rating" }
			}
		}
	]);

	console.log(stats);
};

reviewSchema.post("save", function(doc) {
	doc.constructor.calcRatings(doc.article);
});

reviewSchema.pre(/^find/, function(next) {
	this.populate({
		path: "user",
		select: "name email"
	});
	next();
});

module.exports = mongoose.model("Review", reviewSchema);
