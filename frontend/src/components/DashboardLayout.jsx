"use client";
import Link from "next/link";
import styles from "./dashboard.module.css";

export default function DashboardLayout({children}) {
  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <h1 className={styles.logo}>AusCPI</h1>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navItem}>Home</Link>
          <Link href="/city" className={styles.navItem}>City</Link>
          <Link href="/category" className={styles.navItem}>Category</Link>
          <Link href="/chart" className={styles.navItem}>Chart</Link>
          <Link href="/chat" className={styles.navItem}>Chat</Link>
          <Link href="/about" className={styles.navItem}>About</Link>
        </nav>
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
