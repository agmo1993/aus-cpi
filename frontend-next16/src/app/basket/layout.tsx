/**
 * Basket page layout: no TopNav, full viewport for immersive form experience.
 */

export default function BasketLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
