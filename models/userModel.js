const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const TwoFactor = new (require("2factor"))(process.env.TWO_FACTOR_API_KEY);

const Schema = mongoose.Schema;

const userSchema = new Schema(
	{
		name: {
			type: String,
			required: [true, "Please enter your name"],
			minlength: [4, "Your name should be atleast 4 characters"]
		},
		email: {
			type: String,
			required: [true, "Please enter your email address"],
			unique: true,
			lowercase: true,
			validate: [validator.isEmail, "Please enter a valid email"]
		},
		password: {
			type: String,
			required: [true, "Please enter your password"],
			minlength: [8, "Password should be atleast 8 characters long"],
			select: false
		},
		phoneNumber: {
			type: Number,
			required: [true, "Please enter your phone number"],
			unique: true
		},
		passwordChangedAt: {
			type: Date,
			select: false
		},
		role: {
			type: String,
			enum: ["user", "admin", "guest"],
			default: "guest"
		},
		active: {
			type: Boolean,
			default: true,
			select: false
		},
		resetPasswordToken: String,
		resetPasswordTokenExpiry: Date,
		createdAt: {
			type: Date,
			select: false
		},
		updatedAt: {
			type: Date,
			select: false
		}
	},
	{ timestamps: true }
);

userSchema.pre("save", async function(next) {
	if (!this.isModified("password")) {
		return next();
	}
	this.password = await bcrypt.hash(this.password, 12);
	next();
});

userSchema.pre("save", async function(next) {
	if (!this.isModified("password") || this.isNew) {
		return next();
	}
	this.passwordChangedAt = Date.now() - 1000;
	next();
});

userSchema.methods.checkPassword = async function(password, user_password) {
	const result = await bcrypt.compare(password, user_password);
	return result;
};

userSchema.methods.sendOtp = async function(phoneNumber) {
	const session_id = await TwoFactor.sendOTP(phoneNumber);
	return session_id;
};

userSchema.methods.verifyOtp = async function(session_id, otp) {
	const result = await TwoFactor.verifyOTP(session_id, otp);
	return result;
};

userSchema.methods.generateVerifyEmailToken = function(id) {
	const cipherkey = crypto.createCipher(
		process.env.CRYPTO_ALGORITHM,
		process.env.CRYPTO_KEY
	);
	let ciphertext = cipherkey.update(id, "utf8", "hex");
	ciphertext += cipherkey.final("hex");
	return ciphertext;
};

userSchema.statics.decipherVerifyEmailToken = function(token) {
	const cipherkey = crypto.createDecipher(
		process.env.CRYPTO_ALGORITHM,
		process.env.CRYPTO_KEY
	);
	let ciphertext = cipherkey.update(token, "hex", "utf8");
	ciphertext += cipherkey.final("utf8");
	return ciphertext;
};

userSchema.methods.createPasswordResetToken = function() {
	const token = crypto.randomBytes(32).toString("hex");

	this.resetPasswordToken = this.constructor.createHashedPasswordResetToken(
		token
	);
	this.resetPasswordTokenExpiry = Date.now() + 10 * 60 * 1000;

	return token;
};

userSchema.statics.createHashedPasswordResetToken = function(token) {
	const hashedToken = crypto
		.createHash("sha256")
		.update(token)
		.digest("hex");

	return hashedToken;
};

userSchema.methods.changedPasswordAfter = function(jwt_iat) {
	if (this.passwordChangedAt) {
		const pass_mat = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
		return pass_mat > jwt_iat;
	}
	return false;
};

module.exports = mongoose.model("User", userSchema);

// UserSchema.statics.generateRandomPassphrase = function() {
// 	return new Promise(function(resolve, reject) {
// 		var password = "";
// 		var repeatingCharacters = new RegExp("(.)\\1{2,}", "g");

// 		// iterate until the we have a valid passphrase
// 		// NOTE: Should rarely iterate more than once, but we need this to ensure no repeating characters are present
// 		while (password.length < 20 || repeatingCharacters.test(password)) {
// 			// build the random password
// 			password = generatePassword.generate({
// 				length: Math.floor(Math.random() * 20) + 20, // randomize length between 20 and 40 characters
// 				numbers: true,
// 				symbols: false,
// 				uppercase: true,
// 				excludeSimilarCharacters: true
// 			});

// 			// check if we need to remove any repeating characters
// 			password = password.replace(repeatingCharacters, "");
// 		}

// 		// Send the rejection back if the passphrase fails to pass the strength test
// 		if (owasp.test(password).errors.length) {
// 			reject(
// 				new Error(
// 					"An unexpected problem occurred while generating the random passphrase"
// 				)
// 			);
// 		} else {
// 			// resolve with the validated passphrase
// 			resolve(password);
// 		}
// 	});
// };

// userSchema.statics.seed = seed;

// mongoose.model("User", userSchema);

// /**
//  * Seeds the User collection with document (User)
//  * and provided options.
//  */
// function seed(doc, options) {
// 	var User = mongoose.model("User");

// 	return new Promise(function(resolve, reject) {
// 		skipDocument()
// 			.then(add)
// 			.then(function(response) {
// 				console.log(response);
// 				return resolve(response);
// 			})
// 			.catch(function(err) {
// 				return reject(err);
// 			});

// 		function skipDocument() {
// 			return new Promise(function(resolve, reject) {
// 				User.findOne({
// 					email: doc.email
// 				}).exec(function(err, existing) {
// 					if (err) {
// 						return reject(err);
// 					}

// 					if (!existing) {
// 						return resolve(false);
// 					}

// 					if (existing && !options.overwrite) {
// 						return resolve(true);
// 					}

// 					// Remove User (overwrite)

// 					existing.remove(function(err) {
// 						if (err) {
// 							return reject(err);
// 						}

// 						return resolve(false);
// 					});
// 				});
// 			});
// 		}

// 		function add(skip) {
// 			return new Promise(function(resolve, reject) {
// 				if (skip) {
// 					return resolve({
// 						message: chalk.yellow(
// 							"Database Seeding: User\t\t" + doc.username + " skipped"
// 						)
// 					});
// 				}

// 				User.generateRandomPassphrase()
// 					.then(function(passphrase) {
// 						var user = new User(doc);

// 						user.provider = "local";
// 						user.displayName = user.firstName + " " + user.lastName;
// 						user.password = passphrase;

// 						user.save(function(err) {
// 							if (err) {
// 								return reject(err);
// 							}

// 							return resolve({
// 								message:
// 									"Database Seeding: User\t\t" +
// 									user.username +
// 									" added with password set to " +
// 									passphrase
// 							});
// 						});
// 					})
// 					.catch(function(err) {
// 						return reject(err);
// 					});
// 			});
// 		}
// 	});
// }
