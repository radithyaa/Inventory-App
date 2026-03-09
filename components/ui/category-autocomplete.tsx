"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, Plus, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { createCategory } from "@/app/products/queries";
import { cn } from "@/lib/utils";

interface CategoryAutocompleteProps {
	categories: { id: number; name: string }[];
	disabled?: boolean;
	onChange: (value: number | null) => void;
	value?: number | null;
}

function useDebounce<T>(value: T, delay: number): T {
	const [debounced, setDebounced] = React.useState<T>(value);
	React.useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);
	return debounced;
}

export function CategoryAutocomplete({
	categories,
	value,
	onChange,
	disabled,
}: CategoryAutocompleteProps) {
	const [open, setOpen] = React.useState(false);
	const [inputValue, setInputValue] = React.useState("");
	const containerRef = React.useRef<HTMLDivElement>(null);
	const inputRef = React.useRef<HTMLInputElement>(null);
	const queryClient = useQueryClient();

	const debouncedInput = useDebounce(inputValue, 200);

	const selectedCategory = categories.find((c) => c.id === value);

	const filteredCategories = React.useMemo(() => {
		if (!debouncedInput.trim()) {
			return categories;
		}
		const term = debouncedInput.toLowerCase();
		return categories.filter((c) => c.name.toLowerCase().includes(term));
	}, [categories, debouncedInput]);

	const exactMatch = categories.some(
		(c) => c.name.toLowerCase() === inputValue.trim().toLowerCase()
	);

	// Close dropdown when clicking outside
	React.useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const { mutate: addCategory, isPending: isAdding } = useMutation({
		mutationFn: createCategory,
		onSuccess: (newId) => {
			queryClient.invalidateQueries({ queryKey: ["categories"] });
			onChange(newId);
			setOpen(false);
			setInputValue("");
			toast.success("Kategori baru ditambahkan!");
		},
		onError: (error: Error) => {
			toast.error(`Gagal menambahkan kategori: ${error.message}`);
		},
	});

	const handleSelect = (id: number) => {
		onChange(id);
		setInputValue("");
		setOpen(false);
	};

	const handleClear = (e: React.MouseEvent) => {
		e.stopPropagation();
		onChange(null);
		setInputValue("");
		setOpen(false);
	};

	const handleInputFocus = () => {
		setOpen(true);
		// If there's a selected value, clear input so user can search fresh
		if (selectedCategory) {
			setInputValue("");
		}
	};

	const showDropdown = open && !disabled && !isAdding;
	const showAddButton = inputValue.trim().length > 0 && !exactMatch;

	return (
		<div className="relative w-full" ref={containerRef}>
			{/* Trigger / Input */}
			<div
				className={cn(
					"flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors",
					"focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
					disabled && "cursor-not-allowed opacity-50"
				)}
			>
				<input
					className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
					disabled={disabled || isAdding}
					onChange={(e) => {
						setInputValue(e.target.value);
						setOpen(true);
					}}
					onFocus={handleInputFocus}
					placeholder={
						selectedCategory
							? selectedCategory.name
							: "Cari atau pilih kategori..."
					}
					ref={inputRef}
					value={inputValue}
				/>

				<div className="flex items-center gap-1">
					{isAdding && (
						<Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
					)}
					{value && !isAdding && (
						<button
							className="rounded p-0.5 text-muted-foreground hover:text-foreground"
							onClick={handleClear}
							tabIndex={-1}
							type="button"
						>
							<X className="h-3.5 w-3.5" />
						</button>
					)}
					<ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
				</div>
			</div>

			{/* Dropdown */}
			{showDropdown && (
				<div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
					{/* Options list */}
					<ul className="max-h-52 overflow-y-auto py-1">
						{filteredCategories.length > 0 ? (
							filteredCategories.map((cat) => (
								<li key={cat.id}>
									<button
										className={cn(
											"flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
											value === cat.id && "bg-accent/50"
										)}
										onMouseDown={(e) => {
											// mouseDown instead of click to fire before onBlur
											e.preventDefault();
											handleSelect(cat.id);
										}}
										type="button"
									>
										<Check
											className={cn(
												"h-3.5 w-3.5 shrink-0 text-primary",
												value === cat.id ? "opacity-100" : "opacity-0"
											)}
										/>
										{cat.name}
									</button>
								</li>
							))
						) : (
							<li className="px-3 py-2 text-muted-foreground text-xs">
								Tidak ada kategori ditemukan.
							</li>
						)}
					</ul>

					{/* Add new category */}
					{showAddButton && (
						<div className="border-t p-2">
							<button
								className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 font-medium text-muted-foreground text-xs transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
								disabled={isAdding}
								onMouseDown={(e) => {
									e.preventDefault();
									addCategory(inputValue.trim());
								}}
								type="button"
							>
								<Plus className="h-3.5 w-3.5 shrink-0" />
								Tambah &quot;{inputValue.trim()}&quot;
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
