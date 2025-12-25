// src/components/App.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './index.css';
import { AuthContext } from './components/AuthContext';
import LoginPage from './components/LoginPage';
import CreateClassModal from './components/CreateClassModal';
import DashboardView from './components/DashboardView';
import AnalyticsView from './components/AnalyticsView';
import SettingsView from './components/SettingsView';
import Notification from './components/Notification';
import ClassHistoryView from './components/ClassHistoryView.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const fuchsiaBorderStyle = { fontWeight: 'normal', color: 'black', textShadow: '-1px -1px 0 #FF00FF, 1px -1px 0 #FF00FF, -1px 1px 0 #FF00FF, 1px 1px 0 #FF00FF' };
const cyanBorderStyle = { fontWeight: 'normal', color: 'black', textShadow: '-1px -1px 0 #00FFFF, 1px -1px 0 #00FFFF, -1px 1px 0 #00FFFF, 1px 1px 0 #00FFFF' };
const greenBorderStyle = { fontWeight: 'normal', color: 'black', textShadow: '-1px -1px 0 #00FF00, 1px -1px 0 #00FF00, -1px 1px 0 #00FF00, 1px 1px 0 #00FF00' };

const ClassListView = ({ classes, loading, onStartSession, onOpenCreateModal, onEdit, onDelete, onShowHistory }) => {
    const { isAdmin } = useContext(AuthContext);

    const formatSchedule = (cls) => {
        const weekdays = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
        const day = weekdays[cls.schedule_day] || 'DÍA';
        const start = cls.schedule_start ? cls.schedule_start.substring(0, 5) : '';
        const end = cls.schedule_end ? cls.schedule_end.substring(0, 5) : '';
        return `${day} ${start} - ${end}`;
    };

    if (loading) { return <div className="mosaic-panel-inset" style={{padding: '2rem', textAlign: 'center'}}><p>Cargando clases...</p></div>; }

    if (!classes || classes.length === 0) {
        return (
            <div className="mosaic-panel">
                <h2 style={{margin: 0}}>Gestión de Clases</h2>
                <div className="mosaic-panel-inset" style={{padding: '2rem', textAlign: 'center'}}>
                    <p>Aún no hay clases creadas.</p>
                    {isAdmin && <button className="mosaic-button" onClick={onOpenCreateModal}>✚ Crear la Primera Clase</button>}
                </div>
            </div>
        );
    }

    return (
        <div className="mosaic-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>Gestión de Clases</h2>
                {isAdmin && <button className="mosaic-button" onClick={onOpenCreateModal}>✚ Crear Nueva Clase</button>}
            </div>
            <div className="mosaic-panel-inset">
                <table style={{ width: '100%', borderCollapse: 'collapse' }} border="1">
                    <thead>
                    <tr>
                        <th>ID de la Clase</th>
                        <th>Nombre</th><th>Horario</th><th>Aforo</th><th>Ventilación</th><th>Acciones</th>
                        {isAdmin && <><th>Historial</th><th>Editar</th><th>Eliminar</th></>}
                    </tr>
                    </thead>
                    <tbody>
                    {classes.map(cls => (
                        <tr key={cls.id}>
                            <td style={{ fontSize: '12px', wordBreak: 'break-all' }}>{cls.id}</td>
                            <td style={fuchsiaBorderStyle}>{cls.name}</td>
                            <td style={cyanBorderStyle}>{formatSchedule(cls)}</td>
                            <td style={greenBorderStyle}>{cls.capacity}</td>
                            <td style={greenBorderStyle}>{cls.ventilation}</td>
                            {/* --- CORRECCIÓN CLAVE ---
                                    El botón ahora llama a 'onStartSession' como se esperaba */}
                            <td><button className="mosaic-button" onClick={() => onStartSession(cls, false)}>Ver en Vivo</button></td>
                            {isAdmin && <>
                                <td style={{textAlign: 'center'}}><button className="mosaic-button" onClick={() => onShowHistory(cls)}>Ver</button></td>
                                <td style={{ textAlign: 'center' }}><span className="action-icon" onClick={() => onEdit(cls)}>✎</span></td>
                                <td style={{ textAlign: 'center' }}><span className="delete-icon" onClick={() => onDelete(cls)}>🗑️</span></td>
                            </>}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ConfirmationModal = ({ onConfirm, onCancel, message }) => (
    <div className="modal-overlay confirmation-modal">
        <div className="mosaic-panel modal-content">
            <h3>Confirmar Acción</h3>
            <p>{message || '¿Estás seguro?'}</p>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button className="mosaic-button" onClick={onCancel}>Cancelar</button>
                <button className="mosaic-button" style={{backgroundColor: '#a00000', color: 'white'}} onClick={onConfirm}>Confirmar</button>
            </div>
        </div>
    </div>
);

function AppContent() {
    const { user, logout, isAdmin, notification, setNotification } = useContext(AuthContext);

    const [view, setView] = useState('management');
    const [viewingClass, setViewingClass] = useState(null);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [classToEdit, setClassToEdit] = useState(null);
    const [classToDelete, setClassToDelete] = useState(null);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/classes/`);
            setClasses(response.data);
        } catch (error) {
            setNotification({ message: "Error al cargar las clases.", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveClass = async (classData) => {
        try {
            const { id, ...dataToSend } = classData;
            if (id) {
                await axios.put(`${API_URL}/api/classes/${id}`, dataToSend);
                setNotification({ message: "Clase actualizada con éxito." });
            } else {
                await axios.post(`${API_URL}/api/classes/`, dataToSend);
                setNotification({ message: "Clase creada con éxito." });
            }
            handleCloseModal();
            fetchClasses();
        } catch (error) {
            setNotification({ message: "Error al guardar la clase.", type: 'error' });
        }
    };

    const handleDeleteClass = async () => {
        if (!classToDelete || !classToDelete.id) {
            setNotification({ message: "Error: No se pudo obtener el ID para eliminar.", type: 'error' });
            setClassToDelete(null);
            return;
        }
        try {
            await axios.delete(`${API_URL}/api/classes/${classToDelete.id}`);
            setNotification({ message: `La clase "${classToDelete.name}" ha sido eliminada.`, type: 'success'});
            setClassToDelete(null);
            fetchClasses();
        } catch (error) {
            setNotification({ message: "Error al eliminar la clase.", type: 'error' });
        }
    };
    // El botón "Ver en Vivo" simplemente cambia la vista
    const handleViewSession = (cls) => {
        setViewingClass(cls);
        setView('liveDashboard');
    };

    const handleShowHistory = (cls) => {
        setViewingClass(cls);
        setView('classHistory');
    };

    const handleStopAllSessions = async () => {
        try {
            const response = await axios.post(`${API_URL}/api/sessions/stop`);
            setNotification({ message: response.data.message });
        } catch(error) {
            setNotification({ message: "Error al detener las sesiones.", type: 'error' });
        }
    };

    const handleReturnToManagement = () => {
        setViewingClass(null);
        setView('management');
    };

    const handleOpenCreateModal = () => { setClassToEdit(null); setIsModalOpen(true); };
    const handleOpenEditModal = (cls) => { setClassToEdit(cls); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setClassToEdit(null); };

    const handleStartSession = async (cls, isAutomatic = false) => {
        try {
            const response = await axios.post(`${API_URL}/api/sessions/start/${cls.id}`);

            if (!isAutomatic) {
                setNotification({ message: response.data.message });
                setViewingClass(cls);
                setView('liveDashboard');
            } else {
                setViewingClass(cls);
                setNotification({ message: `Monitoreo automático iniciado: ${cls.name}` });
            }
        } catch (error) {
            if (!isAutomatic) {
                setNotification({
                    message: "Error al iniciar sesión. Asegúrate que el script del sensor esté corriendo.",
                    type: 'error'
                });
            }
        }
    };

    const renderCurrentView = () => {
        switch (view) {
            case 'management':
                return <ClassListView
                    classes={classes}
                    loading={loading}
                    onStartSession={handleStartSession}
                    onViewSession={handleViewSession}
                    onOpenCreateModal={handleOpenCreateModal}
                    onEdit={handleOpenEditModal}
                    onDelete={(cls) => setClassToDelete(cls)}
                    onShowHistory={handleShowHistory}
                />;
            case 'analytics':
                return isAdmin ? <AnalyticsView allClasses={classes} /> : <div className="mosaic-panel-inset"><p>Acceso denegado.</p></div>;
            case 'settings':
                return isAdmin ? <SettingsView /> : <div className="mosaic-panel-inset"><p>Acceso denegado.</p></div>;
            case 'liveDashboard':
                return <DashboardView classData={viewingClass} onReturn={handleReturnToManagement} />;
            case 'classHistory':
                return <ClassHistoryView classData={viewingClass} onReturn={handleReturnToManagement} />;
            default:
                return <h2>Vista no encontrada</h2>;
        }
    }

    return (
        <div style={{ padding: '2rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <h1 className="mosaic-title">Carbono Zero 683</h1>
                <div>
                    <span>Bienvenido, {user.name} ({user.role})</span>
                    <button className="mosaic-button" style={{marginLeft: '1rem'}} onClick={logout}>Cerrar Sesión</button>
                </div>
            </header>

            {view !== 'liveDashboard' && view !== 'classHistory' && (
                <nav className="main-nav">
                    <button className="mosaic-button" onClick={() => setView('management')}>Gestión de Clases</button>
                    {isAdmin && <>
                        <button className="mosaic-button" onClick={() => setView('analytics')}>Analítica</button>
                        <button className="mosaic-button" onClick={() => setView('settings')}>Ajustes</button>
                        <button className="mosaic-button" style={{backgroundColor: '#e0b0b0'}} onClick={handleStopAllSessions}>Detener Monitoreo Manual</button>
                    </>}
                </nav>
            )}

            <main>{renderCurrentView()}</main>
            {isModalOpen && <CreateClassModal onSave={handleSaveClass} onClose={handleCloseModal} existingClass={classToEdit} />}
            {classToDelete && <ConfirmationModal message={`¿Seguro que quieres eliminar la clase "${classToDelete.name}"?`} onConfirm={handleDeleteClass} onCancel={() => setClassToDelete(null)} />}
            {notification && <Notification message={notification.message} type={notification.type} onDone={() => setNotification(null)} />}
            <footer style={{ marginTop: '2rem', textAlign: 'center', fontSize: '14px' }}>
                <p>Sistema de Monitoreo de Emisiones v3.1.0 - Estilo de UI: NCSA Mosaic 2.7</p>
            </footer>
        </div>
    );
}

function App() {
    const { isAuthenticated } = useContext(AuthContext);
    return isAuthenticated ? <AppContent /> : <LoginPage />;
}
export default App;