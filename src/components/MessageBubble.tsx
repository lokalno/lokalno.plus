"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
import PhotoLightbox from "./PhotoLightbox";

type MessageBubbleProps = {
  content: string;
  imageUrl?: string | null;
  senderName: string;
  createdAt: string;
  isMine: boolean;
};

export default function MessageBubble({
  content,
  imageUrl,
  senderName,
  createdAt,
  isMine,
}: MessageBubbleProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <div
        className={`max-w-[80%] rounded-xl px-4 py-2 ${
          isMine ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        {imageUrl && (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="block mb-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Фото в чаті"
              className="max-h-48 rounded-lg object-cover"
            />
          </button>
        )}
        {content.trim() && <p>{content}</p>}
        <p className={`text-xs mt-1 ${isMine ? "text-brand-100" : "text-gray-400"}`}>
          {senderName} · {formatDate(createdAt)}
        </p>
      </div>

      {imageUrl && (
        <PhotoLightbox
          photos={[imageUrl]}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          title="Фото в чаті"
        />
      )}
    </>
  );
}
