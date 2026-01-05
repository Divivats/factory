import type { AnalysisResult, BarrelExecutionData, OperationData } from '../types/logTypes';

export function parseLogContent(content: string): AnalysisResult {
    const lines = content.trim().split('\n');

    const barrelMap = new Map<number, {
        operations: Map<string, Partial<OperationData>>;
        sequenceOrder: string[];
    }>();

    // Parse each line
    for (const line of lines) {
        const parts = line.split('\t');

        if (parts.length < 11) continue;

        const sequenceName = parts[8];
        const event = parts[9] as 'START' | 'END';
        const jsonData = parts[10];

        let data;
        try {
            data = JSON.parse(jsonData);
        } catch {
            continue;
        }

        const barrelId = data.barrelId;
        if (barrelId === undefined) continue;

        // Initialize barrel if needed
        if (!barrelMap.has(barrelId)) {
            barrelMap.set(barrelId, {
                operations: new Map(),
                sequenceOrder: []
            });
        }

        const barrel = barrelMap.get(barrelId)!;

        // Get or create operation
        if (!barrel.operations.has(sequenceName)) {
            barrel.operations.set(sequenceName, {
                operationName: sequenceName,
                sequence: barrel.sequenceOrder.length + 1
            });
            barrel.sequenceOrder.push(sequenceName);
        }

        const operation = barrel.operations.get(sequenceName)!;

        if (event === 'START') {
            operation.startTime = data.startTs ?? 0;
        } else if (event === 'END') {
            operation.endTime = data.endTs ?? 0;
            operation.idealDuration = data.idealMs ?? 1000;

            if (operation.startTime !== undefined && operation.endTime !== undefined) {
                operation.actualDuration = operation.endTime - operation.startTime;
            }
        }
    }

    // Convert to BarrelExecutionData array
    const barrels: BarrelExecutionData[] = [];

    for (const [barrelId, barrelData] of barrelMap.entries()) {
        const operations: OperationData[] = [];

        for (const op of barrelData.operations.values()) {
            if (op.startTime !== undefined &&
                op.endTime !== undefined &&
                op.actualDuration !== undefined &&
                op.idealDuration !== undefined &&
                op.operationName !== undefined &&
                op.sequence !== undefined) {
                operations.push(op as OperationData);
            }
        }

        // Sort by start time
        operations.sort((a, b) => a.startTime - b.startTime);

        // NORMALIZE: Find the minimum start time for this barrel
        // Since it is sorted, the first element is the minimum
        const minStartTime = operations.length > 0 ? operations[0].startTime : 0;

        // Adjust all times to start from 0
        operations.forEach(op => {
            op.startTime = op.startTime - minStartTime;
            op.endTime = op.endTime - minStartTime;
        });

        // Calculate total execution time (Wall Clock Time)
        // Since we already normalized start times to 0, the total time is simply the latest end time.
        const totalExecutionTime = operations.length > 0
            ? Math.max(...operations.map(op => op.endTime))
            : 0;

        barrels.push({
            barrelId: barrelId.toString(),
            totalExecutionTime,
            operations
        });
    }

    // Sort barrels by ID numerically
    barrels.sort((a, b) => parseInt(a.barrelId) - parseInt(b.barrelId));

    // Calculate summary statistics
    const executionTimes = barrels.map(b => b.totalExecutionTime);
    const summary = {
        totalBarrels: barrels.length,
        averageExecutionTime: executionTimes.length > 0
            ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
            : 0,
        minExecutionTime: executionTimes.length > 0
            ? Math.min(...executionTimes)
            : 0,
        maxExecutionTime: executionTimes.length > 0
            ? Math.max(...executionTimes)
            : 0
    };

    return { barrels, summary };
}