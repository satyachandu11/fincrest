import { Resend } from 'resend';

export async function sendEmail({ to, subject, react }) {
    const resend = new Resend(process.env.RESEND_API_KEY || '');

    try {
        const data = await resend.emails.send({
            from: 'FinCrest <noreply@fincrest.fun>',
            to,
            subject,
            react,
        });
        console.log("Email sent successfully:", data);
        return { success: true, data};
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error: error.message || 'Failed to send email' };
    }
}