import { ScrollText } from 'lucide-react'

export default function LogAnalyzer() {
    return (
        <>
            <div className="main-header">
                <div className="header-title-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="icon-box" style={{ background: 'var(--neutral-700)', width: '40px', height: '40px' }}>
                            <ScrollText size={24} color="var(--primary-400)" />
                        </div>
                        <div>
                            <h1 className="header-title">Log Analyzer</h1>
                            <p className="header-subtitle">System and Application Logs</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="main-content">
                <div className="section-card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--neutral-500)' }}>
                    <h3>Log Analysis Module Coming Soon</h3>
                    <p>This page will allow searching and filtering of aggregated logs.</p>
                </div>
            </div>
        </>
    )
}