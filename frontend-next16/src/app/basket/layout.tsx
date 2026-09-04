/**
 * Basket page layout.
 * The questionnaire can take the full viewport; site chrome (TopNav / footer)
 * animates away via ChromeProvider while the form is immersive.
 */

export default function BasketLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
