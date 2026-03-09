"use client";

import type { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext } from "react";
import { getUser } from "@/app/actions";

interface UserContextType {
	isError: boolean;
	isLoading: boolean;
	user: User | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
	const {
		data: user,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["user"],
		queryFn: async () => await getUser(),
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

	return (
		<UserContext.Provider value={{ user: user ?? null, isLoading, isError }}>
			{children}
		</UserContext.Provider>
	);
}

export function useUser() {
	const context = useContext(UserContext);
	if (context === undefined) {
		throw new Error("useUser must be used within a UserProvider");
	}
	return context;
}
