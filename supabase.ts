export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export interface Database {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: "12.2.3 (519615d)";
	};
	graphql_public: {
		Tables: {
			[_ in never]: never;
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			graphql: {
				Args: {
					extensions?: Json;
					operationName?: string;
					query?: string;
					variables?: Json;
				};
				Returns: Json;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
	public: {
		Tables: {
			forms: {
				Row: {
					class: Database["public"]["Enums"]["class"];
					comment: string;
					created_at: string;
					id: number;
					name: string;
					product_id: number;
					status: Database["public"]["Enums"]["order_status"];
					total: number;
					updated_at: string | null;
				};
				Insert: {
					class: Database["public"]["Enums"]["class"];
					comment?: string;
					created_at?: string;
					id?: number;
					name: string;
					product_id: number;
					status?: Database["public"]["Enums"]["order_status"];
					total: number;
					updated_at?: string | null;
				};
				Update: {
					class?: Database["public"]["Enums"]["class"];
					comment?: string;
					created_at?: string;
					id?: number;
					name?: string;
					product_id?: number;
					status?: Database["public"]["Enums"]["order_status"];
					total?: number;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "forms_product_id_fkey";
						columns: ["product_id"];
						isOneToOne: false;
						referencedRelation: "products";
						referencedColumns: ["id"];
					},
				];
			};
			order_product: {
				Row: {
					amount: number | null;
					created_at: string;
					deleted_at: string | null;
					id: number;
					order_id: number | null;
					product_id: number | null;
					updated_at: string | null;
				};
				Insert: {
					amount?: number | null;
					created_at?: string;
					deleted_at?: string | null;
					id?: number;
					order_id?: number | null;
					product_id?: number | null;
					updated_at?: string | null;
				};
				Update: {
					amount?: number | null;
					created_at?: string;
					deleted_at?: string | null;
					id?: number;
					order_id?: number | null;
					product_id?: number | null;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "order_product_order_id_fkey";
						columns: ["order_id"];
						isOneToOne: false;
						referencedRelation: "orders";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "order_product_product_id_fkey";
						columns: ["product_id"];
						isOneToOne: false;
						referencedRelation: "products";
						referencedColumns: ["id"];
					},
				];
			};
			orders: {
				Row: {
					borrow_date: string | null;
					class: Database["public"]["Enums"]["class"] | null;
					created_at: string;
					deleted_at: string | null;
					id: number;
					name: string;
					note: string | null;
					return_date: string | null;
					status: Database["public"]["Enums"]["product_status"] | null;
					updated_at: string | null;
				};
				Insert: {
					borrow_date?: string | null;
					class?: Database["public"]["Enums"]["class"] | null;
					created_at?: string;
					deleted_at?: string | null;
					id?: number;
					name: string;
					note?: string | null;
					return_date?: string | null;
					status?: Database["public"]["Enums"]["product_status"] | null;
					updated_at?: string | null;
				};
				Update: {
					borrow_date?: string | null;
					class?: Database["public"]["Enums"]["class"] | null;
					created_at?: string;
					deleted_at?: string | null;
					id?: number;
					name?: string;
					note?: string | null;
					return_date?: string | null;
					status?: Database["public"]["Enums"]["product_status"] | null;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			products: {
				Row: {
					attachment: string | null;
					available_stock: number;
					created_at: string;
					deleted_at: string | null;
					id: number;
					name: string;
					status: Database["public"]["Enums"]["product_status"];
					total_stock: number | null;
					updated_at: string | null;
				};
				Insert: {
					attachment?: string | null;
					available_stock?: number;
					created_at?: string;
					deleted_at?: string | null;
					id?: number;
					name: string;
					status: Database["public"]["Enums"]["product_status"];
					total_stock?: number | null;
					updated_at?: string | null;
				};
				Update: {
					attachment?: string | null;
					available_stock?: number;
					created_at?: string;
					deleted_at?: string | null;
					id?: number;
					name?: string;
					status?: Database["public"]["Enums"]["product_status"];
					total_stock?: number | null;
					updated_at?: string | null;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			get_user_role: {
				Args: { user_uuid: string };
				Returns: Database["public"]["Enums"]["user_role"];
			};
		};
		Enums: {
			application_status: "pending" | "approved" | "rejected" | "processed";
			application_type: "loan" | "membership" | "savings" | "other";
			class:
				| "X TKJ 1"
				| "X TKJ 2"
				| "XI TKJ 1"
				| "XI TKJ 2"
				| "XII TKJ 1"
				| "XII TKJ 2";
			loan_status:
				| "pending"
				| "approved"
				| "rejected"
				| "active"
				| "completed"
				| "defaulted";
			member_status: "active" | "inactive" | "suspended";
			order_status:
				| "borrowed"
				| "pending"
				| "returned"
				| "rejected"
				| "lost"
				| "damaged";
			payment_method: "cash" | "transfer" | "card" | "ewallet";
			product_status:
				| "lost"
				| "available"
				| "checked out"
				| "disposed"
				| "under audit"
				| "in maintenance";
			savings_type: "regular" | "term" | "special";
			transaction_type: "income" | "expense";
			user_role: "admin" | "manager" | "kasir" | "anggota";
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
	keyof Database,
	"public"
>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
				DefaultSchema["Views"])
		? (DefaultSchema["Tables"] &
				DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema["Enums"]
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
		? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	graphql_public: {
		Enums: {},
	},
	public: {
		Enums: {
			application_status: ["pending", "approved", "rejected", "processed"],
			application_type: ["loan", "membership", "savings", "other"],
			class: [
				"X TKJ 1",
				"X TKJ 2",
				"XI TKJ 1",
				"XI TKJ 2",
				"XII TKJ 1",
				"XII TKJ 2",
			],
			loan_status: [
				"pending",
				"approved",
				"rejected",
				"active",
				"completed",
				"defaulted",
			],
			member_status: ["active", "inactive", "suspended"],
			order_status: [
				"borrowed",
				"pending",
				"returned",
				"rejected",
				"lost",
				"damaged",
			],
			payment_method: ["cash", "transfer", "card", "ewallet"],
			product_status: [
				"lost",
				"available",
				"checked out",
				"disposed",
				"under audit",
				"in maintenance",
			],
			savings_type: ["regular", "term", "special"],
			transaction_type: ["income", "expense"],
			user_role: ["admin", "manager", "kasir", "anggota"],
		},
	},
} as const;
