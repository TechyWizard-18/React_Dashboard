import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import * as XLSX from 'xlsx';

const VendorShipments = ({ db }) => {
    const [shipments, setShipments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedShipment, setSelectedShipment] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterVendor, setFilterVendor] = useState('All');

    const styles = {
        container: { padding: '20px', backgroundColor: '#f4f7f6', minHeight: '100%' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' },
        title: { fontSize: '28px', fontWeight: 'bold', color: '#1a2c3d' },
        filterBar: { display: 'flex', gap: '15px', alignItems: 'center', backgroundColor: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', marginBottom: '20px', flexWrap: 'wrap' },
        filterGroup: { display: 'flex', flexDirection: 'column', minWidth: '200px' },
        filterLabel: { fontSize: '12px', color: '#6c757d', marginBottom: '5px', fontWeight: 'bold' },
        filterInput: { padding: '8px 12px', borderRadius: '5px', border: '1px solid #ced4da', fontSize: '14px', outline: 'none' },
        button: { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: 'background-color 0.3s' },
        shipmentGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' },
        shipmentCard: { backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', borderLeft: '5px solid #007bff' },
        shipmentCardHover: { transform: 'translateY(-5px)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
        shipmentCardSelected: { borderLeft: '5px solid #28a745', backgroundColor: '#f0f9ff' },
        cardHeader: { fontSize: '18px', fontWeight: 'bold', color: '#1a2c3d', marginBottom: '10px' },
        cardDetail: { fontSize: '14px', color: '#6c757d', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' },
        label: { fontWeight: 'bold' },
        detailsSection: { backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' },
        detailsHeader: { fontSize: '24px', fontWeight: 'bold', color: '#1a2c3d', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #e9ecef' },
        infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' },
        infoCard: { padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' },
        infoLabel: { fontSize: '12px', color: '#6c757d', marginBottom: '5px', fontWeight: 'bold' },
        infoValue: { fontSize: '18px', color: '#1a2c3d', fontWeight: 'bold' },
        table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
        th: { backgroundColor: '#f8f9fa', padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold', color: '#495057', borderBottom: '2px solid #dee2e6' },
        td: { padding: '12px', fontSize: '14px', color: '#495057', borderBottom: '1px solid #dee2e6' },
        badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
        noData: { textAlign: 'center', padding: '60px', color: '#6c757d', fontSize: '18px' },
        loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', fontSize: '20px', color: '#6c757d' }
    };

    useEffect(() => {
        fetchShipments();
    }, []);

    const fetchShipments = async () => {
        setIsLoading(true);
        try {
            const shipmentsQuery = query(
                collection(db, 'vendorShipments'),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(shipmentsQuery);
            const shipmentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));
            setShipments(shipmentsData);
        } catch (error) {
            console.error('Error fetching vendor shipments:', error);
            alert('Error loading vendor shipments. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getUniqueVendors = () => {
        const vendors = [...new Set(shipments.map(s => s.vendorName).filter(Boolean))];
        return vendors.sort();
    };

    const getFilteredShipments = () => {
        return shipments.filter(shipment => {
            const matchesSearch = !searchTerm ||
                shipment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                shipment.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                shipment.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesVendor = filterVendor === 'All' || shipment.vendorName === filterVendor;

            return matchesSearch && matchesVendor;
        });
    };

    const calculateTotals = (fiberPacksDetails) => {
        if (!fiberPacksDetails || !Array.isArray(fiberPacksDetails)) return { totalPacks: 0, totalWeight: 0 };

        return {
            totalPacks: fiberPacksDetails.length,
            totalWeight: fiberPacksDetails.reduce((sum, pack) => sum + (parseFloat(pack.weight) || 0), 0)
        };
    };

    const exportToExcel = () => {
        if (!selectedShipment) {
            alert('Please select a shipment first');
            return;
        }

        const exportData = selectedShipment.fiberPacksDetails?.map((pack, index) => ({
            'S.No': index + 1,
            'Pack ID': pack.packId || pack.id || 'N/A',
            'Weight (kg)': pack.weight || 0,
            'Material': pack.material || 'N/A',
            'Source': pack.source || 'N/A',
            'Status': pack.status || 'N/A'
        })) || [];

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Fiber Packs');
        XLSX.writeFile(workbook, `Shipment_${selectedShipment.id}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const filteredShipments = getFilteredShipments();

    if (isLoading) {
        return (
            <div style={styles.container}>
                <div style={styles.loadingContainer}>
                    <h2>Loading Vendor Shipments...</h2>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>🚚 Vendor Shipments</h2>
            </div>

            <div style={styles.filterBar}>
                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Search</label>
                    <input
                        type="text"
                        placeholder="Search by ID, vendor, or vehicle..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.filterInput}
                    />
                </div>
                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Vendor</label>
                    <select
                        value={filterVendor}
                        onChange={(e) => setFilterVendor(e.target.value)}
                        style={styles.filterInput}
                    >
                        <option value="All">All Vendors</option>
                        {getUniqueVendors().map(vendor => (
                            <option key={vendor} value={vendor}>{vendor}</option>
                        ))}
                    </select>
                </div>
            </div>

            {filteredShipments.length === 0 ? (
                <div style={styles.noData}>
                    <p style={{ fontSize: '48px', marginBottom: '20px' }}>📦</p>
                    <p>No vendor shipments found</p>
                </div>
            ) : (
                <>
                    <div style={styles.shipmentGrid}>
                        {filteredShipments.map(shipment => {
                            const totals = calculateTotals(shipment.fiberPacksDetails);
                            return (
                                <div
                                    key={shipment.id}
                                    style={{
                                        ...styles.shipmentCard,
                                        ...(selectedShipment?.id === shipment.id ? styles.shipmentCardSelected : {})
                                    }}
                                    onClick={() => setSelectedShipment(shipment)}
                                    onMouseEnter={(e) => {
                                        if (selectedShipment?.id !== shipment.id) {
                                            e.currentTarget.style.transform = 'translateY(-5px)';
                                            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedShipment?.id !== shipment.id) {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.05)';
                                        }
                                    }}
                                >
                                    <div style={styles.cardHeader}>Shipment #{shipment.id}</div>
                                    <div style={styles.cardDetail}>
                                        <span style={styles.label}>Vendor:</span>
                                        <span>{shipment.vendorName || 'N/A'}</span>
                                    </div>
                                    <div style={styles.cardDetail}>
                                        <span style={styles.label}>Vehicle:</span>
                                        <span>{shipment.vehicleNumber || 'N/A'}</span>
                                    </div>
                                    <div style={styles.cardDetail}>
                                        <span style={styles.label}>Packs:</span>
                                        <span>{totals.totalPacks}</span>
                                    </div>
                                    <div style={styles.cardDetail}>
                                        <span style={styles.label}>Total Weight:</span>
                                        <span>{totals.totalWeight.toFixed(2)} kg</span>
                                    </div>
                                    <div style={styles.cardDetail}>
                                        <span style={styles.label}>Date:</span>
                                        <span>{shipment.createdAt ? shipment.createdAt.toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {selectedShipment && (
                        <div style={styles.detailsSection}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={styles.detailsHeader}>Shipment Details - {selectedShipment.id}</h3>
                                <button
                                    onClick={exportToExcel}
                                    style={styles.button}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
                                >
                                    📥 Export to Excel
                                </button>
                            </div>

                            <div style={styles.infoGrid}>
                                <div style={styles.infoCard}>
                                    <div style={styles.infoLabel}>Vendor Name</div>
                                    <div style={styles.infoValue}>{selectedShipment.vendorName || 'N/A'}</div>
                                </div>
                                <div style={styles.infoCard}>
                                    <div style={styles.infoLabel}>Vehicle Number</div>
                                    <div style={styles.infoValue}>{selectedShipment.vehicleNumber || 'N/A'}</div>
                                </div>
                                <div style={styles.infoCard}>
                                    <div style={styles.infoLabel}>Driver Name</div>
                                    <div style={styles.infoValue}>{selectedShipment.driverName || 'N/A'}</div>
                                </div>
                                <div style={styles.infoCard}>
                                    <div style={styles.infoLabel}>Driver Contact</div>
                                    <div style={styles.infoValue}>{selectedShipment.driverContact || 'N/A'}</div>
                                </div>
                                <div style={styles.infoCard}>
                                    <div style={styles.infoLabel}>Shipment Date</div>
                                    <div style={styles.infoValue}>
                                        {selectedShipment.createdAt ? selectedShipment.createdAt.toLocaleString() : 'N/A'}
                                    </div>
                                </div>
                                <div style={styles.infoCard}>
                                    <div style={styles.infoLabel}>Total Packs</div>
                                    <div style={styles.infoValue}>
                                        {calculateTotals(selectedShipment.fiberPacksDetails).totalPacks}
                                    </div>
                                </div>
                            </div>

                            <h4 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', color: '#1a2c3d' }}>
                                Fiber Packs Details
                            </h4>

                            {selectedShipment.fiberPacksDetails && selectedShipment.fiberPacksDetails.length > 0 ? (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={styles.table}>
                                        <thead>
                                            <tr>
                                                <th style={styles.th}>S.No</th>
                                                <th style={styles.th}>Pack ID</th>
                                                <th style={styles.th}>Weight (kg)</th>
                                                <th style={styles.th}>Material</th>
                                                <th style={styles.th}>Source</th>
                                                <th style={styles.th}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedShipment.fiberPacksDetails.map((pack, index) => (
                                                <tr key={index}>
                                                    <td style={styles.td}>{index + 1}</td>
                                                    <td style={styles.td}>{pack.packId || pack.id || 'N/A'}</td>
                                                    <td style={styles.td}>{pack.weight || 0}</td>
                                                    <td style={styles.td}>{pack.material || 'N/A'}</td>
                                                    <td style={styles.td}>{pack.source || 'N/A'}</td>
                                                    <td style={styles.td}>
                                                        <span style={{
                                                            ...styles.badge,
                                                            backgroundColor: pack.status === 'shipped' ? '#d4edda' : '#fff3cd',
                                                            color: pack.status === 'shipped' ? '#155724' : '#856404'
                                                        }}>
                                                            {pack.status || 'Pending'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}>
                                                <td style={styles.td} colSpan="2">Total</td>
                                                <td style={styles.td}>
                                                    {calculateTotals(selectedShipment.fiberPacksDetails).totalWeight.toFixed(2)} kg
                                                </td>
                                                <td style={styles.td} colSpan="3"></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ) : (
                                <div style={styles.noData}>
                                    <p>No fiber packs details available for this shipment</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default VendorShipments;

