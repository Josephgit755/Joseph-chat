const sendOTPEmail = async ({
  email,
  fullName,
  otp,
}) => {
  // ==========================================
  // BREVO CONFIGURATION
  // ==========================================

  const apiKey =
    process.env.BREVO_API_KEY;

  const senderEmail =
    process.env.BREVO_SENDER_EMAIL;

  const senderName =
    process.env.BREVO_SENDER_NAME ||
    "ZenvaZapp";

  if (!apiKey) {
    throw new Error(
      "BREVO_API_KEY is not configured."
    );
  }

  if (!senderEmail) {
    throw new Error(
      "BREVO_SENDER_EMAIL is not configured."
    );
  }

  if (!email) {
    throw new Error(
      "Recipient email address is missing."
    );
  }

  if (!otp) {
    throw new Error(
      "OTP code is missing."
    );
  }

  // ==========================================
  // OTP EXPIRATION
  // ==========================================

  const expirationMinutes =
    Number(
      process.env.OTP_EXPIRES_MINUTES || 5
    );

  // ==========================================
  // SAFE NAME
  // ==========================================

  const safeName =
    fullName || "there";

  // ==========================================
  // EMAIL CONTENT
  // ==========================================

  const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />
    <title>ZenvaZapp Verification Code</title>
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
      font-family: Arial, Helvetica, sans-serif;
    "
  >

    <div
      style="
        max-width: 600px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 16px;
        padding: 40px 30px;
        box-sizing: border-box;
      "
    >

      <div
        style="
          text-align: center;
          margin-bottom: 25px;
        "
      >
        <div
          style="
            display: inline-flex;
            width: 64px;
            height: 64px;
            border-radius: 18px;
            align-items: center;
            justify-content: center;
            background: #d9a441;
            color: #1d1209;
            font-size: 28px;
            font-weight: bold;
          "
        >
          Zz
        </div>
      </div>

      <h1
        style="
          margin: 0 0 15px;
          text-align: center;
          color: #24160e;
          font-size: 28px;
        "
      >
        Verify your ZenvaZapp account
      </h1>

      <p
        style="
          color: #555555;
          font-size: 16px;
          line-height: 1.6;
        "
      >
        Hello ${safeName},
      </p>

      <p
        style="
          color: #555555;
          font-size: 16px;
          line-height: 1.6;
        "
      >
        Use the verification code below
        to complete your ZenvaZapp login.
      </p>

      <div
        style="
          margin: 30px 0;
          padding: 20px;
          text-align: center;
          background: #f8f1e5;
          border-radius: 12px;
        "
      >
        <span
          style="
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 10px;
            color: #24160e;
          "
        >
          ${otp}
        </span>
      </div>

      <p
        style="
          color: #666666;
          font-size: 14px;
          line-height: 1.6;
          text-align: center;
        "
      >
        This verification code expires in
        <strong>
          ${expirationMinutes} minutes
        </strong>.
      </p>

      <p
        style="
          color: #999999;
          font-size: 13px;
          line-height: 1.6;
          margin-top: 30px;
          text-align: center;
        "
      >
        If you did not try to sign in to
        ZenvaZapp, you can safely ignore
        this email.
      </p>

      <p
        style="
          color: #bbbbbb;
          font-size: 12px;
          text-align: center;
          margin-top: 30px;
        "
      >
        © ${new Date().getFullYear()}
        ZenvaZapp
      </p>

    </div>

  </body>
</html>
`;

  // ==========================================
  // BREVO HTTP API
  // ==========================================

  try {
    const response = await fetch(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",

        headers: {
          accept: "application/json",
          "api-key": apiKey,
          "content-type":
            "application/json",
        },

        body: JSON.stringify({
          sender: {
            name: senderName,
            email: senderEmail,
          },

          to: [
            {
              email,
              name: safeName,
            },
          ],

          subject:
            "Your ZenvaZapp verification code",

          htmlContent,
        }),
      }
    );

    let data = {};

    try {
      data =
        await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      console.error(
        "Brevo API error:",
        {
          status: response.status,
          statusText:
            response.statusText,
          response: data,
        }
      );

      throw new Error(
        data.message ||
          `Brevo email request failed with status ${response.status}.`
      );
    }

    console.log(
      "OTP email successfully sent to:",
      email
    );

    console.log(
      "Brevo response:",
      data
    );

    return data;
  } catch (error) {
    console.error(
      "OTP email sending failed:",
      error
    );

    throw error;
  }
};

module.exports = sendOTPEmail;