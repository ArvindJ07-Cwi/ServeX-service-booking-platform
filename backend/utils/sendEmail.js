const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create a transporter
    // For development, we log securely if user hasn't configured SMTP
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: process.env.SMTP_PORT || 587,
        auth: {
            user: process.env.SMTP_USER || 'ethereal_user', 
            pass: process.env.SMTP_PASS || 'ethereal_pass'
        }
    });

    const isEthereal = !process.env.SMTP_USER;

    const message = {
        from: `${process.env.FROM_NAME || 'ServeX Admin'} <${process.env.FROM_EMAIL || 'noreply@servex.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    if (isEthereal && process.env.NODE_ENV !== 'production') {
        console.log('\n--- SIMULATED EMAIL OUTBOUND ---');
        console.log(`To: ${message.to}`);
        console.log(`Subject: ${message.subject}`);
        console.log(`Message: \n${message.text}`);
        console.log('--------------------------------\n');
        return;
    }

    try {
        await transporter.sendMail(message);
    } catch (err) {
        console.error('Email could not be sent', err);
        throw new Error('Email delivery failed');
    }
};

module.exports = sendEmail;
