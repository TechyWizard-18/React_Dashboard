
import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { signOut } from "firebase/auth";
import { collection, getDocs, addDoc ,onSnapshot} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
// import { QRCodeCanvas } from 'qrcode.react';
// import { useReactToPrint } from 'react-to-print';
import { doc, deleteDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
// Add these to your existing 'firebase/firestore' import
import { query, orderBy, limit, startAfter, where } from 'firebase/firestore';
// At the top of Dashboard.jsx
import {  documentId} from 'firebase/firestore';
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
// #####################################################################
// #  Sub-Component 1: QRCodeGenerator                               #
// #####################################################################
const QRCodeGenerator = () => {
    const [selectedType, setSelectedType] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [generatedCodes, setGeneratedCodes] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const qrContainerRef = useRef(null);

    // QR Code type configurations
    const qrTypes = {
        BOX: {
            prefix: 'BOX',
            color: '#e74c3c',
            description: 'Box Packaging QR Codes',
            icon: '📦'
        },
        FIBER: {
            prefix: 'FIBER',
            color: '#27ae60',
            description: 'Fiber Material QR Codes',
            icon: '🧵'
        },
        PACK: {
            prefix: 'PACK',
            color: '#3498db',
            description: 'Package QR Codes',
            icon: '📋'
        }
    };

    // Generate QR code ID with the specified format
    const generateQRId = (type, index) => {
        const paddedIndex = String(index + 1).padStart(2, '0');
        const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `${type}${paddedIndex}#&M${randomSuffix}`;
    };

    // Generate QR codes
    const handleGenerateQRCodes = async () => {
        if (!selectedType || quantity < 1) {
            alert('Please select a QR type and specify a valid quantity.');
            return;
        }

        setIsGenerating(true);
        const codes = [];

        try {
            for (let i = 0; i < quantity; i++) {
                const qrId = generateQRId(selectedType, i);
                const qrDataURL = await QRCode.toDataURL(qrId, {
                    width: 150,
                    margin: 2,
                    color: {
                        dark: qrTypes[selectedType].color,
                        light: '#FFFFFF'
                    }
                });

                codes.push({
                    id: qrId,
                    dataURL: qrDataURL,
                    type: selectedType
                });
            }

            setGeneratedCodes(codes);
        } catch (error) {
            console.error('Error generating QR codes:', error);
            alert('Error generating QR codes. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Export QR codes as PDF
    const handleExportPDF = async () => {
        if (generatedCodes.length === 0) {
            alert('No QR codes to export. Please generate codes first.');
            return;
        }

        try {
            const canvas = await html2canvas(qrContainerRef.current, {
                scale: 2,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${selectedType}_QR_Codes_${quantity}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Error exporting PDF. Please try again.');
        }
    };

    // Print QR codes
    const handlePrint = () => {
        if (generatedCodes.length === 0) {
            alert('No QR codes to print. Please generate codes first.');
            return;
        }

        const printWindow = window.open('', '_blank');
        const qrContainer = qrContainerRef.current;

        printWindow.document.write(`
            <html lang="el">
                <head>
                    <title>QR Codes - ${selectedType}</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 20px;
                            background: white;
                        }
                        .print-header {
                            text-align: center;
                            margin-bottom: 30px;
                            border-bottom: 2px solid #333;
                            padding-bottom: 10px;
                        }
                        .qr-grid {
                            display: grid;
                            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                            gap: 20px;
                            margin-top: 20px;
                        }
                        .qr-item {
                            text-align: center;
                            border: 1px solid #ddd;
                            padding: 15px;
                            border-radius: 8px;
                            background: #f9f9f9;
                            break-inside: avoid;
                        }
                        .qr-item img {
                            max-width: 150px;
                            margin-bottom: 10px;
                        }
                        .qr-id {
                            font-weight: bold;
                            font-size: 14px;
                            margin-top: 10px;
                        }
                        @media print {
                            body { margin: 0; }
                            .qr-grid { gap: 15px; }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-header">
                        <h1>${qrTypes[selectedType].icon} ${qrTypes[selectedType].description}</h1>
                        <p>Generated: ${new Date().toLocaleString()}</p>
                        <p>Total Codes: ${generatedCodes.length}</p>
                    </div>
                    ${qrContainer.innerHTML}
                </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.print();
    };

    // Clear generated codes
    const handleClear = () => {
        setGeneratedCodes([]);
        setSelectedType('');
        setQuantity(1);
    };

    // Styles
    const styles = {
        container: {
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '20px',
            fontFamily: 'Arial, sans-serif'
        },
        header: {
            textAlign: 'center',
            marginBottom: '40px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        },
        headerTitle: {
            fontSize: '32px',
            fontWeight: 'bold',
            marginBottom: '10px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        },
        headerSubtitle: {
            fontSize: '16px',
            opacity: 0.9
        },
        controlPanel: {
            background: 'white',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
            marginBottom: '30px'
        },
        controlRow: {
            display: 'flex',
            gap: '20px',
            alignItems: 'end',
            flexWrap: 'wrap',
            marginBottom: '20px'
        },
        inputGroup: {
            display: 'flex',
            flexDirection: 'column',
            minWidth: '200px'
        },
        label: {
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '8px',
            color: '#333'
        },
        select: {
            padding: '12px',
            border: '2px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '14px',
            transition: 'border-color 0.3s ease',
            outline: 'none'
        },
        input: {
            padding: '12px',
            border: '2px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '14px',
            transition: 'border-color 0.3s ease',
            outline: 'none'
        },
        button: {
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            height: 'fit-content'
        },
        primaryButton: {
            background: 'linear-gradient(135deg, #4CAF50, #45a049)',
            color: 'white'
        },
        secondaryButton: {
            background: 'linear-gradient(135deg, #2196F3, #1976D2)',
            color: 'white'
        },
        dangerButton: {
            background: 'linear-gradient(135deg, #f44336, #d32f2f)',
            color: 'white'
        },
        warningButton: {
            background: 'linear-gradient(135deg, #ff9800, #f57c00)',
            color: 'white'
        },
        typeSelector: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
        },
        typeCard: {
            padding: '20px',
            border: '2px solid #e0e0e0',
            borderRadius: '12px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: '#f9f9f9'
        },
        typeCardSelected: {
            borderColor: '#4CAF50',
            background: '#e8f5e8',
            transform: 'translateY(-2px)',
            boxShadow: '0 5px 15px rgba(76, 175, 80, 0.3)'
        },
        typeIcon: {
            fontSize: '32px',
            marginBottom: '10px'
        },
        typeTitle: {
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '5px'
        },
        typeDescription: {
            fontSize: '12px',
            color: '#666',
            marginBottom: '10px'
        },
        qrGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '20px',
            marginTop: '20px'
        },
        qrItem: {
            textAlign: 'center',
            background: 'white',
            padding: '15px',
            borderRadius: '12px',
            border: '2px solid #f0f0f0',
            transition: 'transform 0.3s ease',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        },
        qrImage: {
            width: '150px',
            height: '150px',
            marginBottom: '10px'
        },
        qrId: {
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#333',
            wordBreak: 'break-all'
        },
        resultsContainer: {
            background: 'white',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.1)'
        },
        resultsHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '15px',
            borderBottom: '2px solid #f0f0f0'
        },
        resultsTitle: {
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#333'
        },
        exportButtons: {
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap'
        },
        loadingContainer: {
            textAlign: 'center',
            padding: '60px',
            background: 'white',
            borderRadius: '15px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.1)'
        },
        spinner: {
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #4CAF50',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 2s linear infinite',
            margin: '20px auto'
        }
    };

    // Add CSS animation for spinner
    const spinnerKeyframes = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;

    return (
        <>
            <style>{spinnerKeyframes}</style>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h1 style={styles.headerTitle}>🔲 QR Code Generator</h1>
                    <p style={styles.headerSubtitle}>Generate, Export, and Print QR Codes for BOX, FIBER, and PACK types</p>
                </div>

                <div style={styles.controlPanel}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Select QR Code Type:</label>
                        <div style={styles.typeSelector}>
                            {Object.entries(qrTypes).map(([type, config]) => (
                                <div
                                    key={type}
                                    style={{
                                        ...styles.typeCard,
                                        ...(selectedType === type ? styles.typeCardSelected : {})
                                    }}
                                    onClick={() => setSelectedType(type)}
                                >
                                    <div style={styles.typeIcon}>{config.icon}</div>
                                    <div style={styles.typeTitle}>{type}</div>
                                    <div style={styles.typeDescription}>{config.description}</div>
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        backgroundColor: config.color,
                                        borderRadius: '50%',
                                        margin: '10px auto 0',
                                        border: '2px solid white',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                    }}></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={styles.controlRow}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Quantity:</label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                style={styles.input}
                                placeholder="Enter quantity (1-100)"
                            />
                        </div>

                        <button
                            onClick={handleGenerateQRCodes}
                            disabled={!selectedType || isGenerating}
                            style={{
                                ...styles.button,
                                ...styles.primaryButton,
                                opacity: (!selectedType || isGenerating) ? 0.6 : 1
                            }}
                        >
                            {isGenerating ? 'Generating...' : '🔲 Generate QR Codes'}
                        </button>

                        {generatedCodes.length > 0 && (
                            <button
                                onClick={handleClear}
                                style={{
                                    ...styles.button,
                                    ...styles.dangerButton
                                }}
                            >
                                🗑️ Clear All
                            </button>
                        )}
                    </div>
                </div>

                {isGenerating && (
                    <div style={styles.loadingContainer}>
                        <div style={styles.spinner}></div>
                        <h3>Generating {quantity} QR Codes...</h3>
                        <p>Please wait while we create your {selectedType} QR codes.</p>
                    </div>
                )}

                {generatedCodes.length > 0 && (
                    <div style={styles.resultsContainer}>
                        <div style={styles.resultsHeader}>
                            <div>
                                <h2 style={styles.resultsTitle}>
                                    {qrTypes[selectedType].icon} Generated {selectedType} QR Codes ({generatedCodes.length})
                                </h2>
                                <p style={{ color: '#666', margin: '5px 0 0 0' }}>
                                    Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                                </p>
                            </div>
                            <div style={styles.exportButtons}>
                                <button
                                    onClick={handleExportPDF}
                                    style={{
                                        ...styles.button,
                                        ...styles.secondaryButton
                                    }}
                                >
                                    📄 Export PDF
                                </button>
                                <button
                                    onClick={handlePrint}
                                    style={{
                                        ...styles.button,
                                        ...styles.warningButton
                                    }}
                                >
                                    🖨️ Print
                                </button>
                            </div>
                        </div>

                        <div ref={qrContainerRef} style={styles.qrGrid} className="qr-grid">
                            {generatedCodes.map((code, index) => (
                                <div key={index} style={styles.qrItem} className="qr-item">
                                    <img
                                        src={code.dataURL}
                                        alt={`QR Code ${code.id}`}
                                        style={styles.qrImage}
                                    />
                                    <div style={styles.qrId} className="qr-id">{code.id}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!isGenerating && generatedCodes.length === 0 && selectedType && (
                    <div style={styles.loadingContainer}>
                        <h3>Ready to Generate {selectedType} QR Codes</h3>
                        <p>Click the "Generate QR Codes" button to create {quantity} {selectedType} QR codes.</p>
                        <div style={{
                            fontSize: '64px',
                            margin: '20px 0',
                            opacity: 0.3
                        }}>
                            {qrTypes[selectedType].icon}
                        </div>
                    </div>
                )}

                {!selectedType && (
                    <div style={styles.loadingContainer}>
                        <h3>Welcome to QR Code Generator</h3>
                        <p>Select a QR code type above to get started.</p>
                        <div style={{
                            fontSize: '64px',
                            margin: '20px 0',
                            opacity: 0.3
                        }}>
                            🔲
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};// #####################################################################
// #  Sub-Component 2: UserManagement                                #
// #####################################################################

const UserManagement = ({ functions }) => {
    const [formData, setFormData] = useState({ email: '', password: '', role: 'sorter' });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    // Enhanced styles for this component
    const umStyles = {
        container: {
            maxWidth: '500px',
            margin: '0 auto',
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            fontFamily: "'Inter', 'Segoe UI', sans-serif"
        },
        title: {
            fontSize: '28px',
            fontWeight: '700',
            color: '#1a2c3d',
            marginBottom: '8px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #007bff, #0056b3)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
        },
        subtitle: {
            fontSize: '14px',
            color: '#6c757d',
            textAlign: 'center',
            marginBottom: '32px'
        },
        form: {
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
        },
        inputGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
        },
        label: {
            fontSize: '14px',
            fontWeight: '600',
            color: '#343a40',
            marginLeft: '4px'
        },
        input: {
            padding: '14px 16px',
            fontSize: '16px',
            border: '2px solid #e2e8f0',
            borderRadius: '10px',
            transition: 'all 0.2s ease',
            backgroundColor: '#f8fafc',
            outline: 'none'
        },
        inputFocus: {
            borderColor: '#007bff',
            backgroundColor: '#ffffff',
            boxShadow: '0 0 0 3px rgba(0, 123, 255, 0.1)'
        },
        select: {
            padding: '14px 16px',
            fontSize: '16px',
            border: '2px solid #e2e8f0',
            borderRadius: '10px',
            backgroundColor: '#f8fafc',
            cursor: 'pointer',
            outline: 'none',
            transition: 'all 0.2s ease'
        },
        selectFocus: {
            borderColor: '#007bff',
            backgroundColor: '#ffffff',
            boxShadow: '0 0 0 3px rgba(0, 123, 255, 0.1)'
        },
        button: {
            padding: '16px',
            fontSize: '16px',
            fontWeight: '600',
            color: 'white',
            background: 'linear-gradient(135deg, #007bff, #0056b3)',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 6px rgba(0, 123, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
        },
        buttonHover: {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 12px rgba(0, 123, 255, 0.25)'
        },
        buttonDisabled: {
            background: 'linear-gradient(135deg, #6c757d, #5a6268)',
            cursor: 'not-allowed',
            transform: 'none',
            boxShadow: 'none'
        },
        message: {
            padding: '16px',
            borderRadius: '10px',
            marginTop: '24px',
            fontWeight: '500',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
        },
        successMessage: {
            backgroundColor: '#d4edda',
            color: '#155724',
            border: '1px solid #c3e6cb'
        },
        errorMessage: {
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb'
        },
        roleOptions: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            marginTop: '8px'
        },
        roleOption: {
            padding: '12px',
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: '#f8fafc'
        },
        roleOptionSelected: {
            borderColor: '#007bff',
            backgroundColor: '#e6f2ff',
            boxShadow: '0 0 0 2px rgba(0, 123, 255, 0.2)'
        },
        roleIcon: {
            fontSize: '20px',
            marginBottom: '6px'
        }
    };

    const handleInputChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleRoleSelect = (role) => {
        setFormData(prev => ({ ...prev, role }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        try {
            const createNewUser = httpsCallable(functions, 'createNewUser');
            const result = await createNewUser({
                email: formData.email,
                password: formData.password,
                role: formData.role
            });
            setMessage(result.data.message);
            setMessageType('success');
            setFormData({ email: '', password: '', role: 'sorter' });
        } catch (error) {
            setMessage(error.message);
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    // Role configurations with icons
    const roles = {
        sorter: { label: 'Sorter', icon: '👨‍💼' },
        manager: { label: 'Manager', icon: '👔' },
        admin: { label: 'Admin', icon: '👑' }
    };

    return (
        <div style={umStyles.container}>
            <h2 style={umStyles.title}>Create New User</h2>
            <p style={umStyles.subtitle}>Add a new user to the system with appropriate permissions</p>

            <form onSubmit={handleSubmit} style={umStyles.form}>
                <div style={umStyles.inputGroup}>
                    <label style={umStyles.label}>Email Address</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        style={umStyles.input}
                        required
                        placeholder="user@example.com"
                        onFocus={(e) => Object.assign(e.target.style, umStyles.inputFocus)}
                        onBlur={(e) => {
                            // Reset to base input styles
                            Object.assign(e.target.style, umStyles.input);
                            // Remove the focus-specific styles
                            e.target.style.borderColor = umStyles.input.borderColor;
                            e.target.style.backgroundColor = umStyles.input.backgroundColor;
                            e.target.style.boxShadow = umStyles.input.boxShadow;
                        }}
                    />
                </div>

                <div style={umStyles.inputGroup}>
                    <label style={umStyles.label}>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        style={umStyles.input}
                        required
                        minLength={6}
                        placeholder="Minimum 6 characters"
                    />
                </div>

                <div style={umStyles.inputGroup}>
                    <label style={umStyles.label}>User Role</label>
                    <div style={umStyles.roleOptions}>
                        {Object.entries(roles).map(([key, { label, icon }]) => (
                            <div
                                key={key}
                                style={{
                                    ...umStyles.roleOption,
                                    ...(formData.role === key ? umStyles.roleOptionSelected : {})
                                }}
                                onClick={() => handleRoleSelect(key)}
                            >
                                <div style={umStyles.roleIcon}>{icon}</div>
                                <div style={{ fontSize: '14px', fontWeight: '600' }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    style={{
                        ...umStyles.button,
                        ...(isLoading ? umStyles.buttonDisabled : {}),
                    }}
                    disabled={isLoading}
                    onMouseOver={(e) => !isLoading && (e.target.style = {...umStyles.button, ...umStyles.buttonHover})}
                    onMouseOut={(e) => !isLoading && (e.target.style = umStyles.button)}
                >
                    {isLoading ? (
                        <>
                            <span>Creating User...</span>
                            <div style={{ width: '16px', height: '16px', border: '2px solid transparent', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        </>
                    ) : (
                        <>
                            <span>➕ Create User</span>
                        </>
                    )}
                </button>
            </form>

            {message && (
                <div style={{
                    ...umStyles.message,
                    ...(messageType === 'success' ? umStyles.successMessage : umStyles.errorMessage)
                }}>
                    {messageType === 'success' ? '✅' : '❌'} {message}
                </div>
            )}

            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
};
// #####################################################################
// #  Sub-Component 3: AddSource                                     #
// #####################################################################

const AddSource = ({ db }) => {
    const [sourceName, setSourceName] = useState('');
    // --- MODIFICATION START ---
    const [contactInfo, setContactInfo] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    // --- MODIFICATION END ---
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Enhanced styles for this component
    const asStyles = {
        container: {
            maxWidth: '500px',
            margin: '0 auto',
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '10px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
        },
        title: {
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1a2c3d',
            marginBottom: '30px',
            textAlign: 'center'
        },
        input: {
            width: '100%',
            padding: '12px 16px',
            fontSize: '16px',
            border: '2px solid #e9ecef',
            borderRadius: '8px',
            boxSizing: 'border-box',
            marginBottom: '20px',
            transition: 'border-color 0.3s ease'
        },
        inputFocus: {
            borderColor: '#007bff'
        },
        button: {
            width: '100%',
            padding: '15px',
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: '#28a745',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease'
        },
        buttonDisabled: {
            backgroundColor: '#6c757d',
            cursor: 'not-allowed'
        },
        message: {
            padding: '15px',
            borderRadius: '8px',
            marginTop: '20px',
            fontWeight: 'bold',
            textAlign: 'center'
        },
        successMessage: {
            backgroundColor: '#d4edda',
            color: '#155724',
            border: '1px solid #c3e6cb'
        },
        errorMessage: {
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb'
        },
    };

    const handleAddSource = async (e) => {
        e.preventDefault();
        // --- MODIFICATION START ---
        if (!sourceName.trim() || !contactInfo.trim() || !city.trim() || !country.trim()) {
            setMessage("Please fill out all fields.");
            // --- MODIFICATION END ---
            setMessageType('error');
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            // This is just a placeholder for the real firestore functions

            let collectionRef;
            try {
                collectionRef = collection(db, "sources");
            } catch (error) {
                console.log("Trying with 'Sources' collection...");
                collectionRef = collection(db, "Sources");
            }

            // --- MODIFICATION START ---
            await addDoc(collectionRef, {
                name: sourceName.trim(),
                contact: contactInfo.trim(),
                address: {
                    city: city.trim(),
                    country: country.trim()
                },
                createdAt: new Date()
            });
            // --- MODIFICATION END ---

            setMessage(`Source '${sourceName}' added successfully!`);
            setMessageType('success');
            setSourceName('');
            // --- MODIFICATION START ---
            setContactInfo('');
            setCity('');
            setCountry('');
            // --- MODIFICATION END ---
        } catch (error) {
            console.error("Add Source Error:", error);
            setMessage("Error adding source. Please check console for details.");
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={asStyles.container}>
            <h2 style={asStyles.title}>Add New Source</h2>
            <form onSubmit={handleAddSource}>
                <input
                    style={asStyles.input}
                    type="text"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    placeholder="Enter new source name"
                />
                {/* --- NEW FIELDS START --- */}
                <input
                    style={asStyles.input}
                    type="text"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="Enter contact info (email or phone)"
                />
                <input
                    style={asStyles.input}
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter city"
                />
                <input
                    style={asStyles.input}
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Enter country"
                />
                {/* --- NEW FIELDS END --- */}
                <button
                    type="submit"
                    style={{
                        ...asStyles.button,
                        ...(isLoading && asStyles.buttonDisabled)
                    }}
                    disabled={isLoading}
                >
                    {isLoading ? 'Adding...' : 'Add Source'}
                </button>
            </form>
            {message && (
                <p style={{
                    ...asStyles.message,
                    ...(messageType === 'success' ? asStyles.successMessage : asStyles.errorMessage)
                }}>
                    {messageType === 'success' ? '✅ ' : '❌ '}{message}
                </p>
            )}
        </div>
    );
};

// #  Sub-Component 4: AddVendor                                     #
// #####################################################################

const AddVendor = ({ db }) => {
    const [vendorData, setVendorData] = useState({
        name: '',
        country: '',
        state: '',
        contactInfo: ''
    });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Styles for this component
    const avStyles = {
        container: {
            maxWidth: '600px',
            margin: '0 auto',
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '10px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
        },
        title: {
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1a2c3d',
            marginBottom: '30px',
            textAlign: 'center'
        },
        form: {
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
        },
        inputGroup: {
            display: 'flex',
            flexDirection: 'column'
        },
        label: {
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#343a40',
            marginBottom: '8px'
        },
        input: {
            padding: '12px 16px',
            fontSize: '16px',
            border: '2px solid #e9ecef',
            borderRadius: '8px'
        },
        button: {
            padding: '15px',
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: '#28a745',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '10px'
        },
        buttonDisabled: {
            backgroundColor: '#6c757d',
            cursor: 'not-allowed'
        },
        message: {
            padding: '15px',
            borderRadius: '8px',
            marginTop: '20px',
            fontWeight: 'bold',
            textAlign: 'center'
        },
        successMessage: {
            backgroundColor: '#d4edda',
            color: '#155724'
        },
        errorMessage: {
            backgroundColor: '#f8d7da',
            color: '#721c24'
        },
    };

    const handleInputChange = (e) => {
        setVendorData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            // Add vendor to Firestore
            await addDoc(collection(db, "vendors"), {
                ...vendorData,
                createdAt: new Date()
            });

            setMessage(`Vendor '${vendorData.name}' added successfully!`);
            setMessageType('success');

            // Reset form
            setVendorData({
                name: '',
                country: '',
                state: '',
                contactInfo: ''
            });
        } catch (error) {
            console.error("Error adding vendor:", error);
            setMessage("Error adding vendor. Please try again.");
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={avStyles.container}>
            <h2 style={avStyles.title}>Add New Vendor</h2>
            <form onSubmit={handleSubmit} style={avStyles.form}>
                <div style={avStyles.inputGroup}>
                    <label style={avStyles.label}>Vendor Name</label>
                    <input
                        type="text"
                        name="name"
                        value={vendorData.name}
                        onChange={handleInputChange}
                        style={avStyles.input}
                        required
                        placeholder="Enter vendor name"
                    />
                </div>

                <div style={avStyles.inputGroup}>
                    <label style={avStyles.label}>Country</label>
                    <input
                        type="text"
                        name="country"
                        value={vendorData.country}
                        onChange={handleInputChange}
                        style={avStyles.input}
                        required
                        placeholder="Enter country"
                    />
                </div>

                <div style={avStyles.inputGroup}>
                    <label style={avStyles.label}>State/Province</label>
                    <input
                        type="text"
                        name="state"
                        value={vendorData.state}
                        onChange={handleInputChange}
                        style={avStyles.input}
                        placeholder="Enter state or province"
                    />
                </div>

                <div style={avStyles.inputGroup}>
                    <label style={avStyles.label}>Contact Information</label>
                    <input
                        type="text"
                        name="contactInfo"
                        value={vendorData.contactInfo}
                        onChange={handleInputChange}
                        style={avStyles.input}
                        placeholder="Phone, email, or other contact info"
                    />
                </div>

                <button
                    type="submit"
                    style={{
                        ...avStyles.button,
                        ...(isLoading && avStyles.buttonDisabled)
                    }}
                    disabled={isLoading}
                >
                    {isLoading ? 'Adding Vendor...' : 'Add Vendor'}
                </button>
            </form>

            {message && (
                <div style={{
                    ...avStyles.message,
                    ...(messageType === 'success' ? avStyles.successMessage : avStyles.errorMessage)
                }}>
                    {message}
                </div>
            )}
        </div>
    );
};



const RemoveData = ({ db, functions }) => {
    const [activeTab, setActiveTab] = useState('Sources');
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('');
    const collections = {
        Sources: 'sources',
        Vendors: 'vendors',
        Users: 'users'
    };
    const tabIcons = {
        Sources: '📦',
        Vendors: '🏢',
        Users: '👥'
    };

    // Styles for this new component
    const rdStyles = {
        container: {
            maxWidth: '1000px',
            margin: '0 auto',
            fontFamily: "'Inter', sans-serif",
            backgroundColor: '#f9fafb',
            padding: '40px',
            borderRadius: '16px',
        },
        header: {
            fontSize: '32px',
            fontWeight: '700',
            color: '#1a2c3d',
            marginBottom: '10px'
        },
        subtitle: {
            fontSize: '16px',
            color: '#6c757d',
            marginBottom: '30px',
        },
        tabs: {
            display: 'flex',
            borderBottom: '1px solid #e5e7eb',
            marginBottom: '30px'
        },
        tab: {
            padding: '12px 20px',
            cursor: 'pointer',
            fontWeight: '600',
            color: '#6c757d',
            borderBottom: '3px solid transparent',
            transition: 'all 0.2s ease-in-out',
            marginRight: '10px'
        },
        activeTab: {
            color: '#007bff',
            borderBottom: '3px solid #007bff'
        },
        list: {
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        },
        listItem: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'white',
            padding: '16px 20px',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
            border: '1px solid #e5e7eb',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        },
        itemContent: {
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
        },
        itemIcon: {
            fontSize: '20px'
        },
        itemName: {
            fontWeight: '600',
            color: '#333'
        },
        itemRole: {
            color: '#888',
            marginLeft: '8px',
            fontSize: '14px',
            backgroundColor: '#f0f0f0',
            padding: '2px 8px',
            borderRadius: '12px'
        },
        deleteButton: {
            padding: '8px 16px',
            border: 'none',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'background-color 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
        },
        deleteButtonHover: {
            backgroundColor: '#ef4444',
            color: 'white',
        },
        feedback: { padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#d1fae5', color: '#065f46' },
        error: { padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fee2e2', color: '#991b1b' },
        loadingContainer: {
            textAlign: 'center',
            padding: '60px',
        },
        spinner: {
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px auto'
        }
    };

    // CSS animation for the spinner
    const spinnerKeyframes = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
// This is inside your RemoveData component in Dashboard.jsx

    useEffect(() => {
        setIsLoading(true);
        setError('');
        setItems([]);
        const collectionName = collections[activeTab];
        if (!collectionName) return;

        const unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
            let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // ADDED: If we are on the Users tab, filter out the super admin
            if (activeTab === 'Users') {
                data = data.filter(user => user.email !== 'admin@circulyte.com');
            }

            setItems(data);
            setIsLoading(false);
        }, (err) => {
            setError(`Failed to load ${activeTab}. Please check collection name and permissions.`);
            console.error(err);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [activeTab, db]);

    const showFeedback = (message) => {
        setFeedback(message);
        setTimeout(() => setFeedback(''), 3000);
    };

    const handleDelete = async (collectionName, id) => {
        if (!window.confirm(`Are you sure you want to delete this item? This action cannot be undone.`)) return;
        try {
            await deleteDoc(doc(db, collectionName, id));
            showFeedback(`${activeTab.slice(0, -1)} removed successfully.`);
        } catch (err) {
            setError(`Failed to delete item. See console for details.`);
            console.error(err);
        }
    };

// This is inside your RemoveData component in Dashboard.jsx

    const handleDeleteUser = async (email) => { // Now takes email instead of uid
        if (!window.confirm(`Are you sure you want to delete the user "${email}"?`)) return;

        try {
            const deleteUserFn = httpsCallable(functions, 'deleteUser');
            // Pass the email to the function
            await deleteUserFn({ email: email });
            showFeedback(`User ${email} has been deleted.`);
        } catch (err) {
            setError(`Failed to delete user: ${err.message}`);
            console.error(err);
        }
    };
    return (
        <>
            <style>{spinnerKeyframes}</style>
            <div style={rdStyles.container}>
                <h2 style={rdStyles.header}>Remove Data</h2>
                <p style={rdStyles.subtitle}>Select a category to view and remove existing items.</p>
                <div style={rdStyles.tabs}>
                    {Object.keys(collections).map(tabName => (
                        <div
                            key={tabName}
                            style={{ ...rdStyles.tab, ...(activeTab === tabName && rdStyles.activeTab) }}
                            onClick={() => setActiveTab(tabName)}
                        >
                            {tabName}
                        </div>
                    ))}
                </div>

                {feedback && <div style={rdStyles.feedback}>✅ {feedback}</div>}
                {error && <div style={rdStyles.error}>❌ {error}</div>}

                {isLoading ? (
                    <div style={rdStyles.loadingContainer}>
                        <div style={rdStyles.spinner}></div>
                        <p>Loading {activeTab}...</p>
                    </div>
                ) : (
                    <div style={rdStyles.list}>
                        {items.length === 0 && <p>No {activeTab.toLowerCase()} found.</p>}
                        {items.map(item => (
                            <div key={item.id} style={rdStyles.listItem}>
                                <div style={rdStyles.itemContent}>
                                    <span style={rdStyles.itemIcon}>{tabIcons[activeTab]}</span>
                                    <span style={rdStyles.itemName}>
                                        {activeTab === 'Users' ? item.email : item.name}
                                        {activeTab === 'Users' && <span style={rdStyles.itemRole}>{item.role}</span>}
                                    </span>
                                </div>
                                <button
                                    style={rdStyles.deleteButton}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = rdStyles.deleteButtonHover.backgroundColor}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = rdStyles.deleteButton.backgroundColor}
                                    onClick={() => {
                                        // UPDATED LOGIC: Simplified to match our latest Cloud Function
                                        if (activeTab === 'Users') {
                                            handleDeleteUser(item.email);
                                        } else {
                                            handleDelete(collections[activeTab], item.id);
                                        }
                                    }}
                                >
                                    <span>🗑️</span> Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};






// #####################################################################
// #  Sub-Component: ViewBatches                                     #
// #####################################################################
// #####################################################################
// #  Sub-Component: ViewBatches                                     #
// #####################################################################
const ViewBatches = ({ db }) => {
    const [batches, setBatches] = useState([]);
    const [lastVisible, setLastVisible] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState('');
    const [selectedDate, setSelectedDate] = useState('');

    const BATCH_LIMIT = 20;

    // --- STYLES (same as before) ---
    const vbStyles = {
        container: { maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif" },
        header: { marginBottom: '30px' },
        title: { fontSize: '32px', fontWeight: '700', color: '#1a2c3d' },
        subtitle: { fontSize: '16px', color: '#6c757d' },
        filterBar: { display: 'flex', gap: '15px', alignItems: 'center', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', marginBottom: '30px' },
        dateInput: { padding: '10px 14px', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '14px', outline: 'none' },
        button: { padding: '10px 20px', fontSize: '14px', fontWeight: '600', borderRadius: '8px', cursor: 'pointer', border: 'none', transition: 'background-color 0.2s ease' },
        filterBtn: { backgroundColor: '#007bff', color: 'white' },
        clearBtn: { backgroundColor: '#6c757d', color: 'white' },
        listContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' },
        batchCard: { backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' },
        batchId: { fontSize: '14px', fontWeight: 'bold', color: '#007bff', backgroundColor: 'rgba(0, 123, 255, 0.1)', padding: '4px 8px', borderRadius: '6px', display: 'inline-block', marginBottom: '15px' },
        batchInfo: { fontSize: '16px', color: '#333', marginBottom: '8px' },
        infoLabel: { fontWeight: '600', color: '#555' },
        loadMoreContainer: { textAlign: 'center', marginTop: '30px' },
        error: { padding: '15px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fee2e2', color: '#991b1b' },
        loading: { textAlign: 'center', padding: '50px', fontSize: '18px', color: '#6c757d' }
    };

    // --- DATA FETCHING ---
    const fetchBatches = async (loadMore = false, dateFilter = null) => {
        setIsLoading(true);
        setError('');
        try {
            // FIX 1: Collection ka naam 'batches' kiya
            const batchesCollection = collection(db, "batches");
            let q;

            if (dateFilter) {
                const startOfDay = new Date(dateFilter);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(dateFilter);
                endOfDay.setHours(23, 59, 59, 999);

                // FIX 2: dateReceived field ka istemaal kiya
                q = query(batchesCollection,
                    orderBy("dateReceived", "desc"),
                    where("dateReceived", ">=", startOfDay),
                    where("dateReceived", "<=", endOfDay)
                );
                setHasMore(false);
            } else {
                // FIX 2: dateReceived field ka istemaal kiya
                if (loadMore && lastVisible) {
                    q = query(batchesCollection, orderBy("dateReceived", "desc"), startAfter(lastVisible), limit(BATCH_LIMIT));
                } else {
                    q = query(batchesCollection, orderBy("dateReceived", "desc"), limit(BATCH_LIMIT));
                }
            }

            const documentSnapshots = await getDocs(q);
            const newBatches = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setBatches(prev => (loadMore && !dateFilter) ? [...prev, ...newBatches] : newBatches);

            const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
            setLastVisible(lastDoc);

            if (!dateFilter) {
                setHasMore(newBatches.length === BATCH_LIMIT);
            }

        } catch (err) {
            console.error("Error fetching batches:", err);
            setError("Failed to fetch batches. Please ensure the 'batches' collection exists and you have correct permissions.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBatches(false); // Initial fetch
    }, []);

    // --- HANDLERS (same as before) ---
    const handleLoadMore = () => {
        if (hasMore) {
            fetchBatches(true);
        }
    };

    const handleFilterByDate = () => {
        if (selectedDate) {
            setBatches([]);
            setLastVisible(null);
            fetchBatches(false, selectedDate);
        }
    };

    const handleClearFilter = () => {
        setSelectedDate('');
        setBatches([]);
        setLastVisible(null);
        setHasMore(true);
        fetchBatches(false);
    };

    return (
        <div style={vbStyles.container}>
            <div style={vbStyles.header}>
                <h2 style={vbStyles.title}>View Batches</h2>
                <p style={vbStyles.subtitle}>Browse, search, and manage all incoming batches.</p>
            </div>

            <div style={vbStyles.filterBar}>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={vbStyles.dateInput}
                />
                <button onClick={handleFilterByDate} style={{...vbStyles.button, ...vbStyles.filterBtn}} disabled={!selectedDate}>Filter by Date</button>
                <button onClick={handleClearFilter} style={{...vbStyles.button, ...vbStyles.clearBtn}}>Clear Filter</button>
            </div>

            {error && <div style={vbStyles.error}>❌ {error}</div>}

            {isLoading && batches.length === 0 ? (
                <p style={vbStyles.loading}>Loading batches...</p>
            ) : (
                <>
                    <div style={vbStyles.listContainer}>
                        {batches.length > 0 ? batches.map(batch => (
                            <div key={batch.id} style={vbStyles.batchCard}>
                                <p style={vbStyles.batchId}>{batch.id}</p>
                                {/* FIX 3: Fields ko screenshot ke hisaab se update kiya */}
                                <p style={vbStyles.batchInfo}><span style={vbStyles.infoLabel}>Source:</span> {batch.source || 'N/A'}</p>
                                <p style={vbStyles.batchInfo}><span style={vbStyles.infoLabel}>Box Count:</span> {batch.boxCount || 0}</p>
                                <p style={vbStyles.batchInfo}><span style={vbStyles.infoLabel}>Received On:</span> {batch.dateReceived?.toDate().toLocaleString() || 'N/A'}</p>
                                <p style={vbStyles.batchInfo}><span style={vbStyles.infoLabel}>Created By:</span> {batch.createdBy || 'N/A'}</p>
                            </div>
                        )) : (
                            <p>No batches found for the selected criteria.</p>
                        )}
                    </div>
                    <div style={vbStyles.loadMoreContainer}>
                        {hasMore && !isLoading && (
                            <button onClick={handleLoadMore} style={{...vbStyles.button, ...vbStyles.filterBtn}}>Load More</button>
                        )}
                        {isLoading && batches.length > 0 && <p>Loading...</p>}
                    </div>
                </>
            )}
        </div>
    );
};



// #####################################################################
// #  Sub-Component: TraceabilityDashboard                             #
// #####################################################################
const TraceabilityDashboard = ({ db }) => {
    // State for the list of all fiber packs
    const [fiberPacks, setFiberPacks] = useState([]);
    const [isLoadingList, setIsLoadingList] = useState(true);

    // State for the selected pack's journey
    const [selectedPack, setSelectedPack] = useState(null);
    const [traceData, setTraceData] = useState(null);
    const [isLoadingTrace, setIsLoadingTrace] = useState(false);
    const [error, setError] = useState('');

    // --- STYLES ---
    const tdStyles = {
        container: { display: 'flex', gap: '30px', fontFamily: "'Inter', sans-serif", height: 'calc(100vh - 120px)' },
        listPanel: { flex: '1 1 350px', backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', overflowY: 'auto' },
        tracePanel: { flex: '2 1 600px', backgroundColor: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', overflowY: 'auto' },
        header: { fontSize: '22px', fontWeight: '600', color: '#1a2c3d', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' },
        packItem: { padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '10px', cursor: 'pointer', transition: 'all 0.2s ease' },
        selectedPackItem: { borderColor: '#007bff', backgroundColor: '#eff6ff', transform: 'scale(1.02)' },
        packId: { fontWeight: '600', color: '#007bff' },
        packDate: { fontSize: '12px', color: '#6c757d', marginTop: '4px' },
        placeholder: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#6c757d', textAlign: 'center' },
        traceTitle: { fontSize: '28px', fontWeight: 'bold', color: '#007bff', marginBottom: '25px' },
        sectionTitle: { fontSize: '20px', fontWeight: '600', color: '#1a2c3d', marginTop: '30px', marginBottom: '15px', borderBottom: '2px solid #007bff', paddingBottom: '8px' },
        detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' },
        detailItem: { backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px' },
        detailLabel: { fontSize: '12px', fontWeight: 'bold', color: '#6c757d', marginBottom: '4px' },
        detailValue: { fontSize: '16px', color: '#1a2c3d' },
        table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
        th: { borderBottom: '2px solid #e5e7eb', padding: '12px', textAlign: 'left', backgroundColor: '#f8fafc', fontWeight: '600', fontSize: '14px' },
        td: { borderBottom: '1px solid #e5e7eb', padding: '12px', fontSize: '14px' },
        loading: { textAlign: 'center', padding: '50px' }
    };

    // --- DATA FETCHING LOGIC ---

    // 1. Fetch the list of all fiber packs on component mount
    useEffect(() => {
        const fetchAllFiberPacks = async () => {
            setIsLoadingList(true);
            try {
                const q = query(collection(db, "fiberPacks"), orderBy("recycledAt", "desc"), limit(100));
                const querySnapshot = await getDocs(q);
                const packs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setFiberPacks(packs);
            } catch (err) {
                console.error("Error fetching fiber packs:", err);
                setError("Could not load fiber packs list.");
            } finally {
                setIsLoadingList(false);
            }
        };
        fetchAllFiberPacks();
    }, [db]);

    // 2. Fetch the full journey when a pack is selected
    const handleSelectPack = async (pack) => {
        if (selectedPack?.id === pack.id) return; // Avoid re-fetching if already selected

        setSelectedPack(pack);
        setIsLoadingTrace(true);
        setTraceData(null);
        setError('');

        try {
            // Step 1: Get Sorted Pack IDs from the selected Fiber Pack
            const sortedPackIds = pack.fromSortedPacks;
            if (!sortedPackIds || sortedPackIds.length === 0) {
                throw new Error('This Fiber Pack has no linked Sorted Packs.');
            }

            // Step 2: Fetch the Sorted Packs data
            const sortedPacksQuery = query(collection(db, 'sortedPacks'), where(documentId(), 'in', sortedPackIds));
            const sortedPacksSnap = await getDocs(sortedPacksQuery);
            const sortedPacksData = sortedPacksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // Step 3: Get original Batch IDs from the Sorted Packs
            const batchIds = [...new Set(sortedPacksData.map(p => p.originalBatchId).filter(Boolean))];
            if (!batchIds || batchIds.length === 0) {
                setTraceData({ fiberPack: pack, sortedPacks: sortedPacksData, batches: [] });
                return; // No batches to fetch, but still show sorted packs
            }

            // Step 4: Fetch the original Batches data
            const batchesQuery = query(collection(db, 'batches'), where(documentId(), 'in', batchIds));
            const batchesSnap = await getDocs(batchesQuery);
            const batchesData = batchesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // Step 5: Combine all data for display
            setTraceData({
                fiberPack: pack,
                sortedPacks: sortedPacksData,
                batches: batchesData,
            });

        } catch (err) {
            console.error("Traceability Error:", err);
            setError(err.message);
        } finally {
            setIsLoadingTrace(false);
        }
    };

    // --- RENDER FUNCTIONS ---
    const renderTraceDetails = () => {
        if (isLoadingTrace) return <p style={tdStyles.loading}>Loading Journey...</p>;
        if (error) return <p style={{color: 'red'}}>Error: {error}</p>;
        if (!traceData) return null;

        return (
            <div>
                <h2 style={tdStyles.traceTitle}>{traceData.fiberPack.id}</h2>

                <div style={tdStyles.detailGrid}>
                    <div style={tdStyles.detailItem}><div style={tdStyles.detailLabel}>Weight</div><div style={tdStyles.detailValue}>{traceData.fiberPack.weight} KG</div></div>
                    <div style={tdStyles.detailItem}><div style={tdStyles.detailLabel}>Recycled On</div><div style={tdStyles.detailValue}>{traceData.fiberPack.recycledAt?.toDate().toLocaleDateString()}</div></div>
                    <div style={tdStyles.detailItem}><div style={tdStyles.detailLabel}>Materials</div><div style={tdStyles.detailValue}>{traceData.fiberPack.materials?.join(', ')}</div></div>
                    <div style={tdStyles.detailItem}><div style={tdStyles.detailLabel}>Colors</div><div style={tdStyles.detailValue}>{traceData.fiberPack.colors?.join(', ')}</div></div>
                </div>

                <h3 style={tdStyles.sectionTitle}>Stage 2: Constituent Sorted Packs</h3>
                <table style={tdStyles.table}>
                    <thead><tr><th style={tdStyles.th}>ID</th><th style={tdStyles.th}>Brand</th><th style={tdStyles.th}>Material</th><th style={tdStyles.th}>Weight</th></tr></thead>
                    <tbody>
                    {traceData.sortedPacks.map(sp => (
                        <tr key={sp.id}>
                            <td style={tdStyles.td}>{sp.id}</td>
                            <td style={tdStyles.td}>{sp.brand}</td>
                            <td style={tdStyles.td}>{sp.material}</td>
                            <td style={tdStyles.td}>{sp.weight} KG</td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                <h3 style={tdStyles.sectionTitle}>Stage 1: Original Source Batches</h3>
                <table style={tdStyles.table}>
                    <thead><tr><th style={tdStyles.th}>Batch ID</th><th style={tdStyles.th}>Source</th><th style={tdStyles.th}>Date Received</th></tr></thead>
                    <tbody>
                    {traceData.batches.map(b => (
                        <tr key={b.id}>
                            <td style={tdStyles.td}>{b.id}</td>
                            <td style={tdStyles.td}>{b.source}</td>
                            <td style={tdStyles.td}>{b.dateReceived?.toDate().toLocaleDateString()}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    };


    return (
        <div style={tdStyles.container}>
            <div style={tdStyles.listPanel}>
                <h2 style={tdStyles.header}>Fiber Packs</h2>
                {isLoadingList ? (
                    <p style={tdStyles.loading}>Loading Packs...</p>
                ) : (
                    fiberPacks.map(pack => (
                        <div
                            key={pack.id}
                            style={{ ...tdStyles.packItem, ...(selectedPack?.id === pack.id ? tdStyles.selectedPackItem : {}) }}
                            onClick={() => handleSelectPack(pack)}
                        >
                            <p style={tdStyles.packId}>{pack.id}</p>
                            <p style={tdStyles.packDate}>Recycled: {pack.recycledAt?.toDate().toLocaleString()}</p>
                        </div>
                    ))
                )}
            </div>
            <div style={tdStyles.tracePanel}>
                {!selectedPack ? (
                    <div style={tdStyles.placeholder}>
                        <p style={{fontSize: '48px'}}>📜</p>
                        <h3 style={{fontSize: '20px', fontWeight: 600}}>Select a Fiber Pack</h3>
                        <p>Click on a pack from the list to view its complete journey from source to recycling.</p>
                    </div>
                ) : (
                    renderTraceDetails()
                )}
            </div>
        </div>
    );
};

// #####################################################################
// #  MAIN DASHBOARD COMPONENT                                       #
// #####################################################################
const Dashboard = ({ auth, db, functions }) => {
    const [activeNav, setActiveNav] = useState('Apparel');
    const [allSortedPacks, setAllSortedPacks] = useState([]);
    const [allFiberPacks, setAllFiberPacks] = useState([]);
    const [allBatches, setAllBatches] = useState([]);
    const [stats, setStats] = useState({ totalWeightSorted: 0, totalFiberWeight: 0, packsInStorage: 0, packsRecycled: 0 });
    const [barChartData, setBarChartData] = useState([]);
    const [pieChartData, setPieChartData] = useState([]);
    const [filters, setFilters] = useState({ source: 'All', material: 'All', startDate: '', endDate: '' });
    const [filterOptions, setFilterOptions] = useState({ sources: [], materials: [] });
    const [isLoading, setIsLoading] = useState(true);

    const styles = {
        dashboardContainer: { display: 'flex', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f7f6', height: '100vh', width: '100vw', overflow: 'hidden' },
        sidebar: { width: '250px', backgroundColor: '#1a2c3d', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column' },
        sidebarHeader: { fontSize: '24px', fontWeight: 'bold', marginBottom: '40px', textAlign: 'center' },
        sidebarNav: { listStyle: 'none', padding: 0 },
        sidebarNavItem: { padding: '15px 20px', borderRadius: '8px', marginBottom: '10px', cursor: 'pointer', transition: 'background-color 0.3s ease' },
        activeNavItem: { backgroundColor: '#007bff' },
        mainContent: { flex: 1, padding: '40px', overflowY: 'auto' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' },
        headerTitle: { fontSize: '28px', fontWeight: 'bold', color: '#1a2c3d' },
        statCardsContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '25px', marginBottom: '40px' },
        statCard: { backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', borderLeft: '5px solid #007bff' },
        statLabel: { fontSize: '15px', color: '#6c757d', marginBottom: '8px' },
        statValue: { fontSize: '36px', fontWeight: 'bold', color: '#1a2c3d' },
        chartsContainer: { display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '25px', minHeight: '420px' },
        chartWrapper: { backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' },
        chartTitle: { fontSize: '20px', fontWeight: 'bold', marginBottom: '25px', color: '#343a40' },
        loadingContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', fontSize: '24px', color: '#1a2c3d' },
        filterBar: { display: 'flex', gap: '15px', alignItems: 'center', backgroundColor: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', marginBottom: '30px', flexWrap: 'wrap' },
        filterGroup: { display: 'flex', flexDirection: 'column' },
        filterLabel: { fontSize: '12px', color: '#6c757d', marginBottom: '5px' },
        filterInput: { padding: '8px 12px', borderRadius: '5px', border: '1px solid #ced4da', fontSize: '14px' }
    };

    const PIE_COLORS = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1'];
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        if (percent < 0.05) return null;
        return (<text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontWeight="bold">{`${name} ${(percent * 100).toFixed(0)}%`}</text>);
    };

    useEffect(() => {
        setIsLoading(true);

        // Fetch data that doesn't need to be real-time (optional)
        const fetchStaticData = async () => {
            try {
                const [sortedPacksSnapshot, fiberPacksSnapshot, batchesSnapshot] = await Promise.all([
                    getDocs(collection(db, 'sortedPacks')),
                    getDocs(collection(db, 'fiberPacks')),
                    getDocs(collection(db, 'batches'))
                ]);

                const sortedPacksData = sortedPacksSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, sortedAt: doc.data().sortedAt?.toDate() }));
                const fiberPacksData = fiberPacksSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                const batchesData = batchesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

                setAllSortedPacks(sortedPacksData);
                setAllFiberPacks(fiberPacksData);
                setAllBatches(batchesData);

                // Update materials filter from the packs data
                setFilterOptions(prevOptions => ({
                    ...prevOptions,
                    materials: [...new Set(sortedPacksData.map(p => p.material).filter(Boolean))]
                }));

            } catch (error) {
                console.error("Error fetching static data:", error);
            }
        };

        fetchStaticData();

        // --- REAL-TIME LISTENER FOR SOURCES (from the 'sources' collection) ---
        const sourcesCollection = collection(db, 'sources');
        const unsubscribe = onSnapshot(sourcesCollection, (querySnapshot) => {
            const sourcesData = querySnapshot.docs.map(doc => doc.data().name); // <-- THE IMPORTANT CHANGE

            // Update the sources filter options with the latest data
            setFilterOptions(prevOptions => ({
                ...prevOptions,
                sources: [...new Set(sourcesData.filter(Boolean))]
            }));

            setIsLoading(false); // Stop loading once sources are fetched
        }, (error) => {
            console.error("Error listening to sources collection:", error);
            setIsLoading(false);
        });

        // Cleanup the listener when the component unmounts
        return () => {
            unsubscribe();
        };

    }, [db]);
    useEffect(() => {
        if (isLoading) return;
        let filteredSortedPacks = allSortedPacks.filter(pack => {
            if (filters.material !== 'All' && pack.material !== filters.material) return false;
            if (filters.startDate && (!pack.sortedAt || pack.sortedAt < new Date(filters.startDate))) return false;
            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999);
                if (!pack.sortedAt || pack.sortedAt > endDate) return false;
            }
            if (filters.source !== 'All') {
                const batch = allBatches.find(b => b.id === pack.originalBatchId);
                if (!batch || batch.source !== filters.source) return false;
            }
            return true;
        });
        const filteredSortedPackIds = new Set(filteredSortedPacks.map(p => p.id));
        const relevantFiberPacks = allFiberPacks.filter(fp => fp.fromSortedPacks?.some(id => filteredSortedPackIds.has(id)));
        const totalWeightSorted = filteredSortedPacks.reduce((sum, pack) => sum + (pack.weight || 0), 0);
        const totalFiberWeight = relevantFiberPacks.reduce((sum, pack) => sum + (pack.weight || 0), 0);
        const recycledPackIds = new Set(relevantFiberPacks.flatMap(pack => pack.fromSortedPacks || []));
        const packsRecycled = filteredSortedPacks.filter(p => recycledPackIds.has(p.id)).length;
        const packsInStorage = filteredSortedPacks.length - packsRecycled;
        setStats({
            totalWeightSorted: totalWeightSorted.toFixed(2),
            totalFiberWeight: totalFiberWeight.toFixed(2),
            packsInStorage: packsInStorage >= 0 ? packsInStorage : 0,
            packsRecycled
        });
        const materialWeights = filteredSortedPacks.reduce((acc, pack) => {
            if (pack.material) acc[pack.material] = (acc[pack.material] || 0) + pack.weight;
            return acc;
        }, {});
        setBarChartData(Object.entries(materialWeights).map(([name, weight]) => ({ name, weight: parseFloat(weight.toFixed(2)) })));
        setPieChartData(Object.entries(materialWeights).map(([name, value]) => ({ name, value })));
    }, [filters, allSortedPacks, allFiberPacks, allBatches, isLoading]);

    const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleNavClick = (navItem) => setActiveNav(navItem);
    const handleLogout = async () => { await signOut(auth); };

    const renderMainContent = () => {
        if (activeNav === 'QR Generator') return <QRCodeGenerator />;
        if (activeNav === 'User Management') return <UserManagement functions={functions} />;
        if (activeNav === 'Add Sources') return <AddSource db={db} />;
        if (activeNav === 'Add Vendor') return <AddVendor db={db} />; // Add this line
        if (activeNav === 'Furniture') return <div style={{ textAlign: 'center' }}><h2>Furniture Dashboard Coming Soon</h2></div>;
        if (activeNav === 'Remove Data') return <RemoveData db={db} functions={functions} />; // <-- ADDED THIS
        if (activeNav === 'View Batches') return <ViewBatches db={db} />;
        if (activeNav === 'Traceability') return <TraceabilityDashboard db={db} />;

        return (
            <>
                <div style={styles.header}> <h2 style={styles.headerTitle}>Apparel Dashboard</h2> </div>
                <div style={styles.filterBar}>
                    <div style={styles.filterGroup}><label style={styles.filterLabel}>Source</label><select name="source" value={filters.source} onChange={handleFilterChange} style={styles.filterInput}><option value="All">All Sources</option>{filterOptions.sources.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                    <div style={styles.filterGroup}><label style={styles.filterLabel}>Material</label><select name="material" value={filters.material} onChange={handleFilterChange} style={styles.filterInput}><option value="All">All Materials</option>{filterOptions.materials.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                    <div style={styles.filterGroup}><label style={styles.filterLabel}>Start Date</label><input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} style={styles.filterInput} /></div>
                    <div style={styles.filterGroup}><label style={styles.filterLabel}>End Date</label><input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} style={styles.filterInput} /></div>
                </div>
                <div style={styles.statCardsContainer}>
                    <div style={styles.statCard}><div style={styles.statLabel}>Total Weight Sorted</div><div style={styles.statValue}>{stats.totalWeightSorted} KG</div></div>
                    <div style={styles.statCard}><div style={styles.statLabel}>Total Fiber Weight</div><div style={styles.statValue}>{stats.totalFiberWeight} KG</div></div>
                    <div style={styles.statCard}><div style={styles.statLabel}>Packs In Storage</div><div style={styles.statValue}>{stats.packsInStorage}</div></div>
                    <div style={styles.statCard}><div style={styles.statLabel}>Packs Recycled</div><div style={styles.statValue}>{stats.packsRecycled}</div></div>
                </div>
                <div style={styles.chartsContainer}>
                    <div style={styles.chartWrapper}><h3 style={styles.chartTitle}>Material Processed (by Weight)</h3><ResponsiveContainer width="100%" height="100%"><BarChart data={barChartData}><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v) => `${v} kg`} /><Legend /><Bar dataKey="weight" fill="#007bff" /></BarChart></ResponsiveContainer></div>
                    <div style={styles.chartWrapper}><h3 style={styles.chartTitle}>Sorted Volume %</h3><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} outerRadius="80%">{pieChartData.map((e, i) => <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip formatter={(v) => `${v.toFixed(2)} kg`} /><Legend /></PieChart></ResponsiveContainer></div>
                </div>
            </>
        );
    };

    if (isLoading) return <div style={{...styles.dashboardContainer, ...styles.loadingContainer}}><h2>Loading Dashboard...</h2></div>;

    return (
        <div style={styles.dashboardContainer}>
            <aside style={styles.sidebar}>
                <h1 style={styles.sidebarHeader}>LANDMARK</h1>
                <ul style={styles.sidebarNav}>
                    <li style={{...styles.sidebarNavItem, ...(activeNav === 'Apparel' ? styles.activeNavItem : {})}} onClick={() => handleNavClick('Apparel')}>Apparel</li>
                    <li style={{...styles.sidebarNavItem, ...(activeNav === 'Furniture' ? styles.activeNavItem : {})}} onClick={() => handleNavClick('Furniture')}>Furniture</li>
                    <li style={{...styles.sidebarNavItem, ...(activeNav === 'User Management' ? styles.activeNavItem : {})}} onClick={() => handleNavClick('User Management')}>User Management</li>
                    <li style={{...styles.sidebarNavItem, ...(activeNav === 'Add Sources' ? styles.activeNavItem : {})}} onClick={() => handleNavClick('Add Sources')}>+ Add Sources</li>
                    <li style={{...styles.sidebarNavItem, ...(activeNav === 'Add Vendor' ? styles.activeNavItem : {})}} onClick={() => handleNavClick('Add Vendor')}>+ Add Vendor</li> {/* Add this line */}
                    <li style={{...styles.sidebarNavItem, ...(activeNav === 'View Batches' ? styles.activeNavItem : {})}} onClick={() => handleNavClick('View Batches')}>📄 View Batches</li>
                    <li style={{...styles.sidebarNavItem, ...(activeNav === 'QR Generator' ? styles.activeNavItem : {})}} onClick={() => handleNavClick('QR Generator')}>🔲 QR Generator</li>
                    <li style={{...styles.sidebarNavItem, ...(activeNav === 'Remove Data' ? styles.activeNavItem : {})}} onClick={() => handleNavClick('Remove Data')}>🗑️ Remove Data</li>
                    <li style={{...styles.sidebarNavItem, ...(activeNav === 'Traceability' ? styles.activeNavItem : {})}} onClick={() => handleNavClick('Traceability')}>📄ιχ Traceability</li>


                </ul>
                <button onClick={handleLogout} style={{...styles.sidebarNavItem, backgroundColor: '#dc3545', marginTop: 'auto', border: 'none', color: 'white', textAlign: 'left'}}>Logout</button>
            </aside>
            <main style={styles.mainContent}>{renderMainContent()}</main>
        </div>
    );
};

export default Dashboard;

