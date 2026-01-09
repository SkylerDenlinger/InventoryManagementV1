import styles from "./page.module.css";
import Header from "@/components/Header";

export default function LocationPage() {
  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.pageDiv}>
        <div className={styles.actionsGrid}>
          <button className={styles.actionButton}>
            View Inventory
            <span className={styles.subtext}>Low stock alerts</span>
          </button>

          <button className={styles.actionButton}>
            Create Order
            <span className={styles.subtext}>
              Restock request · Recommended amount
            </span>
          </button>

          <button className={styles.actionButton}>
            Cycle Count
            <span className={styles.subtext}>
              Verify physical inventory
            </span>
          </button>

          <button className={styles.actionButton}>
            Request New Item
            <span className={styles.subtext}>
              Submit item request for approval
            </span>
          </button>

          <button className={styles.actionButton}>
            Order History
            <span className={styles.subtext}>
              View previous orders
            </span>
          </button>
        </div>
      </main>
    </div>
  );
}
