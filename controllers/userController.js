const User = require("../models/userModel");
const errorHandler = require("../config/errorHandler");
const sendMail = require("../config/sendEmail");

exports.getAllUsers = async (req, res, next) => {
	try {
		const users = await User.find({});

		res.status(200).json({
			status: "success",
			results: users.length,
			data: {
				users
			}
		});
	} catch (error) {
		return next(errorHandler(error.message));
	}
};

exports.getUser = async (req, res, next) => {
	try {
		const { id } = req.params;

		const user = await User.findById(id)
			.select("+active")
			.select("+createdAt")
			.select("+updatedAt")
			.select("-__v");
		if (!user) {
			return next(errorHandler("User not found", "fail", 404));
		}

		res.status(200).json({
			status: "success",
			data: {
				user
			}
		});
	} catch (error) {
		return next(errorHandler(error.message));
	}
};

exports.setMe = (req, res, next) => {
	req.params.id = req.user.id;
	console.log(req.params.id, req.user.id);
	next();
};

exports.createUser = (req, res, next) => {
	res.status(500).json({
		status: "error",
		message: "Route not yet defined.Please use /signup instead"
	});
};

exports.updateUser = async (req, res, user) => {
	try {
		const { id } = req.params;
		const user = await User.findByIdAndUpdate(id, req.body, {
			new: true,
			runValidators: true
		});

		if (!user) {
			return next(errorHandler("User not found", "fail", 404));
		}

		res.status(200).json({
			status: "success",
			data: {
				user
			}
		});
	} catch (error) {
		return next(errorHandler(error.message));
	}
};

exports.deleteUser = async (req, res, next) => {
	try {
		const user = await User.findByIdAndDelete(req.params.id);

		if (!user) {
			return next(errorHandler("User not found", "fail", 404));
		}

		res.status(204).json({
			status: "success",
			data: null
		});
	} catch (error) {
		return next(errorHandler(error.message));
	}
};

exports.updateUserData = async (req, res, next) => {
	try {
		const id = req.user.id;

		if (req.body.password) {
			return next(
				errorHandler(
					"This route is not used for password updates.Go to /changeMyPassword route to update your password",
					"fail",
					400
				)
			);
		}

		// name,email,phonenumber
		let filterdObj = {};
		const allowedFields = ["name", "email", "phoneNumber"];
		for (let field of allowedFields) {
			if (req.body[field]) filterdObj[field] = req.body[field];
		}

		const user = await User.findByIdAndUpdate(
			id,
			{ ...filterdObj },
			{ new: true, runValidators: true }
		)
			.select("+active")
			.select("+createdAt")
			.select("+updatedAt")
			.select("-__v");

		res.status(200).json({
			status: "success",
			data: {
				user
			}
		});
	} catch (error) {
		return next(errorHandler(error.message));
	}
};

exports.deleteMe = async (req, res, next) => {
	try {
		await User.findByIdAndUpdate(req.user.id, { active: false });
		res.status(204).json({
			status: "success",
			data: null
		});
	} catch (error) {}
};

exports.reactivateMeStart = async (req, res, next) => {
	try {
		const { email } = req.body;
		if (!email) {
			return next(
				errorHandler(
					"Please enter the email address for which you want to reactivate the account",
					"fail",
					400
				)
			);
		}
		const user = await User.findOne({ email }).select("+active");
		if (!user) {
			return next(errorHandler("User not found", "fail", 404));
		}
		if (user.active) {
			return next(
				errorHandler("Your account is already activated", "fail", 400)
			);
		}

		const token = user.generateVerifyEmailToken(user.id);

		const activationUrl = `${req.protocol}://localhost:8080/reactivate-account/${token}`;

		const message = `To activate your account ,go to ${activationUrl} link. \nIf your account is already activated ignore this mail.`;

		const mailConfig = {
			email,
			subject: "Account activation",
			message
		};
		console.log(user, mailConfig);
		try {
			await sendMail(mailConfig);

			res.status(200).json({
				status: "success",
				message: "Mail has been sent "
			});
		} catch (error) {
			return next(
				errorHandler(
					"There was an error sending the email. Try again later!",
					"error",
					500
				)
			);
		}
	} catch (error) {
		return next(errorHandler(error.message));
	}
};

exports.reactivateMeEnd = async (req, res, next) => {
	try {
		const { token } = req.params;
		const id = User.decipherVerifyEmailToken(token);

		const user = await User.findById(id).select("+active");
		if (!user) {
			return next(errorHandler("User not found", "fail", 404));
		}
		if (user.active) {
			return next(
				errorHandler("Your account is already activated", "fail", 400)
			);
		}

		user.active = true;
		await user.save();

		res.status(200).json({
			status: "success",
			message: "Your account has been activated"
		});
	} catch (error) {
		return next(errorHandler(error.message));
	}
};
