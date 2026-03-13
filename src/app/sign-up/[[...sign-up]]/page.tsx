import { SignUp } from "@clerk/nextjs";

export const dynamic = "force-static";
export const dynamicParams = false;

// For optional catch-all routes [[...param]], generateStaticParams must return the param key
export function generateStaticParams() {
    return [{ 'sign-up': [] }];
}

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <div className="w-full max-w-md">
        <SignUp 
            routing="hash"
            appearance={{
                elements: {
                    rootBox: "w-full mx-auto",
                    card: "shadow-none border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950",
                    headerTitle: "text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50",
                    headerSubtitle: "text-zinc-500 dark:text-zinc-400",
                    socialButtonsBlockButton: { display: "none" },
                    socialButtonsBlockSeparator: { display: "none" },
                    formButtonPrimary: "bg-zinc-950 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black rounded-xl transition-all",
                    footerActionLink: "text-zinc-950 dark:text-zinc-50 font-medium hover:underline",
                    formFieldLabel: "text-zinc-950 dark:text-zinc-50",
                    formFieldInput: "rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                }
            }}
        />
      </div>
    </div>
  );
}
