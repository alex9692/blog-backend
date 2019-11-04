const jwt = require("jsonwebtoken");

const User = require("../models/userModel");
const sendMail = require("../config/sendEmail");
const errorHandler = require("../config/errorHandler");

const server = require("http").createServer(require("express")());
const io = require("socket.io")(server);

server.listen(5001, () => {
	console.log("socket.io running in PORT: 5001");
});

io.on("connection", function(socket) {
	console.log("connected");
	socket.on("startVerification", async id => {
		const user = await User.findById(id);
		socket.emit("sendUpdatedUser", user);
	});
});

exports.signUp = async (req, res, next) => {
	try {
		const { name, email, password, phoneNumber, role } = req.body;

		const user = await User.create({
			name,
			email,
			password,
			phoneNumber,
			role
		});

		res.status(201).json({
			status: "success",
			data: {
				user
			}
		});
	} catch (error) {
		return next(errorHandler(error.message));
	}
};

exports.signIn = async (req, res, next) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return next(
				errorHandler("Please enter your email and password", "fail", 400)
			);
		}

		const user = await User.findOne({ email })
			.select("+password")
			.select("+active");
		if (!user.active) {
			return next(
				errorHandler(
					"It seems your account is deactivated.If you want to reactivate your account please go to '/reactivate-me' route!",
					"fail",
					400
				)
			);
		}

		if (!user || !(await user.checkPassword(password, user.password))) {
			return next(errorHandler("Incorrect email or password", "fail", 400));
		}

		const token = jwt.sign(
			{
				id: user.id,
				email: user.email,
				role: user.role
			},
			process.env.JWT_SECRET_KEY,
			{ expiresIn: process.env.JWT_EXPIRES_IN }
		);

		user.password = undefined;
		const tokenExpirationDate =
			Date.now() + +process.env.JWT_EXPIRES_IN.match(/[0-9]/g).join("") * 1000;

		res.status(200).json({
			status: "success",
			data: {
				userId: user.id,
				token,
				tokenExpirationDate
			}
		});
	} catch (error) {
		return next(errorHandler(error.message));
	}
};

exports.requestOTP = async (req, res, next) => {
	try {
		const user = await User.findById(req.user.id);
		if (!user) {
			return next(
				errorHandler("Please enter the correct phone number", "fail", 401)
			);
		}
		if (user.role !== "guest") {
			return next(errorHandler("User is already verified", "fail", 400));
		}

		// const phone = user.phoneNumber.toString();
		const sessionId = await user.sendOtp("9692459885");

		const sessionIdToken = jwt.sign(
			{
				id: user.id,
				sessionId
			},
			process.env.JWT_SECRET_KEY,
			{ expiresIn: "180s" }
		);

		res.status(200).json({
			status: "success",
			sessionIdToken,
			message: "Otp sent to your number"
		});
	} catch (error) {
		return next(errorHandler(error.message));
	}
};

exports.confirmOTP = async function(req, res, next) {
	try {
		const { otp } = req.body;
		const { sessionidtoken } = req.headers;
		let decoded;

		if (!otp) {
			return next(errorHandler("Please enter the 2factor otp", "fail", 400));
		}

		if (!sessionidtoken) {
			return next(errorHandler("No valid sessionId found", "fail", 400));
		}

		try {
			decoded = jwt.verify(sessionidtoken, process.env.JWT_SECRET_KEY);
		} catch (error) {
			return next(errorHandler("The session has been expired!", "fail", 408));
		}

		const user = await User.findById(decoded.id);
		if (!user) {
			return next(errorHandler("User doesn't exist", "fail", 404));
		}

		if (user.role !== "guest") {
			return next(errorHandler("Invalid request", "fail", 403));
		}

		const result = await user.verifyOtp(decoded.sessionId, otp);
		if (result !== "OTP Matched") {
			return next(errorHandler("Please enter correct otp", "fail", 400));
		}

		user.role = "user";
		await user.save({ validateBeforeSave: false });

		res.status(200).json({
			status: "success",
			message: "Your account has been verified"
		});
	} catch (error) {
		return next(errorHandler(error.message));
	}
};

