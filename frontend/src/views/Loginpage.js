import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

function LoginPage() {
    const { loginUser } = useContext(AuthContext);

    const handleSubmit = e => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        email && loginUser(email, password);
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <form onSubmit={handleSubmit} style={{ width: '300px', textAlign: 'center' }}>
                <h2>Welcome Back 👋</h2>
                <div style={{ marginBottom: '15px' }}>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
                    />
                </div>
                <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#333', color: '#fff' }}>
                    Login
                </button>
                <p style={{ marginTop: '15px' }}>
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </form>
        </div>
    );
}

export default LoginPage;
