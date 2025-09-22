import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const AddSource = ({ db }) => {
    const [sourceName, setSourceName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'

    // Styles are consistent with your other components
    const styles = {
        container: { maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' },
        title: { fontSize: '28px', fontWeight: 'bold', color: '#1a2c3d', marginBottom: '30px', textAlign: 'center' },
        form: { display: 'flex', flexDirection: 'column', gap: '20px' },
        label: { fontSize: '16px', fontWeight: 'bold', color: '#343a40', marginBottom: '8px' },
        input: { padding: '12px 16px', fontSize: '16px', border: '2px solid #e9ecef', borderRadius: '8px', outline: 'none' },
        button: { padding: '15px 30px', fontSize: '18px', fontWeight: 'bold', color: 'white', backgroundColor: '#28a745', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' },
        buttonDisabled: { backgroundColor: '#6c757d', cursor: 'not-allowed' },
        message: { padding: '15px', borderRadius: '8px', marginTop: '20px', fontSize: '16px', fontWeight: 'bold', textAlign: 'center' },
        successMessage: { backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' },
        errorMessage: { backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!sourceName.trim()) {
            setMessage('Source name cannot be empty.');
            setMessageType('error');
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            const sourcesCollectionRef = collection(db, "sources");
            await addDoc(sourcesCollectionRef, {
                name: sourceName.trim(),
                createdAt: serverTimestamp()
            });

            setMessage(`Successfully added source: ${sourceName.trim()}`);
            setMessageType('success');
            setSourceName(''); // Clear the input field on success

        } catch (error) {
            console.error("Error adding source:", error);
            setMessage("Failed to add source. Please try again.");
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Add New Source</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
                <div>
                    <label htmlFor="sourceName" style={styles.label}>Source Name</label>
                    <input
                        type="text"
                        id="sourceName"
                        value={sourceName}
                        onChange={(e) => setSourceName(e.target.value)}
                        style={styles.input}
                        placeholder="e.g., North Factory, West Warehouse"
                        disabled={isLoading}
                        required
                    />
                </div>
                <button
                    type="submit"
                    style={{ ...styles.button, ...(isLoading ? styles.buttonDisabled : {}) }}
                    disabled={isLoading}
                >
                    {isLoading ? 'Adding...' : 'Add Source'}
                </button>
            </form>
            {message && (
                <div style={{ ...styles.message, ...(messageType === 'success' ? styles.successMessage : styles.errorMessage) }}>
                    {message}
                </div>
            )}
        </div>
    );
};

export default AddSource;
