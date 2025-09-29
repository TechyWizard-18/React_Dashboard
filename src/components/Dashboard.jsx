
import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { signOut } from "firebase/auth";
import { collection, getDocs, addDoc ,onSnapshot} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
// import { QRCodeCanvas } from 'qrcode.react';
// import { useReactToPrint } from 'react-to-print';
import { doc, deleteDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';

// #####################################################################
// #  Sub-Component 1: QRCodeGenerator                               #
// #####################################################################
const QRCodeGenerator = () => {

    const [selectedType, setSelectedType] = useState('');
    const [quantity, setQuantity] = useState(100);
    const [generatedCodes, setGeneratedCodes] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');

    // QR Code type configurations
    const qrTypes = {
        BOX: { prefix: 'BOX', description: 'Box Packaging Codes', icon: '📦' },
        FIBER: { prefix: 'FIB', description: 'Fiber Material Codes', icon: '🧵' },
        PACK: { prefix: 'PCK', description: 'Package Codes', icon: '📋' }
    };

    /**
     * --- NEW FUNCTION ---
     * Generates a unique, short, and non-sequential code.
     * This creates a 9-character alphanumeric string (36^9 possibilities),
     * making collisions extremely unlikely even at a massive scale.
     * The total code length will be prefix (3) + dash (1) + code (9) = 13 characters.
     */
    const generateUniqueCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const length = 9;
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    // Generates the code data without creating images
    const handleGenerateCodes = () => {
        if (!selectedType || quantity < 1) {
            setFeedbackMessage('Please select a code type and enter a valid quantity.');
            return;
        }

        setIsGenerating(true);
        setFeedbackMessage(`Generating ${quantity} codes...`);
        setGeneratedCodes([]);

        // Use a timeout to keep the UI responsive during large generation tasks
        setTimeout(() => {
            const codes = new Set(); // Use a Set to guarantee uniqueness within a single batch
            const typePrefix = qrTypes[selectedType].prefix;

            // Loop until the desired quantity of unique codes is generated
            while (codes.size < quantity) {
                const uniquePart = generateUniqueCode();
                codes.add(`${typePrefix}-${uniquePart}`);
            }

            const codesArray = Array.from(codes).map(codeId => ({
                'Batch Code ID': codeId,
                'Type': selectedType,
                'Generated At': new Date().toISOString()
            }));

            setGeneratedCodes(codesArray);
            setIsGenerating(false);
            setFeedbackMessage(`✅ Successfully generated ${codesArray.length} unique ${selectedType} codes.`);
        }, 50);
    };

    // Exports the generated data to an Excel file
    const handleExportExcel = () => {
        if (generatedCodes.length === 0) {
            setFeedbackMessage('No codes to export. Please generate codes first.');
            return;
        }

        try {
            // Convert JSON to worksheet
            const worksheet = XLSX.utils.json_to_sheet(generatedCodes);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Batch Codes');

            // Optional: set column widths
            worksheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 30 }];

            // Generate file name
            const fileName = `${selectedType}_${quantity}_Codes_${Date.now()}.xlsx`;

            // Export
            XLSX.writeFile(workbook, fileName);
            setFeedbackMessage('Exported to Excel successfully!');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            setFeedbackMessage('Error exporting to Excel. Check the console for details.');
        }
    };

    // Clears the current state
    const handleClear = () => {
        setGeneratedCodes([]);
        setSelectedType('');
        setQuantity(100);
        setFeedbackMessage('');
    };

    // Inline styles for the component
    const styles = {
        container: { maxWidth: '800px', margin: '2rem auto', fontFamily: 'Arial, sans-serif' },
        header: { textAlign: 'center', marginBottom: '2rem', backgroundColor: '#fff', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
        controlPanel: { backgroundColor: '#fff', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
        inputGroup: { marginBottom: '1.5rem' },
        label: { display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#334155' },
        typeSelector: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' },
        typeButton: { padding: '1.5rem', borderRadius: '0.75rem', border: '2px solid #e2e8f0', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' },
        selectedType: { borderColor: '#3b82f6', backgroundColor: '#eff6ff', ring: '2px' },
        icon: { fontSize: '2rem', marginBottom: '0.5rem' },
        input: { width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '0.5rem', border: '2px solid #e2e8f0' },
        buttonContainer: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' },
        button: { padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: 'bold', borderRadius: '0.5rem', cursor: 'pointer', border: 'none', transition: 'background-color 0.2s' },
        generateBtn: { backgroundColor: '#3b82f6', color: 'white' },
        exportBtn: { backgroundColor: '#16a34a', color: 'white' },
        clearBtn: { backgroundColor: '#ef4444', color: 'white' },
        disabledBtn: { backgroundColor: '#94a3b8', cursor: 'not-allowed' },
        feedback: { marginTop: '1.5rem', padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#f1f5f9', textAlign: 'center' }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>Batch Code Generator</h1>
                <p style={{ color: '#64748b' }}>Generate unique codes and export them to Excel.</p>
            </header>

            <main style={styles.controlPanel}>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>1. Select Code Type</label>
                    <div style={styles.typeSelector}>
                        {Object.entries(qrTypes).map(([type, config]) => (
                            <button
                                key={type}
                                style={{ ...styles.typeButton, ...(selectedType === type ? styles.selectedType : {}) }}
                                onClick={() => setSelectedType(type)}
                            >
                                <div style={styles.icon}>{config.icon}</div>
                                <div style={{ fontWeight: 'bold' }}>{config.prefix}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{config.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div style={styles.inputGroup}>
                    <label style={styles.label} htmlFor="quantity">2. Enter Quantity</label>
                    <input
                        id="quantity"
                        type="number"
                        min="1"
                        max="100000"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        style={styles.input}
                    />
                </div>

                <div style={styles.buttonContainer}>
                    <button
                        onClick={handleGenerateCodes}
                        disabled={!selectedType || isGenerating}
                        style={{ ...styles.button, ...styles.generateBtn, ...((!selectedType || isGenerating) && styles.disabledBtn) }}
                    >
                        {isGenerating ? 'Generating...' : 'Generate Codes'}
                    </button>
                    <button
                        onClick={handleExportExcel}
                        disabled={generatedCodes.length === 0 || isGenerating}
                        style={{ ...styles.button, ...styles.exportBtn, ...((generatedCodes.length === 0 || isGenerating) && styles.disabledBtn) }}
                    >
                        Export to Excel
                    </button>
                    <button
                        onClick={handleClear}
                        style={{ ...styles.button, ...styles.clearBtn }}
                    >
                        Clear
                    </button>
                </div>

                {feedbackMessage && (
                    <div style={styles.feedback}>{feedbackMessage}</div>
                )}
            </main>
        </div>
    );
};

// #####################################################################
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
};// #  Sub-Component 4: AddVendor                                     #
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

                    <li style={{...styles.sidebarNavItem, ...(activeNav === 'QR Generator' ? styles.activeNavItem : {})}} onClick={() => handleNavClick('QR Generator')}>🔲 QR Generator</li>
                    <li style={{...styles.sidebarNavItem, ...(activeNav === 'Remove Data' ? styles.activeNavItem : {})}} onClick={() => handleNavClick('Remove Data')}>🗑️ Remove Data</li>


                </ul>
                <button onClick={handleLogout} style={{...styles.sidebarNavItem, backgroundColor: '#dc3545', marginTop: 'auto', border: 'none', color: 'white', textAlign: 'left'}}>Logout</button>
            </aside>
            <main style={styles.mainContent}>{renderMainContent()}</main>
        </div>
    );
};

export default Dashboard;

