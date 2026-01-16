"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import Header from "@/components/Header";

type User = {
    id: string;
    email: string;
    roles: string[];
    districtId: number | null;
};

type Role = "Admin" | "DistrictManager" | "StoreManager";

export default function UsersAdminPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<Role>("StoreManager");

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [users, setUsers] = useState<User[]>([]);

    const [districtSortAsc, setDistrictSortAsc] = useState(true);

    const sortedUsers = [...users].sort((a, b) => {
        const aVal = a.districtId ?? Number.POSITIVE_INFINITY; // nulls go last
        const bVal = b.districtId ?? Number.POSITIVE_INFINITY;
        return districtSortAsc ? aVal - bVal : bVal - aVal;
    });

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        fetch("http://localhost:5230/api/admin/users", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then(setUsers)
            .catch(() => { });
    }, []);

    async function handleCreateUser(e: React.FormEvent) {
        e.preventDefault();
        setMessage(null);
        setError(null);
        setIsLoading(true);

        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                setError("No access token found. Please log in as Admin first.");
                return;
            }

            const res = await fetch("http://localhost:5230/api/admin/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ email, password, role }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => null);
                const msg =
                    body?.message ??
                    (res.status === 401 || res.status === 403
                        ? "Not authorized (are you logged in as Admin?)"
                        : "Failed to create user");
                setError(msg);
                return;
            }

            const created = await res.json();
            setMessage(`Created user: ${created.email} (${created.role})`);

            setEmail("");
            setPassword("");
            setRole("StoreManager");
        } catch {
            setError("Could not reach API (is it running?)");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className={styles.pageDiv}>
            <Header />

            <div className={styles.mainPageDiv}>
                {/* LEFT PANEL */}
                <div className={styles.leftPanel}>
                    <h1 className={styles.pageTitle}>Users Admin Page</h1>
                    <p className={styles.pageSubtitle}>
                        Manage users from this admin interface.
                    </p>

                    <hr className={styles.divider} />

                    <h2 className={styles.sectionTitle}>Create User</h2>

                    <form
                        onSubmit={handleCreateUser}
                        className={styles.createUserForm}
                    >
                        <label className={styles.formLabel}>
                            <span className={styles.labelText}>Email</span>
                            <input
                                className={styles.textInput}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                type="email"
                                placeholder="newuser@local.com"
                                required
                            />
                        </label>

                        <label className={styles.formLabel}>
                            <span className={styles.labelText}>Temporary Password</span>
                            <input
                                className={styles.textInput}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                type="password"
                                placeholder="Password123!"
                                required
                            />
                        </label>

                        <label className={styles.formLabel}>
                            <span className={styles.labelText}>Role</span>
                            <select
                                className={styles.selectInput}
                                value={role}
                                onChange={(e) => setRole(e.target.value as Role)}
                            >
                                <option value="Admin">Admin</option>
                                <option value="DistrictManager">District Manager</option>
                                <option value="StoreManager">Store Manager</option>
                            </select>
                        </label>

                        <button
                            className={styles.submitButton}
                            disabled={isLoading}
                            type="submit"
                        >
                            {isLoading ? "Creating..." : "Create User"}
                        </button>

                        {message && (
                            <p className={styles.successMessage}>{message}</p>
                        )}
                        {error && <p className={styles.errorMessage}>{error}</p>}
                    </form>
                </div>

                {/* RIGHT PANEL */}
                <div className={styles.rightPanel}>
                    <h2 className={styles.sectionTitle}>Existing Users</h2>

                    <div className={styles.tableWrap}>
                        <table className={styles.usersTable}>
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Roles</th>
                                    <th>
                                        <button
                                            type="button"
                                            className={styles.thButton}
                                            onClick={() => setDistrictSortAsc((v) => !v)}
                                            aria-label="Sort by district"
                                        >
                                            District
                                            <span className={styles.sortIcon}>
                                                {districtSortAsc ? "▲" : "▼"}
                                            </span>
                                        </button>
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {sortedUsers.map((u) => (
                                    <tr key={u.id}>
                                        <td>{u.email}</td>

                                        <td>
                                            {u.roles?.length ? (
                                                <div className={styles.rolePills}>
                                                    {u.roles.map((r) => (
                                                        <span key={r} className={styles.rolePill}>
                                                            {r}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className={styles.mutedCell}>No roles</span>
                                            )}
                                        </td>

                                        <td>{u.districtId ?? <span className={styles.mutedCell}>—</span>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
