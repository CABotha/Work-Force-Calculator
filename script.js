<script>
        // Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyCAma2IgEvyfVSqlSqqkXCsTJM7jchdoCk",
            authDomain: "workforce-calculator.firebaseapp.com",
            projectId: "workforce-calculator",
            storageBucket: "workforce-calculator.appspot.com",
            messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
            appId: "YOUR_APP_ID"
        };

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);

        // Configuration
        const WORKFORCE_LEVELS = [
            'Top Management',
            'Senior Management',
            'Professionally Qualified and experienced specialists and Mid-management',
            'Skill technical and academically qualified workers, junior management, supervisors,',
            'Semi - Skilled',
            'Unskilled'
        ];

        const FACTOR_CONFIGS = {
            economic: {
                name: 'Economic Factor',
                options: [
                    { value: -0.2, label: '-20% Decline' },
                    { value: -0.1, label: '-10% Moderate Decline' },
                    { value: 0.0, label: '0% Stable' },
                    { value: 0.1, label: '+10% Growth' },
                    { value: 0.2, label: '+20% Growth' },
                    { value: 0.3, label: '+30% Strong Growth' }
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

        // Default values
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

        // Auth state observer
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                // User is signed in
                document.getElementById('authContainer').style.display = 'none';
                document.getElementById('appContainer').style.display = 'block';
                document.getElementById('userEmail').textContent = user.email;
                initializeApp(); // Initialize the calculator
            } else {
                // User is signed out
                document.getElementById('authContainer').style.display = 'flex';
                document.getElementById('appContainer').style.display = 'none';
            }
        });

        // Authentication functions
        function login() {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            firebase.auth().signInWithEmailAndPassword(email, password)
                .catch((error) => {
                    document.getElementById('authError').textContent = error.message;
                });
        }

        function signup() {
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;

            firebase.auth().createUserWithEmailAndPassword(email, password)
                .catch((error) => {
                    document.getElementById('authError').textContent = error.message;
                });
        }

        function logout() {
            firebase.auth().signOut();
        }

        function resetPassword() {
            const email = prompt('Enter your email address to reset your password:');
            if (email) {
                firebase.auth().sendPasswordResetEmail(email)
                    .then(() => {
                        alert('Password reset email sent. Check your inbox.');
                    })
                    .catch((error) => {
                        alert(error.message);
                    });
            }
        }

        function toggleForm(form) {
            document.getElementById('loginForm').style.display = form === 'login' ? 'block' : 'none';
            document.getElementById('signupForm').style.display = form === 'signup' ? 'block' : 'none';
            document.getElementById('authError').textContent = '';
        }

        // Initialize the calculator application
        function initializeApp() {
            initializeState();
            createFactorsTable();
            createResultsTable();
            setupEventListeners();
            updateExportButtons();
        }

        // Initialize state with default values
        function initializeState() {
            WORKFORCE_LEVELS.forEach(level => {
                state.headcounts[level] = 97;
                state.factors[level] = level === 'Semi - Skilled' 
                    ? { ...DEFAULT_VALUES.semiSkilled }
                    : { ...DEFAULT_VALUES.normal };
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
            exportButtons.forEach(button => {
                button.disabled = !state.hasCalculated;
            });
        }

        // Validate inputs
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

        // Export to Excel
        function exportToExcel() {
            if (!state.hasCalculated) {
                alert('Please calculate the forecast before exporting.');
                return;
            }

            try {
                const wb = XLSX.utils.book_new();
                
                // Create main worksheet
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

                // Create results worksheet
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

                // Add worksheets to workbook
                const wsFactors = XLSX.utils.aoa_to_sheet(factorsData);
                const wsResults = XLSX.utils.aoa_to_sheet(resultsData);

                XLSX.utils.book_append_sheet(wb, wsFactors, 'Growth Factors');
                XLSX.utils.book_append_sheet(wb, wsResults, 'Workforce Forecast');

                // Save file
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

                // Add title
                doc.setFontSize(16);
                doc.text('FUTURE WORKFORCE FORECASTING', 14, 20);
                doc.setFontSize(10);
                doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

                // Add factors table
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

                // Add results table
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

                // Save file
                doc.save('Workforce_Forecast.pdf');
            } catch (error) {
                console.error('Export to PDF failed:', error);
                alert('Failed to export to PDF. Please try again.');
            }
        }
    </script>
</body>
</html>