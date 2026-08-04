"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AvatarUpload({
  userId,
  initialAvatarUrl,
  initials,
  ringClass,
}: {
  userId: string;
  initialAvatarUrl: string | null;
  initials: string;
  ringClass?: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    setIsUploading(true);
    setError(null);

    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setIsUploading(false);
      setError(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);
    const publicUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", userId);

    setIsUploading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setAvatarUrl(publicUrl);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-zinc-800 ring-2 ring-offset-2 ring-offset-zinc-950 ${
          ringClass ?? "ring-zinc-800"
        }`}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt="Profile photo"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-zinc-400">
            {initials}
          </span>
        )}
        {isUploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-zinc-100">
            ...
          </span>
        )}
      </button>
      <div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="text-sm text-zinc-300 underline disabled:opacity-50"
        >
          {avatarUrl ? "Change photo" : "Add photo"}
        </button>
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
