import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-12 text-center text-gray-500">Завантаження...</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
