"use client";

type ShareButtonProps = {
  title: string;
};

export default function ShareButton({ title }: ShareButtonProps) {
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert("Посилання скопійовано!");
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="w-full text-sm border border-gray-200 py-2 rounded-lg hover:bg-gray-50"
    >
      📤 Поділитися
    </button>
  );
}
