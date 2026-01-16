"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "@/components/Header";
import styles from "./page.module.css";

type User = {
    id: string;
    email: string;
    roles: string[];
    districtId: number | null;
    locationId: number | null;
};

export default function LoginPage() {

    const router = useRouter();

    const [email, setEmail] = useState("storemanager1@local.com");
    const [password, setPassword] = useState("Password123!");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        fetch("http://localhost:5230/api/admin/users", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => res.ok ? res.json() : Promise.reject())
            .then(setUsers)
            .catch(() => { });
    }, []);


    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
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

            localStorage.setItem("accessToken", data.accessToken);

            const meRes = await fetch("http://localhost:5230/api/auth/me", {
                headers: {
                    Authorization: `Bearer ${data.accessToken}`,
                },
            });

            if (!meRes.ok) throw new Error("Failed to load user info");

            const me = await meRes.json();
            const roles: string[] = me.roles;
            const districtId = me.districtId;
            const locationId = me.locationId;

            if (roles.includes("Admin")) router.push("/admin");
            else if (roles.includes("DistrictManager")) router.push(`/districts/district/${districtId}`);
            else if (roles.includes("StoreManager")) router.push(`/districts/district/${districtId}/location/${locationId}`);
            else router.push("/unauthorized");
        } catch {
            setError("Could not reach API (is it running?)");
        } finally {
            setIsLoading(false);
        }
    }

    // ✅ Component return MUST be here (not inside handleSubmit)
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
