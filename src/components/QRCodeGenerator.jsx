import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const QRCodeGenerator = () => {
    const [selectedType, setSelectedType] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStatus, setGenerationStatus] = useState('');

    // QR Code type configurations
    const qrTypes = {
        BOX: {
            prefix: 'BX',
            color: '#e74c3c',
            description: 'Box Packaging QR Codes',
            icon: '📦'
        },
        FIBER: {
            prefix: 'FX',
            color: '#27ae60',
            description: 'Fiber Material QR Codes',
            icon: '🧵'
        },
        PACK: {
            prefix: 'PX',
            color: '#3498db',
            description: 'Package QR Codes',
            icon: '📋'
        }
    };

    // Generate QR code ID with unique hash combining timestamp, random chars, and sequential number
    const generateQRId = (type, index) => {
        const now = new Date();

        // Get timestamp components
        const year = now.getFullYear().toString();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

        // Sequential number (padded to 6 digits for up to 999,999 codes)
        const sequentialNum = String(index + 1).padStart(6, '0');

        // Random alphanumeric string (8 characters)
        const randomChars = Math.random().toString(36).substring(2, 10).toUpperCase();

        // Create unique hash: PREFIX + YYYYMMDD + HHMMSS + MS + SEQ + RANDOM
        // Example: BX20251003145230123000001A4F2G9H1
        const uniqueHash = `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}${sequentialNum}${randomChars}`;

        return `${qrTypes[type].prefix}${uniqueHash}`;
    };

    // Generate QR codes and export to Excel efficiently
    const handleGenerateAndExport = async () => {
        if (!selectedType || quantity < 1) {
            alert('Please select a QR type and specify a valid quantity.');
            return;
        }

        if (quantity > 1000000) {
            alert('Maximum quantity is 10,00,000 (10 lakh) QR codes.');
            return;
        }

        setIsGenerating(true);
        setGenerationStatus(`Generating ${quantity.toLocaleString()} QR codes...`);

        try {
            const batchSize = 10000; // Process in batches for efficiency
            const allData = [];
            const generationTimestamp = new Date();
            const generationDate = generationTimestamp.toLocaleDateString('en-IN');
            const generationTime = generationTimestamp.toLocaleString('en-IN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });

            // Generate QR codes in batches
            for (let i = 0; i < quantity; i++) {
                const qrId = generateQRId(selectedType, i);

                allData.push({
                    'Serial Number': i + 1,
                    'QR Code': qrId,
                    'Date': generationDate,
                    'Timestamp': generationTime
                });

                // Update status every 1000 codes
                if ((i + 1) % 1000 === 0) {
                    setGenerationStatus(`Generated ${(i + 1).toLocaleString()} / ${quantity.toLocaleString()} codes...`);
                    // Allow UI to update
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }

            setGenerationStatus('Preparing Excel file...');
            await new Promise(resolve => setTimeout(resolve, 100));

            // Create worksheet from data
            const worksheet = XLSX.utils.json_to_sheet(allData);

            // Set column widths
            worksheet['!cols'] = [
                { wch: 15 }, // Serial Number
                { wch: 25 }, // QR Code
                { wch: 15 }, // Date
                { wch: 25 }  // Timestamp
            ];

            // Create workbook
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, `${selectedType} QR Codes`);

            // Generate filename
            const filename = `${selectedType}_QR_Codes_${quantity}_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.xlsx`;

            // Export to Excel
            XLSX.writeFile(workbook, filename);

            setGenerationStatus(`✅ Successfully generated and exported ${quantity.toLocaleString()} QR codes!`);

            setTimeout(() => {
                setGenerationStatus('');
            }, 3000);

        } catch (error) {
            console.error('Error generating QR codes:', error);
            alert('Error generating QR codes. Please try again with a smaller quantity.');
            setGenerationStatus('');
        } finally {
            setIsGenerating(false);
        }
    };

    // Clear form
    const handleClear = () => {
        setSelectedType('');
        setQuantity(1);
        setGenerationStatus('');
    };

    // Styles
    const styles = {
        container: {
            maxWidth: '900px',
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
            minWidth: '200px',
            flex: 1
        },
        label: {
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '8px',
            color: '#333'
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
        dangerButton: {
            background: 'linear-gradient(135deg, #f44336, #d32f2f)',
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
        statusContainer: {
            background: 'white',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
            textAlign: 'center'
        },
        spinner: {
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #4CAF50',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '20px auto'
        },
        infoBox: {
            background: '#e3f2fd',
            border: '1px solid #2196F3',
            borderRadius: '8px',
            padding: '15px',
            marginTop: '20px'
        },
        infoTitle: {
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#1976D2',
            marginBottom: '10px'
        },
        infoList: {
            textAlign: 'left',
            color: '#333',
            fontSize: '14px',
            lineHeight: '1.8'
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
                    <p style={styles.headerSubtitle}>Generate unique QR Codes and export to Excel</p>
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
                            <label style={styles.label}>Quantity (Max: 10,00,000):</label>
                            <input
                                type="number"
                                min="1"
                                max="1000000"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                style={styles.input}
                                placeholder="Enter quantity (1 to 10,00,000)"
                                disabled={isGenerating}
                            />
                        </div>

                        <button
                            onClick={handleGenerateAndExport}
                            disabled={!selectedType || isGenerating || quantity < 1}
                            style={{
                                ...styles.button,
                                ...styles.primaryButton,
                                opacity: (!selectedType || isGenerating || quantity < 1) ? 0.6 : 1,
                                cursor: (!selectedType || isGenerating || quantity < 1) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isGenerating ? '⏳ Processing...' : '📊 Generate & Export to Excel'}
                        </button>

                        <button
                            onClick={handleClear}
                            disabled={isGenerating}
                            style={{
                                ...styles.button,
                                ...styles.dangerButton,
                                opacity: isGenerating ? 0.6 : 1,
                                cursor: isGenerating ? 'not-allowed' : 'pointer'
                            }}
                        >
                            🗑️ Clear
                        </button>
                    </div>

                    <div style={styles.infoBox}>
                        <div style={styles.infoTitle}>📋 Excel Export Information:</div>
                        <div style={styles.infoList}>
                            • Serial Number: Sequential numbering<br/>
                            • QR Code: Unique QR code ID<br/>
                            • Date: Generation date<br/>
                            • Timestamp: Full date and time<br/>
                            • Format: Excel (.xlsx) file
                        </div>
                    </div>
                </div>

                {isGenerating && (
                    <div style={styles.statusContainer}>
                        <div style={styles.spinner}></div>
                        <h3>{generationStatus}</h3>
                        <p style={{ color: '#666', marginTop: '10px' }}>
                            Please wait... This may take a few moments for large quantities.
                        </p>
                    </div>
                )}

                {generationStatus && !isGenerating && (
                    <div style={styles.statusContainer}>
                        <h3>{generationStatus}</h3>
                    </div>
                )}

                {!isGenerating && !generationStatus && selectedType && (
                    <div style={styles.statusContainer}>
                        <h3>Ready to Generate {selectedType} QR Codes</h3>
                        <p style={{ color: '#666', marginTop: '10px' }}>
                            Click "Generate & Export to Excel" to create {quantity.toLocaleString()} unique {selectedType} QR codes.
                        </p>
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
                    <div style={styles.statusContainer}>
                        <h3>Welcome to QR Code Generator</h3>
                        <p style={{ color: '#666', marginTop: '10px' }}>
                            Select a QR code type above to get started.
                        </p>
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

export default QRCodeGenerator;
