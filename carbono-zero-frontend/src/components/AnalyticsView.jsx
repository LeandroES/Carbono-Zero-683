// src/components/AnalyticsView.jsx

// src/components/AnalyticsView.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, Filler } from 'chart.js';
import { AuthContext } from './AuthContext';

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
        y: {
            title: { display: true, text: 'CO₂ Promedio (ppm)' },
            beginAtZero: false
        }
    },
    plugins: { legend: { position: 'bottom' } },
};

function AnalyticsView({ allClasses }) {
    const { settings } = useContext(AuthContext);
    const chartRef = useRef(null);
    const [filterMode, setFilterMode] = useState('none');
    const [classRankings, setClassRankings] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [specificDate, setSpecificDate] = useState('');
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [times, setTimes] = useState({ startTime: '', endTime: '' });
    const [chartData, setChartData] = useState({ datasets: [] });
    const [chartTitle, setChartTitle] = useState('Evolución de CO₂ en el Tiempo');
    const [loading, setLoading] = useState({ ranking: false, chart: false });
    const [error, setError] = useState('');

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(prev => ({ ...prev, ranking: true }));
            try {
                const rankingsRes = await axios.get(`${API_URL}/api/reports/class-rankings`);
                setClassRankings(rankingsRes.data);
            } catch (err) { setError('Error al cargar el ranking.'); }
            finally { setLoading(prev => ({ ...prev, ranking: false })); }
        };
        fetchInitialData();

        if (allClasses && allClasses.length > 0 && !selectedClass) {
            const firstClassId = allClasses[0].id;
            setSelectedClass(firstClassId);
            handleSearch(firstClassId, 'none');
        }
    }, [allClasses]);

    const handleSearch = async (classIdOverride, filterModeOverride) => {
        const finalClassId = classIdOverride || selectedClass;
        const finalFilterMode = filterModeOverride || filterMode;

        setError('');
        if (!finalClassId) { return; }

        setLoading(prev => ({ ...prev, chart: true }));

        let params = {};
        if (finalFilterMode === 'specific') {
            if (!specificDate) { setError('Por favor, selecciona una fecha.'); setLoading(prev => ({...prev, chart: false})); return; }
            params = { start_date: specificDate, end_date: specificDate, ...(finalTimes.startTime && { start_time: finalTimes.startTime }), ...(finalTimes.endTime && { end_time: finalTimes.endTime }) };
        } else if (finalFilterMode === 'range') {
            if (!finalDates.startDate || !finalDates.endDate) { setError('Por favor, selecciona un rango de fechas.'); setLoading(prev => ({...prev, chart: false})); return; }
            if (new Date(finalDates.startDate) > new Date(finalDates.endDate)) { setError('La fecha de fin no puede ser anterior a la de inicio.'); setLoading(prev => ({...prev, chart: false})); return; }
            params = { start_date: finalDates.startDate, end_date: finalDates.endDate };
        }

        try {
            const response = await axios.get(`${API_URL}/api/readings/history/${finalClassId}`, { params });
            const className = allClasses.find(c => c.id === finalClassId)?.name || 'Clase';
            setChartTitle(`Evolución de CO₂ para: ${className}`);

            if (response.data.length === 0) {
                setError('No se encontraron datos para los filtros seleccionados.');
                setChartData({ datasets: [] });
            } else {
                const chartPoints = response.data.map(d => ({ x: new Date(d.timestamp), y: d.co2 }));
                setChartData({
                    datasets: [{ label: `CO₂ (ppm) - ${className}`, data: chartPoints, borderColor: '#FF0000', backgroundColor: 'rgba(255, 0, 0, 0.2)', fill: true, stepped: true }]
                });
            }
        } catch (err) {
            setError('Error al buscar el historial.');
        } finally {
            setLoading(prev => ({ ...prev, chart: false }));
        }
    };



    const handleRankingClick = (cls) => {
        setSelectedClass(cls.id);
        setFilterMode('none');
        handleSearch(cls.id, 'none');
        if (chartRef.current) {
            chartRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const getRankingColor = (avgCo2) => {
        if (avgCo2 > settings.co2Regular) return 'status-bad';
        if (avgCo2 > settings.co2Good) return 'status-regular';
        return 'status-good';
    };

    return (
        <div className="mosaic-panel">
            <h2 style={{ marginTop: 0 }}>Histórico y Analítica</h2>

            <div className="mosaic-panel-inset" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <h3 style={{margin: 0, marginBottom: '1rem'}}>Filtros de Búsqueda de Historial</h3>
                <div style={{marginBottom: '1rem'}}>
                    <label>Clase:</label>
                    <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ fontFamily: 'Times New Roman, Times, serif', fontSize: '16px', marginLeft: '0.5rem' }}>
                        <option value="">-- Selecciona una Clase --</option>
                        {allClasses && allClasses.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                    </select>
                </div>
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
                            <input type="time" value={times.startTime} onChange={e => setTimes(prev => ({...prev, startTime: e.target.value}))} disabled={!specificDate}/>
                        </div>
                        <div>
                            <label>Hora Fin (Opc):</label>
                            <input type="time" value={times.endTime} onChange={e => setTimes(prev => ({...prev, endTime: e.target.value}))} disabled={!specificDate}/>
                        </div>
                    </>}

                    <button className="mosaic-button" onClick={() => handleSearch()} disabled={loading.chart}>
                        {loading.chart ? 'Buscando...' : 'Buscar'}
                    </button>
                </div>
                {error && <p className="error-message" style={{marginTop: '0.5rem'}}>{error}</p>}
            </div>

            <div className="mosaic-panel-inset" ref={chartRef} style={{ height: '400px', /*...*/ }}>
                {loading.chart ? <p>Cargando...</p> :
                    (chartData.datasets.length > 0 ? <Line options={{...chartOptions, plugins: {...chartOptions.plugins, title: {...chartOptions.plugins.title, text: chartTitle }}}} data={chartData} /> : <p>Selecciona filtros y busca.</p>)
                }
            </div>
            <div className="mosaic-panel-inset">
                <h3 style={{margin: 0, marginBottom: '1rem' }}>Ranking Universal de Clases (Mayor Emisión)</h3>
                {loading.ranking ? <p>Cargando...</p> : (
                    <ol className="top-list">
                        {classRankings.map(cls => (
                            <li key={cls.id} onClick={() => handleRankingClick(cls)} className={`ranking-item ${getRankingColor(cls.avgCo2)}`} title="Hacer clic para ver historial completo">
                                {cls.name} - <strong>{cls.avgCo2.toFixed(0)} ppm</strong>
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        </div>
    );
}
export default AnalyticsView;