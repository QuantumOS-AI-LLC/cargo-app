import nodemailer from "nodemailer";

const smtpOptions = {
  host: process.env.SMTP_HOST || "smtp.example.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER || "user",
    pass: process.env.SMTP_PASS || "pass",
  },
};

export const sendEmail = async (data: {
  to: string;
  subject: string;
  html: string;
}) => {
  const transporter = nodemailer.createTransport({
    ...smtpOptions,
  });

  return await transporter.sendMail({
    from: process.env.SMTP_FROM || '"CargoDeductible" <noreply@cargodeductible.com>',
    ...data,
  });
};
