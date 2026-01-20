"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import styles from "./page.module.css";

import { useAppDispatch } from "@/store/hooks";
import { setToken, fetchMe } from "@/store/authSlice";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("storemanager1_1@local.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1) Login -> get access token
      const res = await fetch("http://localhost:5230/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError("Invalid credentials");
        return;
      }

      const data: { accessToken: string } = await res.json();

      // 2) Store token in Redux (+ localStorage via your reducer)
      dispatch(setToken(data.accessToken));

      // 3) Hydrate user into Redux by calling /me
      const me = await dispatch(fetchMe()).unwrap();

      // 4) Route based on roles (ONLY happens after submit)
      if (me.roles.includes("Admin")) router.replace("/districts");
      else if (me.roles.includes("DistrictManager"))
        router.replace(`/districts/district/${me.districtId}`);
      else if (me.roles.includes("StoreManager"))
        router.replace(
          `/districts/district/${me.districtId}/location/${me.locationId}`
        );
      else router.replace("/unauthorized");
    } catch {
      setError("Could not reach API (is it running?)");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.pageDiv}>
      <Header />

      <div style={{ padding: 24, maxWidth: 420 }}>
        <h1>Login</h1>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            required
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            required
          />

          <button disabled={isLoading} type="submit">
            {isLoading ? "Logging in..." : "Login"}
          </button>

          {error && <p style={{ color: "red" }}>{error}</p>}
        </form>

        <p>Logins:</p>
        <ul>
          <li>storemanager1@local.com / Password123!</li>
          <li>districtmanager1@local.com / Password123!</li>
          <li>admin@local.com / Admin123!</li>
        </ul>
      </div>
    </div>
  );
}
