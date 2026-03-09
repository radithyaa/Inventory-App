export type Message =
	| { success: string }
	| { error: string }
	| { message: string };

export function FormMessage({ message }: { message: Message }) {
	return (
		<div className="flex w-full max-w-md flex-col gap-2 text-primary text-sm">
			{"success" in message && (
				<div className="border-foreground border-l-2 px-4 text-primary">
					{message.success}
				</div>
			)}
			{"error" in message && (
				<div className="border-destructive-foreground border-l-2 px-4 text-primary">
					{"Invalid email or password"}
				</div>
			)}
			{"message" in message && <div className="border-l-2 px-4 text-primary" />}
		</div>
	);
}
