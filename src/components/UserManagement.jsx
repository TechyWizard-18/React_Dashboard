import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';

const UserManagement = ({ functions }) => {
    const [formData, setFormData] = useState({ email: '', password: '', role: 'sorter' });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success', 'error', or 'info'

    const styles = {
        container: { maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' },
        title: { fontSize: '28px', fontWeight: 'bold', color: '#1a2c3d', marginBottom: '30px', textAlign: 'center' },
        form: { display: 'flex', flexDirection: 'column', gap: '20px' },
        formGroup: { display: 'flex', flexDirection: 'column' },
        label: { fontSize: '16px', fontWeight: 'bold', color: '#343a40', marginBottom: '8px' },
        input: { padding: '12px 16px', fontSize: '16px', border: '2px solid #e9ecef', borderRadius: '8px', outline: 'none' },
        select: { padding: '12px 16px', fontSize: '16px', border: '2px solid #e9ecef', borderRadius: '8px', backgroundColor: 'white' },
        button: { padding: '15px 30px', fontSize: '18px', fontWeight: 'bold', color: 'white', backgroundColor: '#007bff', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' },
        buttonDisabled: { backgroundColor: '#6c757d', cursor: 'not-allowed' },
        message: { padding: '15px', borderRadius: '8px', marginTop: '20px', fontSize: '16px', fontWeight: 'bold', textAlign: 'center' },
        successMessage: { backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' },
        errorMessage: { backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (message) setMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password || formData.password.length < 6) {
            setMessage('Please fill all fields. Password must be at least 6 characters.');
            setMessageType('error');
            return;
        }

        setIsLoading(true);
        setMessage('Creating user...');
        setMessageType('info');

        try {
            const createNewUser = httpsCallable(functions, 'createNewUser');
            const result = await createNewUser({ email: formData.email, password: formData.password, role: formData.role });

            setMessage(result.data.message);
            setMessageType('success');
            setFormData({ email: '', password: '', role: 'sorter' });

        } catch (error) {
            console.error('Error creating user:', error);
            setMessage(`Error: ${error.message}`);
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Create New User</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                    <label htmlFor="email" style={styles.label}>Email Address</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} style={styles.input} placeholder="e.g., kartik@sorter.com" disabled={isLoading} required />
                </div>
                <div style={styles.formGroup}>
                    <label htmlFor="password" style={styles.label}>Password</label>
                    <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} style={styles.input} placeholder="Min 6 characters" disabled={isLoading} required />
                </div>
                <div style={styles.formGroup}>
                    <label htmlFor="role" style={styles.label}>Role</label>
                    <select id="role" name="role" value={formData.role} onChange={handleInputChange} style={styles.select} disabled={isLoading} required>
                        <option value="sorter">Sorter</option>
                        <option value="manager">Recycler</option>
                        <option value="admin">Admin</option>
                        <option value="admin">Packer</option>
                    </select>
                </div>
                <button type="submit" style={{ ...styles.button, ...(isLoading ? styles.buttonDisabled : {}) }} disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create User'}
                </button>
            </form>
            {message && (
                <div style={{ ...styles.message, ...(messageType === 'success' ? styles.successMessage : messageType === 'error' ? styles.errorMessage : {}) }}>
                    {message}
                </div>
            )}
        </div>
    );
};

export default UserManagement;