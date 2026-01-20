"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import Header from "@/components/Header";

export default function HomePage() {
  const router = useRouter();
  const { user, status } = useAppSelector((s) => s.auth);

  useEffect(() => {
    // 1) While the app is still initializing auth, do nothing.
    if (status === "idle" || status === "loading") return;

    // 2) If we already have a user, route by role.
    if (user) {
      if (user.roles.includes("Admin")) router.replace("/districts");
      else if (user.roles.includes("DistrictManager"))
        router.replace(`/districts/district/${user.districtId}`);
      else if (user.roles.includes("StoreManager"))
        router.replace(`/districts/district/${user.districtId}/location/${user.locationId}`);
      else router.replace("/unauthorized");
      return;
    }

    // 3) Only now (after initialized) send to login.
    router.replace("/login");
  }, [router, user, status]);

  return (
    <div>
      <Header />
    </div>
  );
}
