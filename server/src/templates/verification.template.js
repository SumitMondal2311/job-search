const verificationTemplate = (name, code) => {
  return `<div style="padding: 20px; font-family: 'Courier New', Courier, monospace">
      <div>
        <div
          style="
        text-align: center;
        background-color: lightgrey;
        padding: 10px 0;
      "
        >
          <p style="font-weight: bold; font-size: 20px">Job Search</p>
        </div>
        <div style="padding: 0 20px">
          <p style="font-weight: bold; font-size: 18px">Verify your account</p>
          <p>Hi ${name},</p>
          <p>
            Your verification code is <strong>${code}</strong>.
          </p>
          <p>
            The verification code will be valid for 1 hour. Please do not share
            this code with anyone.
          </p>
          <p>If you didn't request this code, please ignore this email.</p>
          <div style="line-height: 0.5">
            <p>Thanks,</p>
            <p>Team Job Search</p>
          </div>
          <p style="text-align: center; font-size: small; margin-top: 20px;">
            &copy; 2025 jobsearch.com, All rights reserved
          </p>
        </div>
      </div>
    </div>`;
};

export default verificationTemplate;