exports.verifyEmailStart = async (req, res, next) => {
	try {
		const id = req.user.id;
		const user = await User.findById(id);

		if (!user) {
			return next(errorHandler("User doesn't exist", "fail", 404));
		}
		if (user.role !== "guest") {
			return next(errorHandler("Email is already verified", "fail", 400));
		}

		const token = user.generateVerifyEmailToken(id);

		const url = `${req.protocol}://${req.get(
			"host"
		)}/api/v1/users/verify-email/${token}`;
		const message = `Verify your account by going to this ${url} link.\nIf your email is already verified ignore this mail`;

		const mailConfig = {
			email: user.email,
			subject: "Email verification",
			message
		};

		try {
			await sendMail(mailConfig);

			res.status(200).json({
				status: "success",
				message: "Mail has been sent"
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

exports.verifyEmailEnd = async (req, res, next) => {
	try {
		const { token } = req.params;
		const id = User.decipherVerifyEmailToken(token);

		const user = await User.findById(id);
		if (!user) {
			return next(errorHandler("User doesn't exist", "fail", 401));
		}
		if (user.role !== "guest") {
			return next(errorHandler("Email is already verified", "fail", 400));
		}
		user.role = "user";
		await user.save();

		res.status(200).json({
			status: "success",
			message: "your email has been verified"
		});
	} catch (error) {
		return next(errorHandler(error.message));
	}
};

exports.forgotPassword = async (req, res, next) => {
	try {
		const { email } = req.body;
		if (!email) {
			return next(errorHandler("Please enter your email address", "fail", 400));
		}

		const user = await User.findOne({ email });
		if (!user) {
			return next(
				errorHandler("User with the provided email doesn't exist", "fail", 404)
			);
		}

		const passwordResetToken = user.createPasswordResetToken();
		await user.save();

		const url = `${req.protocol}://localhost:8080/reset-password/${passwordResetToken}`;
		const message = `Please click this ${url} link to reset your password. \nIgnore this if you dont want to reset your password.`;

		const mailConfig = {
			email: user.email,
			subject: "Forgot password!",
			message
		};

		try {
			await sendMail(mailConfig);

			res.status(200).json({
				status: "success",
				message: "Mail has been sent to your account"
			});
		} catch (error) {
			user.resetPasswordToken = undefined;
			user.resetPasswordTokenExpiry = undefined;
			await user.save();
			return next(
				errorHandler("There was an error sending the email. Try again later!")
			);
		}
	} catch (error) {
		return next(errorHandler(error.message));
	}
};

exports.getResetUserName = async (req, res, next) => {
	try {
		const { token } = req.params;

		const hashedToken = User.createHashedPasswordResetToken(token);

		const user = await User.findOne({
			resetPasswordToken: hashedToken,
			resetPasswordTokenExpiry: { $gt: Date.now() }
		});

		if (!user) {
			return next(
				errorHandler(
					"The session to reset your password has expired! Please try again",
					"fail",
					408
				)
			);
		}
		res.status(200).json({
			status: "success",
			data: {
				user: user.name
			}
		});
	} catch (error) {
		return next(errorHandler(error.message));
	}
};

exports.resetPassword = async (req, res, next) => {
	try {
		const { newPassword, confirmNewPassword } = req.body;
		const { token } = req.params;

		const hashedToken = User.createHashedPasswordResetToken(token);

		const user = await User.findOne({
			resetPasswordToken: hashedToken,
			resetPasswordTokenExpiry: { $gt: Date.now() }
		});

		if (!user) {
			return next(
				errorHandler(
					"The session to reset your password has expired! Please try again",
					"fail",
					408
				)
			);
		}

		if (newPassword !== confirmNewPassword) {
			return next(errorHandler("The passwords do not match", "fail", 400));
		}

		user.password = newPassword;
		user.resetPasswordToken = undefined;
		user.resetPasswordTokenExpiry = undefined;
		await user.save();

		res.status(200).json({
			status: "success",
			message: "Password reset successfull"
		});
	} catch (error) {
		return next(errorHandler(error.message));
	}
};

exports.changeMyPassword = async (req, res, next) => {
	try {
		const id = req.user.id;
		const { currentPassword, newPassword, confirmNewPassword } = req.body;

		const user = await User.findById(id).select("+password");
		if (!user) {
			return next(errorHandler("User doesn't exist", "fail", 500));
		}

		if (!(await user.checkPassword(currentPassword, user.password))) {
			return next(errorHandler("Incorrect password", "fail", 400));
		}

		if (newPassword !== confirmNewPassword) {
			return next(errorHandler("The passwords do not match", "fail", 400));
		}

		user.password = newPassword;
		await user.save();

		const token = jwt.sign(
			{
				id: user.id,
				email: user.email,
				role: user.role
			},
			process.env.JWT_SECRET_KEY,
			{ expiresIn: process.env.JWT_EXPIRES_IN }
		);

		res.status(200).json({
			status: "success",
			token,
			message: "Your password has been successfully updated"
		});
	} catch (error) {
		return next(errorHandler(error.message));
	}
};
