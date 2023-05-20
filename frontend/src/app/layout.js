import './globals.css'
import { Inter } from 'next/font/google'
import packageJson from "../../package.json";
import Image from "next/image";
import Link from "next/link";

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Aus-CPI',
  description: `AusCPI is a powerful dashboard that offers users a range of tools to
  analyze and visualize consumer price index (CPI) data from the
  Australian Bureau of Statistics.`,
  icons: {
    icon: {
      url: "/favicon.png",
      type: "image/png",
    },
    shortcut: { url: "/favicon.png", type: "image/png" },
  }
}

export const RootLayout = ({ children }) => {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <div className="sidebar">
            <div className="logo-item">
              <Image src="/images/logo.png" alt="AusCPI" width={170} height={170} />
            </div>
            <Link href="/">
              <div className="sidebar-item" id="home">
                Home
              </div>
            </Link>
            <Link href="/city">
              <div className="sidebar-item">
                City
              </div>
            </Link>
            <Link href="/category">
              <div className="sidebar-item">
                Category
              </div>
            </Link>
            <Link href="/about">
              <div className="sidebar-item">
                About
              </div>
            </Link>
            <div className="sidebar-item" style={{ position: 'absolute', bottom: 0 }}>
              <Link href="/about">v{packageJson.version}</Link>
            </div>
          </div>
          <div className="bottom-bar">
            <div className="bottom-bar-item">
              <Image src="/images/logo.png" alt="AusCPI" width={70} height={70} />
            </div>
            <div className="bottom-bar-item">
              <Link href="/">
                <Image src="/icons/home.png" alt="home" width={30} height={30} />
              </Link>
            </div>
            <div className="bottom-bar-item">
              <Link href="/category">
                <Image src="/icons/category.png" alt="category" width={30} height={30} />
              </Link>
            </div>
            <div className="bottom-bar-item">
              <Link href="/city">
                <Image src="/icons/city.png" alt="city" width={30} height={30} />
              </Link>
            </div>
            <div className="bottom-bar-item">
              <Link href="/about">
                <Image src="/icons/about.png" alt="city" width={30} height={30} />
              </Link>
            </div>
          </div>
          <div className="content">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
};

export default RootLayout;