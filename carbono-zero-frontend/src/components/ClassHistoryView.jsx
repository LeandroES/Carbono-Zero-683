// src/components/ClassHistoryView.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, Filler } from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, Filler);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    scales: {
        x: {
            type: 'time',
            time: {
                unit: 'minute',
                tooltipFormat: 'HH:mm - dd/MM/yy',
                displayFormats: { minute: 'HH:mm' }
            },
            title: { display: true, text: 'Hora de la Lectura (Intervalos de 15 min)' }
        },
        y_co2: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
                display: true,
                text: 'CO₂ Promedio (ppm)'
            },
            beginAtZero: false
        },
    },
    plugins: {
        legend: { position: 'bottom' },
        title: {
            display: true,
            text: 'Evolución de las Mediciones en el Tiempo',
            font: { size: 16, family: "'Times New Roman', Times, serif" }
        },
    },
};


function ClassHistoryView({ classData, onReturn }) {
    // Estados para la UI y los filtros, ahora más completos
    const [filterMode, setFilterMode] = useState('none'); // <-- Por defecto en "Todo el Historial"
    const [specificDate, setSpecificDate] = useState('');
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [times, setTimes] = useState({ startTime: '', endTime: '' });
    const [chartData, setChartData] = useState({ datasets: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const today = new Date().toISOString().split('T')[0];

    // useEffect para cargar el historial completo la primera vez que se monta el componente
    useEffect(() => {
        handleSearch();
    }, [classData.id]); // Se ejecuta cuando la clase a visualizar cambia

    const handleSearch = async () => {
        setError('');
        if (!classData.id) return;

        setLoading(true);

        let params = {};
        if (filterMode === 'specific') {
            if (!specificDate) { setError('Por favor, selecciona una fecha.'); setLoading(false); return; }
            params = {
                start_date: specificDate,
                end_date: specificDate,
                ...(times.startTime && { start_time: times.startTime }),
                ...(times.endTime && { end_time: times.endTime }),
            };
        } else if (filterMode === 'range') {
            if (!dateRange.startDate || !dateRange.endDate) { setError('Por favor, selecciona un rango de fechas.'); setLoading(false); return; }
            if (new Date(dateRange.startDate) > new Date(dateRange.endDate)) { setError('La fecha de fin no puede ser anterior a la de inicio.'); setLoading(false); return; }
            params = {
                start_date: dateRange.startDate,
                end_date: dateRange.endDate,
            };
        }
        // Si el modo es 'none', no se envían parámetros de fecha, y el backend devolverá todo.

        try {
            const response = await axios.get(`${API_URL}/api/readings/history/${classData.id}`, { params });

            if (response.data.length === 0) {
                setError('No se encontraron datos para los filtros seleccionados.');
                setChartData({ datasets: [] });
            } else {
                const co2Points = response.data.map(d => ({ x: new Date(d.timestamp), y: d.co2 }));

                setChartData({
                    datasets: [
                        {
                            label: `CO₂ (ppm)`,
                            data: co2Points,
                            borderColor: '#008000', // Verde para el historial específico
                            backgroundColor: 'rgba(0, 128, 0, 0.2)',
                            fill: true,
                            stepped: true,
                            yAxisID: 'y_co2',
                        },
                    ]
                });
            }
        } catch (err) {
            setError('Error al buscar el historial.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mosaic-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>Historial de Mediciones: {classData.name}</h2>
                <button className="mosaic-button" onClick={onReturn}>← Volver a la Lista</button>
            </div>
            <hr />

            <div className="mosaic-panel-inset" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <h3 style={{margin: 0, marginBottom: '1rem'}}>Filtros de Búsqueda</h3>

                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                    <label><input type="radio" name="filterMode" checked={filterMode === 'none'} onChange={() => setFilterMode('none')} /> Todo el Historial</label>
                    <label><input type="radio" name="filterMode" checked={filterMode === 'range'} onChange={() => setFilterMode('range')} /> Intervalo de Fechas</label>
                    <label><input type="radio" name="filterMode" checked={filterMode === 'specific'} onChange={() => setFilterMode('specific')} /> Fecha Específica</label>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {filterMode === 'range' && <>
                        <div>
                            <label>Fecha de Inicio:</label>
                            <input type="date" value={dateRange.startDate} max={today} onChange={e => setDateRange(prev => ({ ...prev, startDate: e.target.value }))} />
                        </div>
                        <div>
                            <label>Fecha de Fin:</label>
                            <input type="date" value={dateRange.endDate} max={today} min={dateRange.startDate} onChange={e => setDateRange(prev => ({ ...prev, endDate: e.target.value }))} />
                        </div>
                    </>}

                    {filterMode === 'specific' && <>
                        <div>
                            <label>Fecha:</label>
                            <input type="date" value={specificDate} max={today} onChange={e => setSpecificDate(e.target.value)} />
                        </div>
                        <div>
                            <label>Hora Inicio (Opc):</label>
                            <input type="time" value={times.startTime} onChange={e => setTimes(prev => ({...prev, startTime: e.target.value}))} />
                        </div>
                        <div>
                            <label>Hora Fin (Opc):</label>
                            <input type="time" value={times.endTime} onChange={e => setTimes(prev => ({...prev, endTime: e.target.value}))} />
                        </div>
                    </>}

                    <button className="mosaic-button" onClick={handleSearch} disabled={loading}>
                        {loading ? 'Buscando...' : 'Buscar'}
                    </button>
                </div>
                {error && <p className="error-message" style={{marginTop: '0.5rem'}}>{error}</p>}
            </div>

            <div className="mosaic-panel-inset" style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {loading ? <p>Cargando datos del gráfico...</p> :
                    (chartData.datasets.length > 0 ? <Line options={chartOptions} data={chartData} /> : <p>Selecciona un rango de fechas y presiona "Buscar".</p>)
                }
            </div>
        </div>
    );
}

export default ClassHistoryView;