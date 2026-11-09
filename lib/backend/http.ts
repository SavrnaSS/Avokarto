import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import {
	BackendConfigurationError,
	getDatabaseConnectionErrorCode,
} from "@/lib/backend/db";

const DATABASE_ERROR_LOG_INTERVAL_MS = 30_000;
let lastDatabaseErrorLogAt = 0;

export class HttpError extends Error {
	constructor(
		public status: number,
		message: string,
		public code = "HTTP_ERROR",
		public details?: unknown,
		public headers?: Record<string, string>,
	) {
		super(message);
		this.name = "HttpError";
	}
}

export function json(data: unknown, init?: ResponseInit) {
	return NextResponse.json(data, {
		...init,
		headers: {
			"Cache-Control": "no-store",
			...(init?.headers ?? {}),
		},
	});
}

export async function parseJson<T>(request: Request, schema: ZodType<T>) {
	const body = await request.json().catch(() => ({}));
	return schema.parse(body);
}

export function handleApiError(error: unknown) {
	if (error instanceof HttpError) {
		return json(
			{
				error: {
					code: error.code,
					details: error.details,
					message: error.message,
				},
			},
			{ headers: error.headers, status: error.status },
		);
	}

	if (error instanceof BackendConfigurationError) {
		return json(
			{
				error: {
					code: error.code,
					message: error.message,
				},
			},
			{ status: 503 },
		);
	}

	const databaseErrorCode = getDatabaseConnectionErrorCode(error);

	if (databaseErrorCode) {
		const now = Date.now();

		if (now - lastDatabaseErrorLogAt >= DATABASE_ERROR_LOG_INTERVAL_MS) {
			lastDatabaseErrorLogAt = now;
			const guidance = databaseErrorCode === "TENANT_NOT_FOUND"
				? "Check the database project status and copy its current pooler connection strings (DATABASE_URL, DATABASE_SESSION_URL) from the provider dashboard."
				: "Check DATABASE_URL and network reachability.";
			console.error(
				`Database connection unavailable (${databaseErrorCode}). ${guidance}`,
			);
		}

		return json(
			{
				error: {
					code: "DATABASE_UNAVAILABLE",
					message: "Database temporarily unavailable. Please try again shortly.",
				},
			},
			{
				headers: { "Retry-After": "5" },
				status: 503,
			},
		);
	}

	if (error instanceof ZodError) {
		return json(
			{
				error: {
					code: "VALIDATION_ERROR",
					details: error.flatten(),
					message: "Invalid request payload.",
				},
			},
			{ status: 400 },
		);
	}

	console.error(error);

	return json(
		{
			error: {
				code: "INTERNAL_SERVER_ERROR",
				message: "Unexpected server error.",
			},
		},
		{ status: 500 },
	);
}
