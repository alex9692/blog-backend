const passport = require("passport");

const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;

const GoogleStrategy = require("passport-google-oauth20");
const FacebookStrategy = require("passport-facebook");

const User = require("../models/userModel");

passport.use(
	new JwtStrategy(
		{
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: process.env.JWT_SECRET_KEY
		},
		async function(jwt_payload, done) {
			try {
				const user = await User.findById(jwt_payload.id).select("+active");

				if (!user) {
					return done(null, false);
				}
				
				if (user.role === "admin" && !user.active) {
					return done(null, false);
				}
				if (user.changedPasswordAfter(jwt_payload.iat)) {
					return done(null, false);
				}
				return done(null, user);
			} catch (error) {
				return done(err, false);
			}
		}
	)
);

passport.use(
	new GoogleStrategy(
		{
			callbackURL: "/auth/google/redirect",
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET
		},
		(accessToken, refreshToken, profile, done) => {
			User.findOne({ email: profile.emails[0].value })
				.exec()
				.then(user => {
					if (user) {
						if (!user.googleID) {
							console.log("email is already in use with another account");

							done(null, { err: true });
						} else {
							console.log("email is already linked with google");
							done(null, user);
						}
					} else {
						console.log("email is not in use you can login with google");
						const user = new User({
							email: profile.emails[0].value,
							googleID: profile.id
						});
						user
							.save()
							.then(newUser => {
								console.log("new user created " + newUser);
								done(null, newUser);
							})
							.catch(error => {
								console.log(error);
							});
					}
				});
		}
	)
);

passport.use(
	new FacebookStrategy(
		{
			clientID: process.env.FACEBOOK_APP_ID,
			clientSecret: process.env.FACEBOOK_APP_SECRET,
			callbackURL: "http://localhost:3000/auth/facebook/redirect",
			profileFields: ["id", "displayName", "photos", "email", "gender", "name"]
		},
		(accessToken, refreshToken, profile, done) => {
			User.findOne({ email: profile._json.email })
				.exec()
				.then(user => {
					if (user) {
						if (!user.facebookID) {
							console.log("email is already in use with another account");
							done(null, { err: true });
						} else {
							console.log("email is already linked with facebook");
							done(null, user);
						}
					} else {
						console.log("email is not in use you can login with facebook");
						const user = new User({
							email: profile._json.email,
							facebookID: profile._json.id
						});
						user
							.save()
							.then(newUser => {
								console.log("new user created " + newUser);
								done(null, newUser);
							})
							.catch(error => {
								console.log(error);
							});
					}
				});
		}
	)
);

module.exports.passport = passport;
