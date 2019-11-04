const mongoose = require("mongoose");
const slugify = require("slugify");
const Schema = mongoose.Schema;

const articleSchema = new Schema(
	{
		title: {
			type: String,
			required: [true, "An article must have a title"],
			unique: true,
			trim: true,
			maxlength: [
				500,
				"The title should be less than or equal to 500 characters long"
			],
			minlength: [
				10,
				"The title should be more than or equal to 10 characters long"
			]
		},
		content: {
			type: String,
			required: [true, "An article must have content"],
			trim: true,
			maxlength: [
				10000,
				"The content should be less than or equal to 10000 characters long"
			],
			minlength: [
				100,
				"The content should be more than or equal to 100 characters long"
			]
		},
		ratingsAverage: {
			type: Number,
			default: 4,
			min: [1, "Rating must be above or equal to 1"],
			max: [5, "Rating must be below or equal to 5"]
		},
		ratingsQuantity: {
			type: Number,
			default: 0
		},
		slug: String,
		user: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: [true, "An article must have a user"]
		}
	},
	{
		timestamps: true
	}
);

articleSchema.index({ slug: 1 });

articleSchema.pre("save", function(next) {
	this.slug = slugify(this.title, { lower: true });
	next();
});

articleSchema.pre(/^find/, function(next) {
	this.populate({
		path: "user",
		select: "name email"
	});
	next();
});

module.exports = mongoose.model("Article", articleSchema);
