'use server'
import { Resend } from 'resend'

const isDev = process.env.NODE_ENV === 'development'
type SendEmailOptions = {
	to: string | string[]
	subject: string 
	text: string
	html: string
}
export async function sendEmail(options: SendEmailOptions) {
	return sendUsingResend(options.to, options.subject, options.text, options.html)
}
export async function getResend() {
	const resend = new Resend(process.env.RESEND_API_KEY!)
	return resend
}

async function sendUsingResend(to: string | string[], subject: string, text: string, html: string) {
	const resend = await getResend()
	const emailFrom = process.env.EMAIL_FROM as string
	if (!emailFrom) {
		throw new Error('EMAIL_FROM not set')
	}
	const data = await resend.emails.send({
		from: emailFrom,
		to: to,
		subject,
		html,
		text,
	})
	if (data.error) {
		throw new Error(data.error.message)
	}
	console.log(`Sent email using resend: `, data)
}
