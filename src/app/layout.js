import "./globals.css";

export const metadata = {
  title: "ActionBridge — Turn Learning into Action",
  description:
    "Paste a YouTube link or describe what you learned and get one clear, actionable task with simple steps to start immediately.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
