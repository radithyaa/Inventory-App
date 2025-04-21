export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

export function FormMessage({ message }: { message: Message }) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-md text-sm text-primary">
      {"success" in message && (
        <div className="border-l-2 border-foreground px-4 text-primary">
          {message.success}
        </div>
      )}
      {"error" in message && (
        <div className="  border-l-2 border-destructive-foreground px-4 text-primary">
          {"Invalid email or password"}
        </div>
      )}
      {"message" in message && (
        <div className="text-primary border-l-2 px-4"></div>
      )}
    </div>
  );
}
