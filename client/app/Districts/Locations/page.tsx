import styles from "./page.module.css";
import Link from "next/link";
import Header from "@/components/Header";

export default function LocationPage() {
  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.pageDiv}>
        <div className = {styles.background}>
          <div className={styles.actionsGrid}>
            <Link href="/Districts/Locations/Inventory" className={styles.link}>
              <button className={styles.actionButton}>
                View Inventory
                <span className={styles.subtext}>Low stock alerts</span>
              </button>
            </Link>
            <Link href="/Districts/Locations/CreateOrder" className={styles.link}>
              <button className={styles.actionButton}>
                Create Order
                <span className={styles.subtext}>
                  Restock request · Recommended amount
                </span>
              </button>
            </Link>
            <Link href="/Districts/Locations/CycleCount" className={styles.link}>
              <button className={styles.actionButton}>
                Cycle Count
                <span className={styles.subtext}>
                  Verify physical inventory
                </span>
              </button>
            </Link>
            <Link href="/Districts/Locations/RequestItem" className={styles.link}>
              <button className={styles.actionButton}>
                Request New Item
                <span className={styles.subtext}>
                  Submit item request for approval
                </span>
              </button>
            </Link>
            <Link href="/Districts/Locations/OrderHistory" className={styles.link}>
              <button className={styles.actionButton}>
                Order History
                <span className={styles.subtext}>
                  View previous orders
                </span>
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
