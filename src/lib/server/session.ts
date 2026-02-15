import { createHmac, timingSafeEqual } from 'crypto';
import { dev } from '$app/environment';

const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-secret-for-development';

export interface SessionData {
	id: string;
	username: string;
	displayName: string;
	role: 'admin' | 'inspector' | 'viewer';
	departmentId: string | null;
}

/**
 * Sign session data using HMAC-SHA256
 * Returns a token in format: base64(payload).base64(signature)
 */
export function signSession(data: SessionData): string {
	const payload = Buffer.from(JSON.stringify(data)).toString('base64');
	const signature = createHmac('sha256', SESSION_SECRET)
		.update(payload)
		.digest('base64');
	
	return `${payload}.${signature}`;
}

/**
 * Verify a signed session token
 * Returns the session data if valid, null if invalid
 */
export function verifySession(token: string): SessionData | null {
	try {
		const [payload, signature] = token.split('.');
		
		if (!payload || !signature) {
			return null;
		}
		
		// Verify signature using timing-safe comparison
		const expectedSignature = createHmac('sha256', SESSION_SECRET)
			.update(payload)
			.digest('base64');

		const sigBuffer = Buffer.from(signature, 'base64');
		const expectedBuffer = Buffer.from(expectedSignature, 'base64');

		if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
			return null;
		}
		
		// Decode payload
		const decoded = Buffer.from(payload, 'base64').toString('utf-8');
		const data = JSON.parse(decoded) as SessionData;
		
		return data;
	} catch {
		return null;
	}
}

/**
 * Get cookie options for session cookie
 */
export function getSessionCookieOptions() {
	return {
		path: '/' as const,
		httpOnly: true,
		sameSite: 'lax' as const,
		secure: !dev,
		maxAge: 60 * 60 * 24 * 7 // 7 days
	};
}
