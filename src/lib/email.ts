import { Resend } from "resend";

import { env } from "../config/env";
import { logger } from "../utils/logger";

type EmailMessage = {
	to: string;
	subject: string;
	html: string;
	text: string;
};

export const sendEmail = async ({ to, subject, html, text }: EmailMessage): Promise<void> => {
	if (!env.RESEND_API_KEY) {
		if (env.NODE_ENV === "development") {
			logger.info("Email delivery is not configured; development email:", { to, subject, text });
			return;
		}

		throw new Error("Email delivery is not configured");
	}

	if (!env.EMAIL_FROM) {
		throw new Error("EMAIL_FROM is not configured");
	}

	const resend = new Resend(env.RESEND_API_KEY);
	const { error } = await resend.emails.send({
		from: env.EMAIL_FROM,
		to,
		subject,
		html,
		text,
	});

	if (error) {
		throw new Error("Email provider failed to send message");
	}
};
