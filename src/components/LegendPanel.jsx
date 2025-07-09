export default function LegendPanel() {
    return (
        <div style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
            background: '#ffffff',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            fontSize: '14px',
            maxWidth: '280px',
            border: '1px solid #e5e7eb'
        }}>
            <div style={{
                fontWeight: '500',
                color: '#374151',
                marginBottom: '12px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
            }}>
                <span>✏️</span>
                <span>Editor Guide</span>
            </div>
            <div style={{ color: '#4b5563', lineHeight: '1.4', fontSize: '11px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    marginBottom: '6px',
                    padding: '2px 0'
                }}>
                    <span style={{ minWidth: '16px' }}>🎯</span>
                    <div>
                        <strong style={{ color: '#374151' }}>Right-click nodes:</strong> Edit text & handles
                    </div>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    marginBottom: '6px',
                    padding: '2px 0'
                }}>
                    <span style={{ minWidth: '16px' }}>🔗</span>
                    <div>
                        <strong style={{ color: '#374151' }}>Drag handles:</strong> Create connections
                    </div>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    marginBottom: '6px',
                    padding: '2px 0'
                }}>
                    <span style={{ minWidth: '16px' }}>🗑️</span>
                    <div>
                        <strong style={{ color: '#374151' }}>Delete:</strong> Select edge + Delete key
                    </div>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    marginBottom: '6px',
                    padding: '2px 0'
                }}>
                    <span style={{ minWidth: '16px' }}>🖱️</span>
                    <div>
                        <strong style={{ color: '#374151' }}>Multi-select:</strong> Shift + Click
                    </div>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    marginBottom: '6px',
                    padding: '2px 0'
                }}>
                    <span style={{ minWidth: '16px' }}>✋</span>
                    <div>
                        <strong style={{ color: '#374151' }}>Hand tool:</strong> Hold 'H' to pan with left-click
                    </div>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    padding: '2px 0',
                    borderTop: '1px solid rgba(229, 231, 235, 0.6)',
                    marginTop: '8px',
                    paddingTop: '8px'
                }}>
                    <span style={{ minWidth: '16px' }}>💾</span>
                    <div style={{ fontStyle: 'italic', color: '#6b7280' }}>
                        <strong style={{ color: '#d97706' }}>Save Layout:</strong> Sets current as default
                    </div>
                </div>
            </div>
        </div>
    )
}