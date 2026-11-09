import type { Metadata } from "next";
import { AdminSignInForm } from "@/admin/components/auth/admin-sign-in-form";

export const metadata: Metadata = {
	title: "Sign In",
};

export default async function SignInPage({
	searchParams,
}: {
	searchParams: Promise<{ next?: string }>;
}) {
	const { next } = await searchParams;
	return <AdminSignInForm nextPath={next} />;
}
