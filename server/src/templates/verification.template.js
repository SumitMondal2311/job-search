const verificationTemplate = (name, code) => {
  return `<div style="background-color: #f6f9fc; padding: 20px; font-family: Arial, sans-serif;">
      <div style="background-color: #ffffff; padding: 20px; border-radius: 10px; text-align: center;">
        <h2 style="color: #333; font-size: 24px;">Verify Your Account</h2>
        <p style="color: #666; font-size: 16px;">Hi ${name},</p>
        <p style="color: #666; font-size: 16px;">Your verification code is:</p>
        <p style="background-color: #e0e0e0; padding: 10px; border-radius: 5px; font-size: 20px; font-weight: bold; display: inline-block;">
          ${code}
        </p>
        <p style="color: #666; font-size: 16px;">
          If you did not request this, please ignore this email.
        </p>
        <p style="color: #666; font-size: 14px;">
          This code will expire in 2 hours.
        </p>
        <p style="color: #999; font-size: 14px; margin-top: 20px;">
          JobSearch Team
        </p>
      </div>
    </div>`;
};

export default verificationTemplate;
