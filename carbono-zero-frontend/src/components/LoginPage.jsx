// src/LoginPage.jsx

import React, { useState, useContext } from 'react';
import { AuthContext } from './AuthContext';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);

    const handleLogin = () => {
        setError('');
        // --- NUEVA VALIDACIÓN ---
        if (!username.trim() || !password.trim()) {
            setError('El usuario y la contraseña no pueden estar vacíos.');
            return;
        }

        const success = login(username, password);
        if (!success) {
            setError('Credenciales incorrectas. Intenta con "admin/admin" o "docente/docente".');
        }
    };

    // ... (el resto del JSX no cambia)
    return (
        <div className="login-container">
            <div className="mosaic-panel">
                <h2 style={{ marginTop: 0, textAlign: 'center' }}>Carbono Zero 683</h2>
                <h3 style={{ textAlign: 'center' }}>Iniciar Sesión</h3>

                <label>Usuario:</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ width: '95%', padding: '8px', marginBottom: '1rem' }}
                />

                <label>Contraseña:</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '95%', padding: '8px', marginBottom: '1.5rem' }}
                />

                {error && <p className="error-message">{error}</p>}

                <div style={{ textAlign: 'center' }}>
                    <button className="mosaic-button" onClick={handleLogin}>
                        Ingresar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;