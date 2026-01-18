"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import Header from "@/components/Header";

type User = {
    id: string;
    email: string;
    roles: string[];
    districtId: number | null;
    locationId: number | null;
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

    const [districtId, setDistrictId] = useState<string>("");
    const [locationId, setLocationId] = useState<string>("");


    // Track deletions per-user so only that row shows "Deleting..."
    const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});

    function hasRole(u: User, role: string) {
        return (u.roles ?? []).includes(role);
    }

    function sortByEmail(a: User, b: User) {
        return (a.email ?? "").localeCompare(b.email ?? "");
    }

    function sortStoreManagers(a: User, b: User) {
        // Order store managers nicely under a district manager:
        // by locationId first (nulls last), then email
        const aLoc = a.locationId ?? Number.POSITIVE_INFINITY;
        const bLoc = b.locationId ?? Number.POSITIVE_INFINITY;
        if (aLoc !== bLoc) return aLoc - bLoc;
        return sortByEmail(a, b);
    }

    const sortedUsers = (() => {
        const admins = users.filter(u => hasRole(u, "Admin")).sort(sortByEmail);

        const districtManagers = users
            .filter(u => hasRole(u, "DistrictManager") && !hasRole(u, "Admin"))
            .sort((a, b) => {
                const aDist = a.districtId ?? Number.POSITIVE_INFINITY;
                const bDist = b.districtId ?? Number.POSITIVE_INFINITY;
                if (aDist !== bDist) return aDist - bDist;
                return sortByEmail(a, b);
            });

        const storeManagers = users
            .filter(u => hasRole(u, "StoreManager") && !hasRole(u, "Admin") && !hasRole(u, "DistrictManager"));

        // Map districtId -> store managers in that district
        const storesByDistrict = new Map<number, User[]>();
        const unscopedStores: User[] = [];

        for (const sm of storeManagers) {
            if (sm.districtId == null) {
                unscopedStores.push(sm);
                continue;
            }
            const arr = storesByDistrict.get(sm.districtId) ?? [];
            arr.push(sm);
            storesByDistrict.set(sm.districtId, arr);
        }

        // Build final list: Admins, then each DM followed by their stores
        const result: User[] = [...admins];

        const usedStoreIds = new Set<string>();

        for (const dm of districtManagers) {
            result.push(dm);

            const dist = dm.districtId;
            if (dist != null) {
                const stores = (storesByDistrict.get(dist) ?? []).sort(sortStoreManagers);
                for (const sm of stores) {
                    result.push(sm);
                    usedStoreIds.add(sm.id);
                }
            }
        }

        // Any store managers with a districtId that didn't have a DM, plus unscoped stores
        const leftoverStores = storeManagers
            .filter(sm => !usedStoreIds.has(sm.id))
            .sort((a, b) => {
                const aDist = a.districtId ?? Number.POSITIVE_INFINITY;
                const bDist = b.districtId ?? Number.POSITIVE_INFINITY;
                if (aDist !== bDist) return aDist - bDist;
                return sortStoreManagers(a, b);
            });

        // Put unscoped stores dead last
        const unscopedSorted = unscopedStores.sort(sortStoreManagers);

        result.push(...leftoverStores.filter(sm => sm.districtId != null));
        result.push(...unscopedSorted);

        return result;
    })();


    async function loadUsers() {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const res = await fetch("http://localhost:5230/api/admin/users", {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to load users");
        const data = await res.json();
        setUsers(data);
    }

    useEffect(() => {
        loadUsers().catch(() => { });
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

            const payload: any = { email, password, role };

            if (role === "DistrictManager") {
                const parsed = Number(districtId);
                if (!Number.isFinite(parsed) || parsed <= 0) {
                    setError("DistrictId must be a positive number.");
                    setIsLoading(false);
                    return;
                }
                payload.districtId = parsed;
            }

            if (role === "StoreManager") {
                const parsed1 = Number(locationId);
                if (!Number.isFinite(parsed1) || parsed1 <= 0) {
                    setError("LocationId must be a positive number.");
                    setIsLoading(false);
                    return;
                }
                payload.locationId = parsed1;
                const parsed2 = Number(districtId);
                if (!Number.isFinite(parsed2) || parsed2 <= 0) {
                    setError("DistrictId must be a positive number.");
                    setIsLoading(false);
                    return;
                }
                payload.districtId = parsed2;
            }

            // Admin: send nothing extra


            const res = await fetch("http://localhost:5230/api/admin/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
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
            setDistrictId("");
            setLocationId("");
            setRole("StoreManager");

            // Refresh list (or you can optimistically append)
            await loadUsers();
        } catch {
            setError("Could not reach API (is it running?)");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDeleteUser(userId: string, userEmail: string) {
        setMessage(null);
        setError(null);

        const ok = window.confirm(`Delete user "${userEmail}"? This cannot be undone.`);
        if (!ok) return;

        const token = localStorage.getItem("accessToken");
        if (!token) {
            setError("No access token found. Please log in as Admin first.");
            return;
        }

        setDeletingIds((prev) => ({ ...prev, [userId]: true }));

        try {
            const res = await fetch(`http://localhost:5230/api/admin/users/${userId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const body = await res.json().catch(() => null);
                const msg =
                    body?.message ??
                    (res.status === 401 || res.status === 403
                        ? "Not authorized (are you logged in as Admin?)"
                        : "Failed to delete user");
                setError(msg);
                return;
            }

            // Optimistic remove from UI
            setUsers((prev) => prev.filter((u) => u.id !== userId));
            setMessage(`Deleted user: ${userEmail}`);
        } catch {
            setError("Could not reach API (is it running?)");
        } finally {
            setDeletingIds((prev) => {
                const copy = { ...prev };
                delete copy[userId];
                return copy;
            });
        }
    }

    return (
        <div className={styles.pageDiv}>
            <Header />

            <div className={styles.mainPageDiv}>
                {/* LEFT PANEL */}
                <div className={styles.leftPanel}>
                    <h1 className={styles.pageTitle}>Users Admin Page</h1>
                    <p className={styles.pageSubtitle}>Manage users from this admin interface.</p>

                    <hr className={styles.divider} />

                    <h2 className={styles.sectionTitle}>Create User</h2>

                    <form onSubmit={handleCreateUser} className={styles.createUserForm}>
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

                        {/* DistrictId (DistrictManager OR StoreManager) */}
                        {(role === "DistrictManager" || role === "StoreManager") && (
                            <label className={styles.formLabel}>
                                <span className={styles.labelText}>District Id</span>
                                <input
                                    className={styles.textInput}
                                    value={districtId}
                                    onChange={(e) => setDistrictId(e.target.value)}
                                    inputMode="numeric"
                                    placeholder="e.g. 1"
                                    required
                                />
                            </label>
                        )}

                        {/* LocationId (StoreManager only) */}
                        {role === "StoreManager" && (
                            <label className={styles.formLabel}>
                                <span className={styles.labelText}>Location Id</span>
                                <input
                                    className={styles.textInput}
                                    value={locationId}
                                    onChange={(e) => setLocationId(e.target.value)}
                                    inputMode="numeric"
                                    placeholder="e.g. 1"
                                    required
                                />
                            </label>
                        )}


                        <button className={styles.submitButton} disabled={isLoading} type="submit">
                            {isLoading ? "Creating..." : "Create User"}
                        </button>

                        {message && <p className={styles.successMessage}>{message}</p>}
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
                                    <th>Location</th>
                                    <th>Delete</th>
                                </tr>
                            </thead>

                            <tbody>
                                {sortedUsers.map((u) => (
                                    <tr key={u.id}>
                                        <td>
                                            <span className={styles.emailCell} title={u.email}>
                                                {u.email}
                                            </span>
                                        </td>


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

                                        <td>
                                            {u.districtId ?? (
                                                <span className={styles.mutedCell}>—</span>
                                            )}
                                        </td>

                                        <td>
                                            {u.locationId ?? (
                                                <span className={styles.mutedCell}>—</span>
                                            )}
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className={styles.deleteButton}
                                                onClick={() => handleDeleteUser(u.id, u.email)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>

                        </table>
                    </div>

                    {/* show messages on right too if you want */}
                    {message && <p className={styles.successMessage}>{message}</p>}
                    {error && <p className={styles.errorMessage}>{error}</p>}
                </div>
            </div>
        </div>
    );
}
