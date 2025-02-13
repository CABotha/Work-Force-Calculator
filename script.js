// Configuration
const WORKFORCE_LEVELS = [
    'Top Management',
    'Senior Management',
    'Professionally Qualified and experienced specialists and Mid-management',
    'Skill technical and academically qualified workers, junior management, supervisors,',
    'Semi - Skilled',
    'Unskilled'
];

// Factor configurations with ranges and descriptive labels
const FACTOR_CONFIGS = {
    economic: {
        name: 'Economic Factor',
        options: [
            { value: -0.2, label: '-20% Severe Decline' },
            { value: -0.1, label: '-10% Moderate Decline' },
            { value: 0.0, label: '0% Stable' },
            { value: 0.1, label: '+10% Moderate Growth' },
            { value: 0.2, label: '+20% Strong Growth' },
            { value: 0.3, label: '+30% Exceptional Growth' }
        ]
    },
    automation: {
        name: 'AI/Automation Factor',
        options: [
            { value: -0.3, label: '-30% High Impact' },
            { value: -0.2, label: '-20% Significant Impact' },
            { value: -0.1, label: '-10% Moderate Impact' },
            { value: 0.0, label: '0% No Impact' },
            { value: 0.1, label: '+10% Positive Impact' }
        ]
    },
    transformation: {
        name: 'Work Transformation Factor',
        options: [
            { value: -0.2, label: '-20% Major Reduction' },
            { value: -0.1, label: '-10% Minor Reduction' },
            { value: 0.0, label: '0% No Change' },
            { value: 0.1, label: '+10% Minor Growth' },
            { value: 0.2, label: '+20% Major Growth' }
        ]
    },
    retention: {
        name: 'Retention Factor',
        options: [
            { value: 0.7, label: '70% High Turnover' },
            { value: 0.8, label: '80% Above Average Turnover' },
            { value: 0.9, label: '90% Normal Turnover' },
            { value: 1.0, label: '100% Stable' },
            { value: 1.1, label: '110% Good Retention' },
            { value: 1.2, label: '120% Strong Retention' }
        ]
    },
    skills: {
        name: 'Skills Factor',
        options: [
            { value: 0.8, label: '80% Significant Gap' },
            { value: 0.9, label: '90% Minor Gap' },
            { value: 1.0, label: '100% Balanced' },
            { value: 1.1, label: '110% Good Availability' },
            { value: 1.2, label: '120% Strong Availability' },
            { value: 1.3, label: '130% Excellent Availability' }
        ]
    }
};

// Default values for each level
const DEFAULT_VALUES = {
    normal: {
        economic: -0.1,
        automation: -0.1,
        transformation: 0.1,
        retention: 0.9,
        skills: 0.9
    },
    semiSkilled: {
        economic: 0.3,
        automation: -0.1,
        transformation: -0.2,
        retention: 1.0,
        skills: 1.0
    }
};

// Application State
let state = {
    headcounts: {},
    factors: {},
    results: {},
    hasCalculated: false
};

// Initialize application
function initializeApp() {
    initializeState();
    setupTabNavigation();
    createFactorsTable();
    createResultsTable();
    setupEventListeners();
    updateExportButtons();
}

// Initialize state with default values
function initializeState() {
    WORKFORCE_LEVELS.forEach(level => {
        // Set default headcount
        state.headcounts[level] = 97;

        // Set default factors based on level
        state.factors[level] = level === 'Semi - Skilled' 
            ? { ...DEFAULT_VALUES.semiSkilled }
            : { ...DEFAULT_VALUES.normal };
    });
}

// Setup tab navigation
function setupTabNavigation() {
    const tabs = document.querySelectorAll('.nav-item');
    const contentTabs = document.querySelectorAll('.content-tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            contentTabs.forEach(c => c.style.display = 'none');

            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding content
            const targetTab = document.getElementById(tab.dataset.tab + 'Tab');
            if (targetTab) {
                targetTab.style.display = 'block';
            }
        });
    });
}

// Create dropdown for factor selection
function createFactorDropdown(factorType, currentValue) {
    const select = document.createElement('select');
    select.className = 'factor-select';
    
    FACTOR_CONFIGS[factorType].options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        optionElement.selected = option.value === currentValue;
        select.appendChild(optionElement);
    });
    
    return select;
}

