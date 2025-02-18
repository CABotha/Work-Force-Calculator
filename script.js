document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const CONFIG = {
        WORKFORCE_LEVELS: [
            { id: 'top-management', name: 'Top Management' },
            { id: 'senior-management', name: 'Senior Management' },
            { id: 'middle-management', name: 'Middle Management' },
            { id: 'junior-management', name: 'Junior Management' },
            { id: 'semi-skilled', name: 'Semi-skilled Labor' },
            { id: 'unskilled', name: 'Unskilled Labor' }
        ],
        PROJECTION_YEARS: [2026, 2027, 2028, 2029, 2030],
        MAX_ANNUAL_CHANGE_RATE: 0.15,
        DAMPENING_FACTOR: 0.6,
        MAX_GROWTH_MULTIPLIER: 1.5,
        MAX_REDUCTION_MULTIPLIER: 0.5
    };

    const WorkforceProjectionTool = {
        // Get level-specific input values
        getLevelInputs: (levelId) => {
            try {
                const inputs = {
                    headcount: parseInt(document.querySelector(`input[data-level="${levelId}"]`)?.value) || 0,
                    economicFactor: parseFloat(document.querySelector(`.level-economic-factor[data-level="${levelId}"]`)?.value) || 0,
                    automationFactor: parseFloat(document.querySelector(`.level-automation-factor[data-level="${levelId}"]`)?.value) || 0,
                    transformationFactor: parseFloat(document.querySelector(`.level-transformation-factor[data-level="${levelId}"]`)?.value) || 0,
                    retentionFactor: parseFloat(document.querySelector(`.level-retention-factor[data-level="${levelId}"]`)?.value) || 1.0,
                    skillsFactor: parseFloat(document.querySelector(`.level-skills-factor[data-level="${levelId}"]`)?.value) || 1.0
                };
                return inputs;
            } catch (error) {
                console.error(`Error getting inputs for level ${levelId}:`, error);
                return {
                    headcount: 0,
                    economicFactor: 0,
                    automationFactor: 0,
                    transformationFactor: 0,
                    retentionFactor: 1.0,
                    skillsFactor: 1.0
                };
            }
        },

        // Calculate impact factor for a specific level
        calculateLevelImpact: (levelId) => {
            try {
                const inputs = WorkforceProjectionTool.getLevelInputs(levelId);
                
                // Calculate combined impact
                let impactFactor = (inputs.economicFactor + 
                                  inputs.automationFactor + 
                                  inputs.transformationFactor) * 
                                  inputs.retentionFactor * 
                                  inputs.skillsFactor;

                // Apply safeguards
                impactFactor = Math.max(
                    -CONFIG.MAX_ANNUAL_CHANGE_RATE,
                    Math.min(CONFIG.MAX_ANNUAL_CHANGE_RATE, impactFactor)
                ) * CONFIG.DAMPENING_FACTOR;

                return impactFactor;
            } catch (error) {
                console.error(`Error calculating impact for level ${levelId}:`, error);
                return 0;
            }
        },

        // Generate projections for all levels
        generateProjections: () => {
            try {
                return CONFIG.WORKFORCE_LEVELS.map(level => {
                    const inputs = WorkforceProjectionTool.getLevelInputs(level.id);
                    const impactFactor = WorkforceProjectionTool.calculateLevelImpact(level.id);
                    
                    // Calculate year-by-year projections
                    const projections = CONFIG.PROJECTION_YEARS.map((year, index) => {
                        const baseProjection = Math.round(
                            inputs.headcount * Math.pow(1 + impactFactor, index + 1)
                        );

                        // Apply bounds
                        return Math.max(
                            Math.round(inputs.headcount * CONFIG.MAX_REDUCTION_MULTIPLIER),
                            Math.min(
                                Math.round(inputs.headcount * CONFIG.MAX_GROWTH_MULTIPLIER),
                                baseProjection
                            )
                        );
                    });

                    return {
                        level: level.name,
                        levelId: level.id,
                        currentHeadcount: inputs.headcount,
                        projectedHeadcount: projections,
                        factors: inputs
                    };
                });
            } catch (error) {
                console.error('Error generating projections:', error);
                return [];
            }
        },

        // Render projections in the table
        renderProjections: (projections) => {
            try {
                const tbody = document.getElementById('projections-body');
                if (!tbody) return;

                tbody.innerHTML = '';
                projections.forEach(projection => {
                    const row = document.createElement('tr');
                    
                    row.innerHTML = `
                        <td>${projection.level}</td>
                        <td>${projection.currentHeadcount.toLocaleString()}</td>
                        ${projection.projectedHeadcount.map(count => 
                            `<td>${count.toLocaleString()}</td>`
                        ).join('')}
                    `;
                    
                    tbody.appendChild(row);
                });
            } catch (error) {
                console.error('Error rendering projections:', error);
            }
        },

        // Export to Excel
        exportToExcel: (projections) => {
            try {
                const workbook = XLSX.utils.book_new();
                
                // Executive Summary
                const summaryData = [
                    ['Workforce Forecasting Report'],
                    ['Generated on: ' + new Date().toLocaleDateString()],
                    [],
                    ['Executive Summary'],
                    ['This report provides detailed workforce projections for 2026-2030, analyzing:'],
                    ['• Economic conditions and market impacts'],
                    ['• Automation and technological changes'],
                    ['• Work transformation initiatives'],
                    ['• Retention and turnover patterns'],
                    ['• Skills availability and requirements'],
                    []
                ];
                
                // Factors Analysis
                const factorsData = [
                    ['Level-Specific Factors Analysis'],
                    ['Workforce Level', 'Economic', 'Automation', 'Transformation', 'Retention', 'Skills'],
                    ...projections.map(p => [
                        p.level,
                        p.factors.economicFactor.toFixed(2),
                        p.factors.automationFactor.toFixed(2),
                        p.factors.transformationFactor.toFixed(2),
                        p.factors.retentionFactor.toFixed(2),
                        p.factors.skillsFactor.toFixed(2)
                    ])
                ];
                
                // Projections Data
                const projectionsData = [
                    ['Workforce Projections (2026-2030)'],
                    ['Workforce Level', 'Current', ...CONFIG.PROJECTION_YEARS],
                    ...projections.map(p => [
                        p.level,
                        p.currentHeadcount,
                        ...p.projectedHeadcount
                    ])
                ];

                // Create and add worksheets
                XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryData), 'Executive Summary');
                XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(factorsData), 'Factors Analysis');
                XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(projectionsData), 'Projections');
                
                // Export
                XLSX.writeFile(workbook, 'Workforce_Forecast_Report.xlsx');
            } catch (error) {
                console.error('Error exporting to Excel:', error);
                alert('Error exporting to Excel. Please try again.');
            }
        },

        // Export to PDF
        exportToPDF: (projections) => {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('landscape');

                // Title Page
                doc.setFontSize(24);
                doc.text('Workforce Forecasting Report', 20, 30);
                
                doc.setFontSize(12);
                doc.text('Generated: ' + new Date().toLocaleDateString(), 20, 45);
                
                doc.setFontSize(14);
                doc.text('Executive Summary', 20, 60);
                
                doc.setFontSize(11);
                const summary = 'This report provides detailed workforce projections for 2026-2030, ' +
                              'analyzing economic conditions, automation impacts, work transformation, ' +
                              'retention patterns, and skills availability across all workforce levels.';
                const summaryLines = doc.splitTextToSize(summary, doc.internal.pageSize.width - 40);
                doc.text(summaryLines, 20, 75);

                // Factors Analysis Page
                doc.addPage();
                doc.setFontSize(16);
                doc.text('Level-Specific Factors Analysis', 20, 20);

                doc.autoTable({
                    startY: 30,
                    head: [['Workforce Level', 'Economic', 'Automation', 'Transformation', 'Retention', 'Skills']],
                    body: projections.map(p => [
                        p.level,
                        p.factors.economicFactor.toFixed(2),
                        p.factors.automationFactor.toFixed(2),
                        p.factors.transformationFactor.toFixed(2),
                        p.factors.retentionFactor.toFixed(2),
                        p.factors.skillsFactor.toFixed(2)
                    ]),
                    theme: 'grid',
                    styles: { fontSize: 10 },
                    headStyles: { fillColor: [51, 51, 51] }
                });

                // Projections Page
                doc.addPage();
                doc.setFontSize(16);
                doc.text('Workforce Projections (2026-2030)', 20, 20);

                doc.autoTable({
                    startY: 30,
                    head: [['Workforce Level', 'Current', ...CONFIG.PROJECTION_YEARS]],
                    body: projections.map(p => [
                        p.level,
                        p.currentHeadcount.toLocaleString(),
                        ...p.projectedHeadcount.map(count => count.toLocaleString())
                    ]),
                    theme: 'grid',
                    styles: { fontSize: 10 },
                    headStyles: { fillColor: [51, 51, 51] }
                });

                doc.save('Workforce_Forecast_Report.pdf');
            } catch (error) {
                console.error('Error exporting to PDF:', error);
                alert('Error exporting to PDF. Please try again.');
            }
        }
    };

    // Event Listeners
    document.getElementById('calculate-projections')?.addEventListener('click', () => {
        const projections = WorkforceProjectionTool.generateProjections();
        WorkforceProjectionTool.renderProjections(projections);
    });

    document.getElementById('export-excel')?.addEventListener('click', () => {
        const projections = WorkforceProjectionTool.generateProjections();
        WorkforceProjectionTool.exportToExcel(projections);
    });

    document.getElementById('export-pdf')?.addEventListener('click', () => {
        const projections = WorkforceProjectionTool.generateProjections();
        WorkforceProjectionTool.exportToPDF(projections);
    });

    // Initialize projections on load
    const calculateProjectionsBtn = document.getElementById('calculate-projections');
    if (calculateProjectionsBtn) {
        calculateProjectionsBtn.click();
    }
});