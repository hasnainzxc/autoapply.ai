import { ClerkProvider } from "@clerk/nextjs";
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
        variables: {
          colorPrimary: "#FACC15",
          colorBackground: "#080808",
          colorText: "#E4E2DD",
          colorTextOnPrimaryBackground: "#080808",
          colorInputBackground: "#1A1A1A",
          colorInputText: "#E4E2DD",
          borderRadius: "8px",
          fontFamily: "'Space Grotesk', sans-serif",
        },
        elements: {
          formButtonPrimary: {
            background: "#FACC15",
            color: "#080808",
            "&:hover": {
              background: "#EAB308",
            },
          },
          card: {
            background: "#1A1A1A",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          },
          input: {
            background: "#1A1A1A",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#E4E2DD",
          },
        },
      }}
    >
      <html lang="en">
        <head>
          <link
            href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="bg-[#080808] text-[#E4E2DD] antialiased min-h-screen">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
