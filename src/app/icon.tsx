import { ImageResponse } from "next/og";
import { LokalnoIconMark } from "@/lib/lokalno-icon";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<LokalnoIconMark size={32} />, {
    ...size,
  });
}
