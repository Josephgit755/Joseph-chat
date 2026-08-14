const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const sendOTPEmail = async ({
  email,
  fullName,
  otp,
}) => {
  if (!email || !otp) {
    throw new Error(
      "Email address and OTP are required."
    );
  }

  const mailOptions = {
    from: `"ZenvaZapp" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Your ZenvaZapp login verification code",
    text: `Hello ${fullName || "User"},

Your ZenvaZapp verification code is:

${otp}

This code will expire in 10 minutes.

If you did not try to log in to ZenvaZapp, you can safely ignore this email.

ZenvaZapp Security Team`,
    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 30px;
        background: #f5f7fb;
      ">
        <div style="
          background: white;
          border-radius: 16px;
          padding: 30px;
          text-align: center;
        ">
          <h1 style="
            margin-bottom: 8px;
            color: #111827;
          ">
            ZenvaZapp
          </h1>

          <p style="
            color: #6b7280;
            font-size: 16px;
          ">
            Login verification
          </p>

          <p style="
            color: #374151;
            font-size: 16px;
          ">
            Hello ${fullName || "User"},
          </p>

          <p style="
            color: #374151;
            font-size: 15px;
          ">
            Use the verification code below to
            complete your ZenvaZapp login.
          </p>

          <div style="
            margin: 30px 0;
            padding: 20px;
            background: #f3f4f6;
            border-radius: 12px;
          ">
            <span style="
              font-size: 36px;
              font-weight: bold;
              letter-spacing: 10px;
              color: #111827;
            ">
              ${otp}
            </span>
          </div>

          <p style="
            color: #6b7280;
            font-size: 14px;
          ">
            This code expires in
            <strong>10 minutes</strong>.
          </p>

          <p style="
            color: #9ca3af;
            font-size: 13px;
            margin-top: 30px;
          ">
            If you did not try to log in to
            ZenvaZapp, you can safely ignore
            this email.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);

  return true;
};

module.exports = sendOTPEmail;