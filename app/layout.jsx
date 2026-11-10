import "./globals.css";

export const metadata = {
  title: "CampusCore",
  description: "University academic and housing portal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
