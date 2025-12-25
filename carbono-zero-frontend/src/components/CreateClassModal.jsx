// src/components/CreateClassModal.jsx
import React, { useState, useEffect } from 'react';

const inputStyle = { width: '95%', padding: '8px', fontFamily: 'Times New Roman, Times, serif', fontSize: '16px', marginBottom: '1rem', border: '1px solid #808080' };
const labelStyle = { display: 'block', marginBottom: '5px' };
const timeInputContainerStyle = { display: 'flex', gap: '1rem', alignItems: 'center' };

function CreateClassModal({ onSave, onClose, existingClass }) {
    const [formData, setFormData] = useState({
        name: '',
        schedule_day: '0',
        schedule_start: '',
        schedule_end: '',
        capacity: '',
        volume: '',
        area: '',
        ventilation: 'Mixto'
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (existingClass) {
            setFormData({
                name: existingClass.name,
                schedule_day: String(existingClass.schedule_day),
                schedule_start: existingClass.schedule_start,
                schedule_end: existingClass.schedule_end,
                capacity: existingClass.capacity,
                volume: existingClass.volume,
                area: existingClass.area,
                ventilation: existingClass.ventilation
            });
        }
    }, [existingClass]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'El nombre no puede estar vacío.';
        if (!formData.schedule_start) newErrors.schedule_start = 'Debe ingresar una hora de inicio.';
        if (!formData.schedule_end) newErrors.schedule_end = 'Debe ingresar una hora de fin.';
        if (formData.schedule_start && formData.schedule_end && formData.schedule_start >= formData.schedule_end) {
            newErrors.schedule_end = 'La hora de fin debe ser posterior a la de inicio.';
        }
        if (!formData.capacity || Number(formData.capacity) <= 0) newErrors.capacity = 'El aforo debe ser un número positivo.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validateForm()) {
            const finalData = {
                ...formData,
                schedule_day: Number(formData.schedule_day),
                capacity: Number(formData.capacity),
                volume: Number(formData.volume),
                area: Number(formData.area),
            };
            if (existingClass && existingClass.id) {
                finalData.id = existingClass.id;
            }
            onSave(finalData);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="mosaic-panel modal-content">
                <h2 style={{ marginTop: 0 }}>
                    {existingClass ? 'Editar Clase' : 'Crear Nueva Clase'}
                </h2>

                <label style={labelStyle}>Nombre de la Clase:</label>
                <input style={inputStyle} type="text" name="name" value={formData.name} onChange={handleChange} />
                {errors.name && <p className="error-message">{errors.name}</p>}

                <div style={timeInputContainerStyle}>
                    <div>
                        <label style={labelStyle}>Día:</label>
                        <select style={inputStyle} name="schedule_day" value={formData.schedule_day} onChange={handleChange}>
                            <option value="0">Lunes</option>
                            <option value="1">Martes</option>
                            <option value="2">Miércoles</option>
                            <option value="3">Jueves</option>
                            <option value="4">Viernes</option>
                            <option value="5">Sábado</option>
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Hora de Inicio:</label>
                        <input style={inputStyle} type="time" name="schedule_start" value={formData.schedule_start} onChange={handleChange} />
                        {errors.schedule_start && <p className="error-message">{errors.schedule_start}</p>}
                    </div>
                    <div>
                        <label style={labelStyle}>Hora de Fin:</label>
                        <input style={inputStyle} type="time" name="schedule_end" value={formData.schedule_end} onChange={handleChange} />
                        {errors.schedule_end && <p className="error-message">{errors.schedule_end}</p>}
                    </div>
                </div>

                <label style={labelStyle}>Aforo (Nº personas):</label>
                <input style={inputStyle} type="number" name="capacity" value={formData.capacity} onChange={handleChange} min="1" />
                {errors.capacity && <p className="error-message">{errors.capacity}</p>}

                <label style={labelStyle}>Volumen (m³):</label>
                <input style={inputStyle} type="number" name="volume" value={formData.volume || ''} onChange={handleChange} min="1" />

                <label style={labelStyle}>Área (m²):</label>
                <input style={inputStyle} type="number" name="area" value={formData.area || ''} onChange={handleChange} min="1" />

                <label style={labelStyle}>Tipo de Ventilación:</label>
                <select style={inputStyle} name="ventilation" value={formData.ventilation} onChange={handleChange}>
                    <option value="Natural">Natural</option>
                    <option value="HVAC">Forzada (HVAC)</option>
                    <option value="Mixto">Mixto</option>
                </select>

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button className="mosaic-button" onClick={onClose}>Cancelar</button>
                    <button className="mosaic-button" onClick={handleSave}>Guardar Cambios</button>
                </div>
            </div>
        </div>
    );
}
export default CreateClassModal;