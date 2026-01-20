// app/districts/district/[districtId]/location/[locationId]/LocationClient.tsx
"use client";

import styles from "./page.module.css";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";

type Props = {
  districtId: string;
  locationId: string;
};

export default function LocationClient({ districtId, locationId }: Props) {
  const router = useRouter();

  const base = `/districts/district/${districtId}/location/${locationId}`;

  return (
    <div className={styles.pageWrapper}>
      <Header />

      <div>
        <h1>District {districtId}</h1>
        <h2>Location {locationId}</h2>
      </div>

      <main className={styles.pageDiv}>
        <div className={styles.background}>
          <div className={styles.actionsGrid}>
            <button
              className={styles.actionButton}
              onClick={() => router.push(`${base}/viewInventory`)}
            >
              View Inventory
              <span className={styles.subtext}>Low stock alerts</span>
            </button>

            <button
              className={styles.actionButton}
              onClick={() => router.push(`${base}/createOrder`)}
            >
              Create Order
              <span className={styles.subtext}>
                Restock request · Recommended amount
              </span>
            </button>

            <button
              className={styles.actionButton}
              onClick={() => router.push(`${base}/cycleCount`)}
            >
              Cycle Count
              <span className={styles.subtext}>Verify physical inventory</span>
            </button>

            <button
              className={styles.actionButton}
              onClick={() => router.push(`${base}/requestNewItem`)}
            >
              Request New Item
              <span className={styles.subtext}>
                Submit item request for approval
              </span>
            </button>

            <button
              className={styles.actionButton}
              onClick={() => router.push(`${base}/orderHistory`)}
            >
              Order History
              <span className={styles.subtext}>View previous orders</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
