"use client";

import imageCompression from "browser-image-compression";
import { Loader2, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { uploadToS3 } from "@/utils/s3-client";

interface ImageUploadProps {
	disabled?: boolean;
	onChange: (url: string) => void;
	value?: string;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [preview, setPreview] = useState<string | null>(value || null);

	const onDrop = useCallback(
		async (acceptedFiles: File[]) => {
			const file = acceptedFiles[0];
			if (!file) {
				return;
			}

			setIsUploading(true);
			try {
				// 1. Compression Options
				const options = {
					maxSizeMB: 0.05, // Max 50KB
					maxWidthOrHeight: 1200, // Reasonable resolution
					useWebWorker: true,
					fileType: "image/webp", // Good for web
				};

				// 2. Compress the image on the client
				const compressedFile = await imageCompression(file, options);

				// 3. Temporary local preview
				const localPreview = URL.createObjectURL(compressedFile);
				setPreview(localPreview);

				// 4. Upload to S3
				const publicUrl = await uploadToS3(compressedFile as File);

				// 5. Success
				onChange(publicUrl);
				toast.success("Image uploaded successfully!");
			} catch (error) {
				console.error("Upload error:", error);
				toast.error(
					"Failed to process image. Make sure S3 credentials are set."
				);
				setPreview(null);
			} finally {
				setIsUploading(false);
			}
		},
		[onChange]
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"image/*": [".jpeg", ".jpg", ".png", ".webp"],
		},
		maxFiles: 1,
		disabled: disabled || isUploading,
	});

	const removeImage = (e: React.MouseEvent) => {
		e.stopPropagation();
		setPreview(null);
		onChange("");
	};

	return (
		<div className="w-full space-y-4">
			<div
				{...getRootProps()}
				className={`relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-all ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
          ${disabled || isUploading ? "cursor-not-allowed opacity-50" : ""}
        `}
			>
				<input {...getInputProps()} />

				{preview ? (
					<div className="group relative h-[140px] w-full">
						<Image
							alt="Product Preview"
							className="h-full w-full rounded-md object-contain"
							height={500}
							src={preview}
							width={500}
						/>
						{!(disabled || isUploading) && (
							<button
								className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm transition-transform hover:scale-110"
								onClick={removeImage}
								type="button"
							>
								<X size={14} />
							</button>
						)}
					</div>
				) : (
					<div className="flex flex-col items-center gap-2 text-muted-foreground">
						<div className="rounded-full bg-muted p-3">
							{isUploading ? (
								<Loader2 className="animate-spin text-primary" size={24} />
							) : (
								<UploadCloud size={24} />
							)}
						</div>
						<div className="text-center">
							<p className="font-medium text-sm">
								{isUploading
									? "Uploading..."
									: isDragActive
										? "Drop image here"
										: "Click or drag image to upload"}
							</p>
							<p className="text-xs">Max 1MB, optimized automatically</p>
						</div>
					</div>
				)}
			</div>

			{value && !preview && (
				<p className="truncate text-muted-foreground text-xs italic">
					Current attachment: {value}
				</p>
			)}
		</div>
	);
}
