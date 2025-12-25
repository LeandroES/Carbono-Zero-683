// src/SettingsView.jsx

import React, { useState, useContext } from 'react';
import { AuthContext } from './AuthContext';

function SettingsView() {
    const { setNotification } = useContext(AuthContext);

    // Estado para los datos del formulario
    const [settings, setSettings] = useState({
        taxRate: '11.00',
        co2Good: '800',
        co2Regular: '1200'
    });

    // Estado para los errores de validación
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({...prev, [name]: value}));
    };

    const validateSettings = () => {
        const newErrors = {};
        if (Number(settings.taxRate) <= 0) {
            newErrors.taxRate = 'La tasa debe ser un número positivo.';
        }
        if (Number(settings.co2Good) <= 0) {
            newErrors.co2Good = 'El umbral debe ser un número positivo.';
        }
        if (Number(settings.co2Regular) <= Number(settings.co2Good)) {
            newErrors.co2Regular = 'El umbral "Regular" debe ser mayor que el "Bueno".';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const handleSave = () => {
        if (validateSettings()) {
            // En una app real, aquí se enviaría la info a la API
            setNotification({ message: "Ajustes guardados correctamente." });
            console.log("Guardando ajustes:", settings);
        }
    }

    return (
        <div className="mosaic-panel">
            <h2 style={{ marginTop: 0 }}>Ajustes del Sistema (Solo Admin)</h2>
            <div className="mosaic-panel-inset" style={{padding: '1.5rem'}}>
                <div style={{marginBottom: '1rem'}}>
                    <label>Tasa de Impuesto (USD/tCO₂e):</label>
                    <input type="number" name="taxRate" value={settings.taxRate} onChange={handleChange} style={{marginLeft: '1rem'}}/>
                    {errors.taxRate && <p className="error-message" style={{marginLeft: '1rem'}}>{errors.taxRate}</p>}
                </div>
                <div style={{marginBottom: '1rem'}}>
                    <label>Umbral CO₂ "Bueno" (ppm):</label>
                    <input type="number" name="co2Good" value={settings.co2Good} onChange={handleChange} style={{marginLeft: '1rem'}}/>
                    {errors.co2Good && <p className="error-message" style={{marginLeft: '1rem'}}>{errors.co2Good}</p>}
                </div>
                <div style={{marginBottom: '1rem'}}>
                    <label>Umbral CO₂ "Regular" (ppm):</label>
                    <input type="number" name="co2Regular" value={settings.co2Regular} onChange={handleChange} style={{marginLeft: '1rem'}}/>
                    {errors.co2Regular && <p className="error-message" style={{marginLeft: '1rem'}}>{errors.co2Regular}</p>}
                </div>
                <button className="mosaic-button" onClick={handleSave}>Guardar Ajustes</button>
            </div>
        </div>
    )
}

export default SettingsView;