import { signInAction } from "@/app/actions";
import { FormMessage, type Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function Login(props: { searchParams: Promise<Message> }) {
	const searchParams = await props.searchParams;
	return (
		<form className="my-48 flex min-w-64 flex-1 flex-col">
			<h1 className="text-center font-medium text-2xl">Sign in</h1>
			<div className="mt-8 flex flex-col gap-2 [&>input]:mb-3">
				<Label htmlFor="email">Email</Label>
				<Input name="email" required />
				<div className="flex items-center justify-between">
					<Label htmlFor="password">Password</Label>
				</div>
				<Input name="password" required type="password" />
				<SubmitButton formAction={signInAction} pendingText="Signing In...">
					Sign in
				</SubmitButton>
				<FormMessage message={searchParams} />
			</div>
		</form>
	);
}
