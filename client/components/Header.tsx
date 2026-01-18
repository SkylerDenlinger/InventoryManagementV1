"use client";

import styles from "./Header.module.css";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type HeaderProps = {
  title?: string;
  subtitle?: string;
};

type User = {
  id: string;
  email: string;
  roles: string[];
  districtId: number | null;
  locationId: number | null;
};

export default function Header({
  title = "Generic Store",
  subtitle = "Inventory System",
}: HeaderProps) {

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const res = await fetch("http://localhost:5230/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Failed to fetch /me");
        return;
      }

      const user: User = await res.json();
      console.log("Fetched user:", user);
      localStorage.setItem("me", JSON.stringify(user));
    };

    fetchUser();
  }, []);

  const user = JSON.parse(localStorage.getItem("me") ?? "null");

  const router = useRouter();

  function handleMenuClick() {
    if (user && user.roles.includes("Admin")) {
      router.push("/districts");
    } else if (user && user.roles.includes("DistrictManager")) {
      router.push("/districts/district/" + user.districtId);
    } else if (user && user.roles.includes("StoreManager")) {
      router.push("/districts/district/" + user.districtId + "/location/" + user.locationId);
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.titleContainer}>
        <button className={styles.menuButton} aria-label="Menu Button" onClick={() => handleMenuClick()}>
          <div className={styles.title}>{title}</div>
          <div className={styles.subtitle}>{subtitle}</div>
        </button>
      </div>
    </header>
  );
}