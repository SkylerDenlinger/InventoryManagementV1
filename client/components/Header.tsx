"use client";

import styles from "./Header.module.css";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";

export default function Header({ title = "Generic Store", subtitle = "Inventory System" }) {
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);

  function handleMenuClick() {
    if (!user) return;

    if (user.roles.includes("Admin")) {
      router.push("/districts");
    } else if (user.roles.includes("DistrictManager")) {
      router.push("/districts/district/" + user.districtId);
    } else if (user.roles.includes("StoreManager")) {
      router.push("/districts/district/" + user.districtId + "/location/" + user.locationId);
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.titleContainer}>
        <button className={styles.menuButton} aria-label="Menu Button" onClick={handleMenuClick}>
          <div className={styles.title}>{title}</div>
          <div className={styles.subtitle}>{subtitle}</div>
        </button>
      </div>
      <div className={styles.logInContainer}>
        <button className={styles.logInButton} aria-label="Log In Button" onClick={() => router.push("/login")}>
          Log In
        </button>
      </div>

    </header>
  );
}


