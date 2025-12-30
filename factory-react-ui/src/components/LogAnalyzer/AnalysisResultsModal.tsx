import { X } from 'lucide-react';
import { useState } from 'react';
import BarrelExecutionChart from './BarrelExecutionChart';
import OperationGanttChart from './OperationGanttChart';
import type { AnalysisResult } from '../../types/logTypes';

interface Props {
    result: AnalysisResult;
    onClose: () => void;
}

export default function AnalysisResultsModal({ result, onClose }: Props) {
    const barrels = Array.isArray(result?.barrels) ? result.barrels : [];
    const [selectedBarrel, setSelectedBarrel] = useState<string | null>(null);

    const selectedBarrelData = barrels.find(b => b.barrelId === selectedBarrel);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h2>Log Analysis</h2>
                    <button onClick={onClose}><X /></button>
                </div>

                {barrels.length === 0 ? (
                    <div style={{ padding: '2rem' }}>
                        <h3>No barrel data found</h3>
                        <p>This log file does not contain analyzable barrel operations.</p>
                    </div>
                ) : (
                    <>
                        <BarrelExecutionChart
                            barrels={barrels}
                            selectedBarrel={selectedBarrel}
                            onBarrelClick={setSelectedBarrel}
                        />

                        {selectedBarrelData && (
                            <OperationGanttChart
                                operations={selectedBarrelData.operations}
                                barrelId={selectedBarrelData.barrelId}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
