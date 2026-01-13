import styles from './page.module.css';
import Link from 'next/link';
import Header from '@/components/Header';

export default function AuthPage() {
    return (
        <div>
            <Header />
            <h1>Authentication Page</h1>
            <p>Please log in to access your account.</p>
            {/* Add your authentication form or components here */}

            <div className = {styles.authform}>
                <input type="text" placeholder="Username" />
                <input type="password" placeholder="Password" />
                <button type="submit">Sign In</button>

                <Link href="/auth/signup">Don't have an account? Sign Up</Link>
            </div>
        </div>
    );
}