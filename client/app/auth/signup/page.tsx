'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import styles from './page.module.css';

export default function SignUpPage() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const response = await fetch('https://localhost:5230/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
            }),
        });

        if (!response.ok) {
            console.error('Signup failed');
            return;
        }

        const data = await response.json();
        console.log('User created:', data);
    }


    return (
        <div>
            <Header />
            <h1>Sign Up Page</h1>
            <p>Create a new account to get started.</p>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />

                <button type="submit">Sign Up</button>
            </form>
        </div>
    );
}