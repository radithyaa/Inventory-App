import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
	try {
		// This `NextResponse.next()` response object will be mutated
		let response = NextResponse.next({
			request: {
				headers: request.headers,
			},
		});

		const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

		if (!(url && anonKey)) {
			return response;
		}

		const supabase = createServerClient(url, anonKey, {
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					for (const { name, value } of cookiesToSet) {
						request.cookies.set(name, value);
					}
					response = NextResponse.next({
						request,
					});
					for (const { name, value, options } of cookiesToSet) {
						response.cookies.set(name, value, options);
					}
				},
			},
		});

		// This will refresh session if expired - required for Server Components
		// https://supabase.com/docs/guides/auth/server-side/nextjs
		const {
			data: { user },
		} = await supabase.auth.getUser();

		// protected routes logic can go here if needed
		if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
			return NextResponse.redirect(new URL("/sign-in", request.url));
		}

		return response;
	} catch (_error) {
		// If you are here, a Supabase client could not be created!
		// This is likely because you have not set up environment variables.
		return NextResponse.next({
			request: {
				headers: request.headers,
			},
		});
	}
};
