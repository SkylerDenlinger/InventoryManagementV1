"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  roles: string[];
  districtId: number | null;
  locationId: number | null;
};

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch("http://localhost:5230/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const user: User = await res.json();
      console.log("Fetched user:", user);
      localStorage.setItem("me", JSON.stringify(user));
    };

    fetchUser();

    const user = JSON.parse(localStorage.getItem("me") ?? "null");

    if (user) {
      if (user.roles.includes("Admin")) {
        router.replace("/admin/users");
      } else if (user.roles.includes("DistrictManager")) {
        router.replace(`/districts/district/${user.districtId}`);
      } else if (user.roles.includes("StoreManager")) {
        router.replace(`/districts/district/${user.districtId}/locations/${user.locationId}`);
      }
    }
  }, []);

  return null;
}
