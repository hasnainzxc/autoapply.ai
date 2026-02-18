import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";

export const metadata = {
  title: "ApplyMate - AI Job Application Automation",
  description: "Automate your job search with AI-powered resume tailoring and applications",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#6366f1",
          colorBackground: "#0f172a",
          colorText: "#f8fafc",
        },
      }}
    >
      <html lang="en">
        <body className="bg-slate-950 text-slate-50 antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