// Create factors table
function createFactorsTable() {
    const tbody = document.querySelector('.factors-table tbody');
    tbody.innerHTML = '';

    WORKFORCE_LEVELS.forEach(level => {
        const row = document.createElement('tr');
        
        // Level name
        const levelCell = document.createElement('td');
        levelCell.textContent = level;
        row.appendChild(levelCell);

        // Compound impact
        const compoundCell = document.createElement('td');
        compoundCell.className = 'compound-cell';
        compoundCell.textContent = calculateCompoundImpact(level);
        row.appendChild(compoundCell);

        // Factor dropdowns
        Object.keys(FACTOR_CONFIGS).forEach(factor => {
            const cell = document.createElement('td');
            const select = createFactorDropdown(factor, state.factors[level][factor]);
            select.dataset.level = level;
            select.dataset.factor = factor;
            cell.appendChild(select);
            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });
}

// Create results table
function createResultsTable() {
    const tbody = document.getElementById('forecastResults');
    tbody.innerHTML = '';

    WORKFORCE_LEVELS.forEach(level => {
        const row = document.createElement('tr');
        
        // Level name
        const levelCell = document.createElement('td');
        levelCell.textContent = level;
        row.appendChild(levelCell);

        // Current headcount input
        const headcountCell = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'number';
        input.value = state.headcounts[level];
        input.min = '0';
        input.dataset.level = level;
        input.className = 'headcount-input';
        headcountCell.appendChild(input);
        row.appendChild(headcountCell);

        // Forecast placeholders
        for (let i = 0; i < 5; i++) {
            const cell = document.createElement('td');
            cell.textContent = '-';
            row.appendChild(cell);
        }

        tbody.appendChild(row);
    });
}

// Calculate compound impact factor
function calculateCompoundImpact(level) {
    const factors = state.factors[level];
    const impact = factors.economic + factors.automation + factors.transformation;
    return impact.toFixed(3).replace('.', ',');
}

// Calculate workforce forecast
function calculateForecast() {
    if (!validateInputs()) {
        alert('Please ensure all headcount values are valid numbers.');
        return;
    }

    WORKFORCE_LEVELS.forEach(level => {
        const results = [state.headcounts[level]];
        let previousYear = state.headcounts[level];

        for (let year = 0; year < 5; year++) {
            const factors = state.factors[level];
            const compoundImpact = parseFloat(calculateCompoundImpact(level).replace(',', '.'));
            
            const forecast = Math.round(
                ((previousYear * (1 + compoundImpact)) * 
                factors.retention * 
                factors.skills) + 1
            );
            
            results.push(forecast);
            previousYear = forecast;
        }

        state.results[level] = results;
    });

    state.hasCalculated = true;
    updateResultsDisplay();
    updateExportButtons();
    hideWarningMessage();
}

// Validate inputs before calculation
function validateInputs() {
    const headcountInputs = document.querySelectorAll('.headcount-input');
    let isValid = true;

    headcountInputs.forEach(input => {
        const value = parseInt(input.value);
        if (isNaN(value) || value < 0) {
            input.classList.add('invalid');
            isValid = false;
        } else {
            input.classList.remove('invalid');
        }
    });

    return isValid;
}

// Update results display
function updateResultsDisplay() {
    const tbody = document.getElementById('forecastResults');
    const rows = tbody.getElementsByTagName('tr');

    WORKFORCE_LEVELS.forEach((level, index) => {
        const cells = rows[index].getElementsByTagName('td');
        const results = state.results[level];

        // Skip first two cells (level name and headcount input)
        for (let i = 2; i < cells.length; i++) {
            cells[i].textContent = results[i-1];
        }
    });
}

// Update export button states
function updateExportButtons() {
    const exportButtons = document.querySelectorAll('#exportExcel, #exportPdf');
    const warningMessage = document.getElementById('calculateWarning');
    
    exportButtons.forEach(button => {
        button.disabled = !state.hasCalculated;
    });

    warningMessage.style.display = state.hasCalculated ? 'none' : 'block';
}

// Hide warning message
function hideWarningMessage() {
    document.getElementById('calculateWarning').style.display = 'none';
}

// Export to Excel
function exportToExcel() {
    if (!state.hasCalculated) {
        alert('Please calculate the forecast before exporting.');
        return;
    }

    try {
        const wb = XLSX.utils.book_new();
        
        // Factors worksheet
        const factorsData = [
            ['FUTURE WORKFORCE FORECASTING'],
            [],
            ['Level', 'Compound Impact', 'Economic', 'AI/Automation', 'Transformation', 'Retention', 'Skills']
        ];

        WORKFORCE_LEVELS.forEach(level => {
            factorsData.push([
                level,
                calculateCompoundImpact(level),
                state.factors[level].economic,
                state.factors[level].automation,
                state.factors[level].transformation,
                state.factors[level].retention,
                state.factors[level].skills
            ]);
        });

        // Results worksheet
        const resultsData = [
            ['WORKFORCE FORECAST'],
            [],
            ['Level', 'Current', '2026', '2027', '2028', '2029', '2030']
        ];

        WORKFORCE_LEVELS.forEach(level => {
            resultsData.push([
                level,
                ...state.results[level]
            ]);
        });

        const wsFactors = XLSX.utils.aoa_to_sheet(factorsData);
        const wsResults = XLSX.utils.aoa_to_sheet(resultsData);

        XLSX.utils.book_append_sheet(wb, wsFactors, 'Growth Factors');
        XLSX.utils.book_append_sheet(wb, wsResults, 'Workforce Forecast');

        XLSX.writeFile(wb, 'Workforce_Forecast.xlsx');
    } catch (error) {
        console.error('Export to Excel failed:', error);
        alert('Failed to export to Excel. Please try again.');
    }
}

// Export to PDF
function exportToPDF() {
    if (!state.hasCalculated) {
        alert('Please calculate the forecast before exporting.');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');

        // Title
        doc.setFontSize(16);
        doc.text('FUTURE WORKFORCE FORECASTING', 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

        // Factors table
        doc.autoTable({
            startY: 40,
            head: [['Level', 'Compound Impact', 'Economic', 'AI/Automation', 'Transformation', 'Retention', 'Skills']],
            body: WORKFORCE_LEVELS.map(level => [
                level,
                calculateCompoundImpact(level),
                state.factors[level].economic,
                state.factors[level].automation,
                state.factors[level].transformation,
                state.factors[level].retention,
                state.factors[level].skills
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [68, 114, 196] }
        });

        // Results table
        doc.autoTable({
            startY: doc.previousAutoTable.finalY + 20,
            head: [['Level', 'Current', '2026', '2027', '2028', '2029', '2030']],
            body: WORKFORCE_LEVELS.map(level => [
                level,
                ...state.results[level]
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [68, 114, 196] }
        });

        doc.save('Workforce_Forecast.pdf');
    } catch (error) {
        console.error('Export to PDF failed:', error);
        alert('Failed to export to PDF. Please try again.');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Factor dropdown changes
    document.querySelectorAll('.factor-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const level = e.target.dataset.level;
            const factor = e.target.dataset.factor;
            state.factors[level][factor] = parseFloat(e.target.value);
            
            // Update compound impact
            const row = e.target.closest('tr');
            const compoundCell = row.querySelector('.compound-cell');
            compoundCell.textContent = calculateCompoundImpact(level);

            // Reset calculation state
            state.hasCalculated = false;
            updateExportButtons();
        });
    });

    // Headcount input changes
    document.querySelectorAll('.headcount-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const level = e.target.dataset.level;
            state.headcounts[level] = parseInt(e.target.value) || 0;
            
            // Reset calculation state
            state.hasCalculated = false;
            updateExportButtons();
        });
    });

    // Calculate button
    document.getElementById('calculateBtn').addEventListener('click', calculateForecast);

    // Export buttons
    document.getElementById('exportExcel').addEventListener('click', exportToExcel);
    document.getElementById('exportPdf').addEventListener('click', exportToPDF);

    // Tab navigation
    document.querySelectorAll('.nav-item').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get target tab
            const targetId = tab.getAttribute('data-tab');
            
            // Update active states
            document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.content-tab').forEach(c => c.style.display = 'none');
            
            // Activate selected tab
            tab.classList.add('active');
            const targetTab = document.getElementById(targetId + 'Tab');
            if (targetTab) {
                targetTab.style.display = 'block';
            }
        });
    });
}

// Helper function to format numbers
function formatNumber(num) {
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// Helper function for decimal comma formatting
function formatDecimal(num) {
    return num.toFixed(3).replace('.', ',');
}

// Validation helper
function isValidNumber(value) {
    return !isNaN(value) && value >= 0 && Number.isFinite(value);
}

// Initialize warning message
function setupWarningMessage() {
    const warningMsg = document.getElementById('calculateWarning');
    if (warningMsg) {
        warningMsg.style.display = 'block';
    }
}

// Error handling wrapper
function handleError(action, errorMsg) {
    try {
        action();
    } catch (error) {
        console.error(`Error: ${errorMsg}`, error);
        alert(`${errorMsg} Please try again.`);
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    handleError(
        initializeApp,
        'Failed to initialize the application.'
    );
});

// Add focus handling for inputs
document.addEventListener('DOMContentLoaded', () => {
    // Add focus effects to inputs
    document.querySelectorAll('input, select').forEach(element => {
        element.addEventListener('focus', () => {
            element.parentElement.classList.add('focused');
        });
        
        element.addEventListener('blur', () => {
            element.parentElement.classList.remove('focused');
        });
    });
});