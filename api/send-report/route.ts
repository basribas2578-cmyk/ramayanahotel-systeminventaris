import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: Request) {
  try {
    const { recipientEmail, subject, body, attachment } = await request.json()

    // Pastikan semua variabel lingkungan telah diatur
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      // Log error untuk debugging di server
      console.error("Missing email environment variables:", {
        EMAIL_HOST: !!process.env.EMAIL_HOST,
        EMAIL_PORT: !!process.env.EMAIL_PORT,
        EMAIL_USER: !!process.env.EMAIL_USER,
        EMAIL_PASS: !!process.env.EMAIL_PASS,
      })
      return NextResponse.json({ message: "Server email credentials are not configured." }, { status: 500 })
    }

    // Konfigurasi transporter email menggunakan Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST, // e.g., 'smtp.gmail.com' or your SMTP server
      port: Number(process.env.EMAIL_PORT), // e.g., 587 for TLS, 465 for SSL
      secure: process.env.EMAIL_PORT === "465", // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER, // Your email address (e.g., abdbasri.pr@gmail.com)
        pass: process.env.EMAIL_PASS, // Your email password or app-specific password
      },
    })

    const mailOptions = {
      from: `CM Coin Laundry <${process.env.EMAIL_USER}>`, // Email pengirim
      to: recipientEmail,
      subject: subject,
      html: body,
      attachments: attachment
        ? [
            {
              filename: attachment.filename,
              content: attachment.content, // Base64 encoded content
              encoding: "base64",
              contentType: attachment.fileType,
            },
          ]
        : [],
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({ message: "Email berhasil dikirim!" }, { status: 200 })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json({ message: "Gagal mengirim email.", error: (error as Error).message }, { status: 500 })
  }
}
