// src/Notification.jsx

import React, { useState, useEffect } from 'react';

function Notification({ message, type = 'success', duration = 3000, onDone }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                if (onDone) onDone();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [message, duration, onDone]);

    if (!visible) return null;

    return (
        <div className={`notification ${type}`}>
            {message}
        </div>
    );
}

export default Notification;