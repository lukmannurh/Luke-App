"use client";

import { useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { updateAvatarUrl } from "@/app/(dashboard)/profile/actions";
import Image from "next/image";

export function AvatarUpload({ currentAvatar, userId }: { currentAvatar?: string | null, userId: string }) {
  const [avatar, setAvatar] = useState(currentAvatar || "");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setIsUploading(true);

    try {
      // 1. Client-side compression
      const options = {
        maxSizeMB: 0.1, // 100KB
        maxWidthOrHeight: 512,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(file, options);
      
      // 2. Upload to Supabase Storage
      const supabase = createClient();
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from("avatars")
        .upload(fileName, compressedFile, { upsert: true });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // 3. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // 4. Update profile in database
      const result = await updateAvatarUrl(publicUrl);
      
      if (result?.error) {
        throw new Error(result.error);
      }

      setAvatar(publicUrl);
      setSuccess("Avatar updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to upload avatar");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="neo-card p-6 flex flex-col gap-4 items-center sm:items-start sm:flex-row">
      <div 
        className="w-24 h-24 rounded-full overflow-hidden border-4 border-[var(--color-border)] flex-shrink-0 flex items-center justify-center bg-[var(--color-muted)] relative"
        style={{ boxShadow: "var(--shadow-neo)" }}
      >
        {avatar ? (
          <Image src={avatar} alt="Avatar" fill className="object-cover" unoptimized />
        ) : (
          <span className="text-3xl">👤</span>
        )}
      </div>
      
      <div className="flex flex-col gap-3 flex-1 w-full text-center sm:text-left">
        <div>
          <h2 className="text-xl font-black" style={{ fontFamily: "var(--font-display)" }}>Profile Picture</h2>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1">JPG, PNG or WEBP. Max 100KB.</p>
        </div>
        
        <div className="flex flex-col gap-2">
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            id="avatar-upload"
            disabled={isUploading}
          />
          <label 
            htmlFor="avatar-upload"
            className={`neo-btn ${isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} self-center sm:self-start inline-block`}
          >
            {isUploading ? "Uploading..." : "Upload New Avatar"}
          </label>
        </div>

        {error && <p className="text-sm text-[var(--color-destructive)] font-bold">{error}</p>}
        {success && <p className="text-sm text-[#16a34a] font-bold">{success}</p>}
      </div>
    </div>
  );
}
