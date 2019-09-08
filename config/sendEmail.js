const nodemailer = require("nodemailer");

const sendEmail = async options => {
	const transporter = nodemailer.createTransport({
		host: process.env.MAILTRAP_HOST,
		port: process.env.MAILTRAP_PORT,
		auth: {
			user: process.env.MAILTRAP_USERNAME,
			pass: process.env.MAILTRAP_PASSWORD
		}
	});

	const mailOptions = {
		from: `Alex Kerketta <${process.env.EMAIL_FROM}>`,
		to: options.email,
		subject: options.subject,
		text: options.message
	};

	await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;

// const transporter = nodemailer.createTransport({
// 	service: "gmail",
// 	auth: {
// 		user: process.env.GMAIL_USERNAME,
// 		pass: process.env.GMAIL_PASSWORD
// 	}
// });

// const mailOptions = {
// 	from: `Alex Kerketta <${process.env.GMAIL_USERNAME}>`,
// 	to: "battle253@gmail.com",
// 	subject: options.subject,
// 	text: options.message
// };
