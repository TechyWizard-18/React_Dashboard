import React, { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

const LoginPage = ({ auth, db }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Step 1: AUTHENTICATE - Check if email and password are correct
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Step 2: AUTHORIZE - Find the user's role by querying for their email
            const usersCollectionRef = collection(db, "users");
            const q = query(usersCollectionRef, where("email", "==", user.email));
            const querySnapshot = await getDocs(q);

            let userIsAdmin = false;
            if (!querySnapshot.empty) {
                // Assuming email is unique, there should only be one document
                const userDoc = querySnapshot.docs[0];
                if (userDoc.data().role === 'admin') {
                    userIsAdmin = true;
                }
            }

            if (userIsAdmin) {
                // SUCCESS: User is an admin.
                console.log("Admin login successful!");
            } else {
                // FAILURE: User is not an admin or has no role document.
                await signOut(auth);
                throw new Error("Access Denied: You do not have admin privileges.");
            }

        } catch (err) {
            // Handle all possible errors from both steps
            if (err.message.includes("Access Denied")) {
                setError(err.message);
            } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Invalid email or password. Please try again.');
            } else {
                setError('An unexpected error occurred. Please try again.');
                console.error("Login Error:", err);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Professional styling for the login page
    const styles = {
        container: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            background: 'linear-gradient(45deg, #1a2c3d, #0056b3)',
            backgroundSize: '200% 200%',
            animation: 'gradientAnimation 10s ease infinite',
            fontFamily: "'Inter', sans-serif"
        },
        formBox: {
            padding: '40px 50px',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            width: '420px',
            maxWidth: '90%',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            textAlign: 'center'
        },
        title: {
            color: '#1a2c3d',
            fontSize: '32px',
            fontWeight: '700',
            marginBottom: '10px'
        },
        subtitle: {
            color: '#6c757d',
            marginBottom: '30px',
            fontSize: '16px'
        },
        input: {
            width: '100%',
            padding: '14px',
            fontSize: '16px',
            border: '2px solid #e9ecef',
            borderRadius: '8px',
            background: '#f8f9fa',
            color: '#343a40',
            outline: 'none',
            boxSizing: 'border-box',
            marginBottom: '20px',
            transition: 'border-color 0.2s, box-shadow 0.2s'
        },
        button: {
            width: '100%',
            padding: '15px',
            fontSize: '18px',
            fontWeight: '600',
            color: 'white',
            background: 'linear-gradient(90deg, #007bff, #0056b3)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        },
        error: {
            color: '#721c24',
            background: '#f8d7da',
            padding: '12px',
            borderRadius: '8px',
            marginTop: '20px',
            border: '1px solid #f5c6cb'
        }
    };

    return (
        <div>
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                @keyframes gradientAnimation {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .login-input::placeholder { color: #adb5bd; }
                .login-input:focus {
                    border-color: #007bff;
                    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
                }
                .login-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(0, 91, 179, 0.2);
                }
                .login-button:disabled {
                    background: #6c757d;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }
                `}
            </style>
            <div style={styles.container}>
                <div style={styles.formBox}>
                    <h1 style={styles.title}>Admin Panel</h1>
                    <p style={styles.subtitle}>Sign in to manage your dashboard</p>
                    <form onSubmit={handleLogin}>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email Address"
                            style={styles.input}
                            className="login-input"
                            required
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            style={styles.input}
                            className="login-input"
                            required
                        />
                        <button type="submit" style={styles.button} className="login-button" disabled={isLoading}>
                            {isLoading ? 'Verifying...' : 'Sign In'}
                        </button>
                    </form>
                    {error && <p style={styles.error}>{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

