import './globals.css';
import { Inter } from 'next/font/google';
import DashboardLayout from '../components/DashboardLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Aus-CPI',
  description: `AusCPI is a powerful dashboard that offers users a range of tools to
  analyze and visualize consumer price index (CPI) data from the
  Australian Bureau of Statistics.`,
};

export const RootLayout = ({ children }) => {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
};

export default RootLayout;
