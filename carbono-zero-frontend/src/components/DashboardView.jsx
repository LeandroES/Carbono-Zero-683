// src/components/DashboardView.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { AuthContext } from './AuthContext';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const LiveMetric = ({ value, label, unit, statusClass = '' }) => (
    <div className={`mosaic-panel-inset metric-display ${statusClass}`}>
        <div className="metric-value">{value}</div>
        <div className="metric-label">{label} ({unit})</div>
    </div>
);

const liveChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    scales: {
        y: { beginAtZero: false },
        x: { ticks: { display: true, autoSkip: true, maxTicksLimit: 10 } }
    },
    plugins: { legend: { display: false } }
};

function DashboardView({ classData, onReturn }) {
    const { settings } = useContext(AuthContext);
    const [co2, setCo2] = useState(420);
    const [temp, setTemp] = useState(20);
    const [humidity, setHumidity] = useState(50);
    const [tax, setTax] = useState(0.00);
    const [chartData, setChartData] = useState({
        labels: Array(30).fill(""),
        datasets: [{
            label: 'CO2 (ppm)',
            data: Array(30).fill(null),
            pointBackgroundColor: Array(30).fill('#c0c0c0'),
            borderColor: '#0000FF',
            backgroundColor: 'rgba(0, 0, 255, 0.1)',
            fill: true,
        }]
    });
    const [connectionStatus, setConnectionStatus] = useState('Conectando...');

    useEffect(() => {
        const ws = new WebSocket(`${WS_URL}/api/readings/ws/${classData.id}`);
        ws.onopen = () => setConnectionStatus('Conectado en Tiempo Real');

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setCo2(data.co2);
            setTemp(data.temperature);
            setHumidity(data.humidity);

            setChartData(prevData => {
                const newLabels = [...prevData.labels.slice(1), new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })];
                const newData = [...prevData.datasets[0].data.slice(1), data.co2];

                let pointColor = '#90ee90';
                if (data.co2 > settings.co2Regular) pointColor = '#f08080';
                else if (data.co2 > settings.co2Good) pointColor = '#ffd700';

                const newPointColors = [...prevData.datasets[0].pointBackgroundColor.slice(1), pointColor];

                return {
                    labels: newLabels,
                    datasets: [{ ...prevData.datasets[0], data: newData, pointBackgroundColor: newPointColors }]
                };
            });
        };

        ws.onclose = () => setConnectionStatus('Desconectado.');
        return () => { ws.close(); };
    }, [classData.id, settings]);

    useEffect(() => {
        if (co2 <= 420) return; // No calcular impuesto si el CO2 es menor o igual al baseline
        const baselineCO2 = 420;
        const co2Excess = co2 - baselineCO2;
        const emissionFactorKg = 0.000005;
        const taxRatePerTon = settings.taxRate || 11;
        const taxRatePerKg = taxRatePerTon / 1000;
        const secondsInterval = 5;
        const hoursIncrement = secondsInterval / 3600;
        const taxIncrement = co2Excess * classData.capacity * emissionFactorKg * taxRatePerKg * hoursIncrement;
        setTax(prevTax => prevTax + taxIncrement);
    }, [co2, classData.capacity, settings]);

    const getCO2Status = () => {
        if (co2 > settings.co2Regular) return 'status-bad';
        if (co2 > settings.co2Good) return 'status-regular';
        return 'status-good';
    };

    const getAforoStatus = () => {
        const percentage = (classData.capacity / 30) * 100; // Asumiendo aforo máx. de 30 para el color
        if (percentage > 80) return 'status-bad';
        if (percentage > 50) return 'status-regular';
        return 'status-good';
    };

    return (
        <div className="mosaic-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>Monitor en Vivo: {classData.name}</h2>
                <span style={{fontWeight: 'bold'}}>{connectionStatus}</span>
                <button className="mosaic-button" onClick={onReturn}>← Volver a la Lista</button>
            </div>
            <hr />

            <div className="dashboard-grid">
                <LiveMetric value={co2.toFixed(0)} label="CO₂" unit="ppm" statusClass={getCO2Status()} />
                <LiveMetric value={temp.toFixed(1)} label="Temperatura" unit="°C" />
                <LiveMetric value={humidity.toFixed(0)} label="Humedad" unit="%HR" />
            </div>

            <div className="dashboard-grid">
                <LiveMetric value={classData.capacity} label="Aforo" unit="personas" statusClass={getAforoStatus()} />
                <LiveMetric value={`S/. ${tax.toFixed(3)}`} label="Impuesto Acumulado" unit="PEN" />
                <LiveMetric value={`S/. ${(tax / classData.capacity || 0).toFixed(4)}`} label="Impuesto" unit="por persona" />
            </div>

            <div className="mosaic-panel-inset" style={{ padding: '1rem' }}>
                <h3 style={{ margin: 0, marginBottom: '1rem' }}>Evolución del CO₂ en tiempo real</h3>
                <div style={{ position: 'relative', height: '250px' }}>
                    <Line data={chartData} options={liveChartOptions} />
                </div>
            </div>
        </div>
    );
}
export default DashboardView;