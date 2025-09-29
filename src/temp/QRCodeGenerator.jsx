import React, {useRef, useState} from "react";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
};