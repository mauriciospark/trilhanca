// Scrum Dashboard com Big Data Analytics - Trilhança Project
class ScrumDashboard {
    constructor() {
        this.currentSprint = {
            number: 24,
            startDate: '2026-03-01',
            endDate: '2026-03-14',
            totalPoints: 42,
            completedPoints: 27,
            tasks: [
                { id: '#TR-245', title: 'Implementar autenticação OAuth', points: 8, priority: 'high', status: 'todo', assignee: 'João' },
                { id: '#TR-246', title: 'Otimizar queries do dashboard', points: 5, priority: 'medium', status: 'todo', assignee: 'Ana' },
                { id: '#TR-242', title: 'Integrar API de Big Data', points: 13, priority: 'high', status: 'inprogress', assignee: 'Pedro' },
                { id: '#TR-243', title: 'Atualizar documentação', points: 3, priority: 'low', status: 'inprogress', assignee: 'Maria' },
                { id: '#TR-240', title: 'Implementar gráficos do dashboard', points: 5, priority: 'medium', status: 'done', assignee: 'Pedro' },
                { id: '#TR-239', title: 'Corrigir bugs do formulário', points: 2, priority: 'low', status: 'done', assignee: 'Ana' }
            ]
        };
        
        this.projectInfo = {
            name: 'Trilhança',
            methodology: 'Scrum',
            technology: 'Big Data com Python',
            features: ['Métodos Ágeis', 'Python Analytics', 'Machine Learning', 'Desenvolvimento Iterativo'],
            status: 'Em Desenvolvimento',
            targetUsers: 'Equipes Ágeis e Analistas de Dados',
            uniqueValue: 'Integração de Scrum com Big Data Analytics'
        };
        
        this.teamMembers = [
            { name: 'João Silva', role: 'Scrum Master', avatar: 'member1', tasksCompleted: 8, efficiency: 95 },
            { name: 'Maria Santos', role: 'Product Owner', avatar: 'member2', tasksCompleted: 6, efficiency: 88 },
            { name: 'Pedro Costa', role: 'Dev Frontend', avatar: 'member3', tasksCompleted: 10, efficiency: 92 },
            { name: 'Ana Oliveira', role: 'Dev Backend', avatar: 'member4', tasksCompleted: 7, efficiency: 90 }
        ];
        
        this.velocityData = [38, 45, 43, 40, 42, 39, 44, 41, 43, 42];
        this.burndownData = {
            ideal: [],
            actual: []
        };
        
        this.analyticsData = {
            predictive: {
                successProbability: 92,
                estimatedDate: '2026-03-13',
                delayRisk: 'low',
                confidence: 87,
                modelType: 'RandomForest com Python'
            },
            sentiment: {
                positive: 68,
                neutral: 25,
                negative: 7,
                analysis: 'NLP com Python NLTK'
            },
            patterns: [
                { title: 'Pico de Produtividade', description: 'Maior produtividade entre 10h-12h', confidence: 92, icon: 'clock', algorithm: 'Time Series Analysis' },
                { title: 'Risco de Burnout', description: 'Sextas-feiras mostram queda de 30%', confidence: 78, icon: 'exclamation-triangle', algorithm: 'Anomaly Detection' },
                { title: 'Colaboração Ideal', description: 'Pares de 2 pessoas têm 40% mais eficiência', confidence: 85, icon: 'users', algorithm: 'Network Analysis' }
            ]
        };
        
        this.pythonAnalytics = {
            dataProcessing: {
                status: 'active',
                throughput: 15000,
                latency: 23,
                records: 1200000,
                framework: 'Pandas + NumPy'
            },
            mlModels: {
                status: 'active',
                accuracy: 94.2,
                precision: 91.8,
                models: 3,
                libraries: 'Scikit-learn + TensorFlow'
            },
            realtime: {
                status: 'active',
                eventsPerSecond: 2500,
                memory: 2.1,
                streaming: true,
                technology: 'Python Streaming'
            }
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.calculateBurndownData();
        this.updateDashboard();
        this.startRealTimeUpdates();
        this.initializeCharts();
        this.setupKeyboardShortcuts();
        
        console.log('🚀 Scrum Dashboard initialized');
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Header actions
        document.getElementById('settings-btn')?.addEventListener('click', () => this.openSettings());
        document.getElementById('analytics-btn')?.addEventListener('click', () => this.openAnalytics());

        // Task interactions
        document.querySelectorAll('.task-item').forEach(task => {
            task.addEventListener('click', (e) => {
                const taskId = e.target.closest('.task-item').querySelector('.task-id').textContent;
                this.showTaskDetails(taskId);
            });
        });

        // Team member interactions
        document.querySelectorAll('.team-member').forEach(member => {
            member.addEventListener('click', (e) => {
                const memberName = e.target.closest('.team-member').querySelector('h4').textContent;
                this.showMemberDetails(memberName);
            });
        });

        // Window resize for responsive charts
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 's':
                        e.preventDefault();
                        this.exportData();
                        break;
                    case 'r':
                        e.preventDefault();
                        this.refreshData();
                        break;
                    case 'a':
                        e.preventDefault();
                        this.openAnalytics();
                        break;
                }
            }
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Update analytics based on tab
        if (tabName === 'sentiment') {
            this.updateSentimentAnalysis();
        } else if (tabName === 'patterns') {
            this.updatePatternAnalysis();
        }
    }

    calculateBurndownData() {
        const sprintDays = 14;
        const idealPointsPerDay = this.currentSprint.totalPoints / sprintDays;
        
        for (let day = 0; day <= sprintDays; day++) {
            this.burndownData.ideal.push(this.currentSprint.totalPoints - (idealPointsPerDay * day));
        }

        // Simulate actual burndown
        const actualData = [42, 38, 35, 32, 28, 25, 22, 18, 15, 12, 10, 8, 6, 4, 2];
        this.burndownData.actual = actualData;
    }

    updateDashboard() {
        this.updateSprintInfo();
        this.updateTeamPerformance();
        this.updateAnalytics();
        this.updateProjectStats();
        this.updateProgressBars();
    }

    updateSprintInfo() {
        const progressPercentage = (this.currentSprint.completedPoints / this.currentSprint.totalPoints) * 100;
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        if (progressFill) progressFill.style.width = `${progressPercentage}%`;
        if (progressText) progressText.textContent = `${Math.round(progressPercentage)}% Completo`;

        // Update sprint metrics
        const metrics = document.querySelectorAll('.sprint-metrics .metric-value');
        if (metrics[0]) metrics[0].textContent = this.currentSprint.completedPoints;
        if (metrics[1]) metrics[1].textContent = this.currentSprint.totalPoints - this.currentSprint.completedPoints;
        
        // Calculate days remaining
        const today = new Date();
        const endDate = new Date(this.currentSprint.endDate);
        const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        if (metrics[2]) metrics[2].textContent = Math.max(0, daysRemaining);
    }

    updateTeamPerformance() {
        this.teamMembers.forEach((member, index) => {
            const memberElement = document.querySelectorAll('.team-member')[index];
            if (memberElement) {
                const stats = memberElement.querySelectorAll('.member-stats .stat');
                if (stats[0]) stats[0].textContent = `${member.tasksCompleted} tarefas`;
                if (stats[1]) stats[1].textContent = `${member.efficiency}% eficiência`;
                
                // Update mini chart
                this.updateMiniChart(memberElement.querySelector('.mini-chart'), member.efficiency);
            }
        });
    }

    updateMiniChart(chartElement, efficiency) {
        if (!chartElement) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = 60;
        canvas.height = 40;
        
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 60, 0);
        gradient.addColorStop(0, '#007bff');
        gradient.addColorStop(1, '#17a2b8');
        
        // Draw simple performance line
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const points = [10, 15, 12, 18, 25, 30, 28, 35, efficiency / 3];
        points.forEach((point, index) => {
            const x = (index / (points.length - 1)) * 60;
            const y = 40 - (point / 40) * 40;
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Replace background with canvas
        chartElement.style.background = 'none';
        chartElement.innerHTML = '';
        chartElement.appendChild(canvas);
    }

    updateAnalytics() {
        this.updateSentimentBars();
        this.updatePatternCards();
        this.updatePythonAnalytics();
    }

    updateSentimentBars() {
        const sentimentData = this.analyticsData.sentiment;
        const sentimentItems = document.querySelectorAll('.sentiment-item');
        
        const sentiments = [
            { class: 'positive', value: sentimentData.positive },
            { class: 'neutral', value: sentimentData.neutral },
            { class: 'negative', value: sentimentData.negative }
        ];
        
        sentiments.forEach((sentiment, index) => {
            const item = sentimentItems[index];
            if (item) {
                const bar = item.querySelector('.sentiment-bar');
                const value = item.querySelector('.sentiment-value');
                if (bar) bar.style.width = `${sentiment.value}%`;
                if (value) value.textContent = `${sentiment.value}%`;
            }
        });
    }

    updatePatternCards() {
        const patterns = this.analyticsData.patterns;
        const patternCards = document.querySelectorAll('.pattern-card');
        
        patterns.forEach((pattern, index) => {
            const card = patternCards[index];
            if (card) {
                const icon = card.querySelector('.pattern-icon i');
                const title = card.querySelector('.pattern-content h4');
                const description = card.querySelector('.pattern-content p');
                const confidence = card.querySelector('.confidence span');
                
                if (icon) icon.className = `fas fa-${pattern.icon}`;
                if (title) title.textContent = pattern.title;
                if (description) description.textContent = pattern.description;
                if (confidence) confidence.textContent = `Confiança: ${pattern.confidence}%`;
            }
        });
    }

    updatePythonAnalytics() {
        const analytics = this.pythonAnalytics;
        const cards = document.querySelectorAll('.analytics-card');
        
        Object.keys(analytics).forEach((key, index) => {
            const card = cards[index];
            const data = analytics[key];
            
            if (card) {
                const header = card.querySelector('.analytics-header h3');
                const status = card.querySelector('.status');
                
                if (header) {
                    const titles = {
                        dataProcessing: 'Processamento de Dados',
                        mlModels: 'Modelos ML',
                        realtime: 'Streaming'
                    };
                    header.textContent = titles[key];
                }
                
                if (status) {
                    status.textContent = data.status === 'active' ? 'Ativo' : 'Inativo';
                    status.className = `status ${data.status}`;
                }
                
                // Update metrics
                const metrics = card.querySelectorAll('.analytics-metrics .metric');
                if (key === 'dataProcessing') {
                    if (metrics[0]) metrics[0].querySelector('.metric-value').textContent = data.throughput.toLocaleString();
                    if (metrics[1]) metrics[1].querySelector('.metric-value').textContent = `${data.latency}ms`;
                    if (metrics[2]) metrics[2].querySelector('.metric-value').textContent = `${(data.records / 1000000).toFixed(1)}M`;
                } else if (key === 'mlModels') {
                    if (metrics[0]) metrics[0].querySelector('.metric-value').textContent = `${data.accuracy}%`;
                    if (metrics[1]) metrics[1].querySelector('.metric-value').textContent = `${data.precision}%`;
                    if (metrics[2]) metrics[2].querySelector('.metric-value').textContent = data.models;
                } else if (key === 'realtime') {
                    if (metrics[0]) metrics[0].querySelector('.metric-value').textContent = data.eventsPerSecond.toLocaleString();
                    if (metrics[1]) metrics[1].querySelector('.metric-value').textContent = `${data.memory}GB`;
                    if (metrics[2]) metrics[2].querySelector('.metric-value').textContent = data.streaming ? 'Sim' : 'Não';
                }
            }
        });
    }

    updateProjectStats() {
        const stats = [
            { icon: 'fas fa-sync-alt', value: 'Scrum', label: 'Métodos Ágeis' },
            { icon: 'fas fa-brain', value: 'Big Data', label: 'Python Analytics' },
            { icon: 'fab fa-python', value: 'Python', label: 'Machine Learning' },
            { icon: 'fas fa-users', value: 'Equipe', label: 'Desenvolvimento Ágil' }
        ];
        
        const statItems = document.querySelectorAll('.project-stats .stat-item');
        stats.forEach((stat, index) => {
            const item = statItems[index];
            if (item) {
                const icon = item.querySelector('.stat-icon i');
                const value = item.querySelector('.stat-value');
                const label = item.querySelector('.stat-label');
                
                if (icon) icon.className = stat.icon;
                if (value) value.textContent = stat.value;
                if (label) label.textContent = stat.label;
            }
        });
    }

    updateProgressBars() {
        // Animate progress bars on load
        setTimeout(() => {
            document.querySelectorAll('.progress-fill').forEach(bar => {
                const width = bar.style.width;
                bar.style.width = '0';
                setTimeout(() => {
                    bar.style.width = width;
                }, 100);
            });
        }, 500);
    }

    initializeCharts() {
        this.initializeBurndownChart();
        this.initializeVelocityChart();
        this.initializeTeamCharts();
    }

    initializeBurndownChart() {
        // Placeholder for burndown chart implementation
        // Could integrate with Chart.js or similar library
        console.log('📊 Burndown chart initialized');
    }

    initializeVelocityChart() {
        // Placeholder for velocity chart implementation
        console.log('📈 Velocity chart initialized');
    }

    initializeTeamCharts() {
        // Initialize individual team member charts
        this.teamMembers.forEach(member => {
            this.updateMiniChart(
                document.querySelector(`#${member.avatar}-chart`),
                member.efficiency
            );
        });
    }

    startRealTimeUpdates() {
        // Update dashboard data every 30 seconds
        setInterval(() => {
            this.updateRealTimeData();
        }, 30000);

        // Update Python analytics every 10 seconds
        setInterval(() => {
            this.updatePythonAnalyticsRealTime();
        }, 10000);
    }

    updateRealTimeData() {
        // Simulate real-time updates
        const randomChange = () => Math.random() > 0.5 ? 1 : -1;
        
        // Update some metrics with small random changes
        this.pythonAnalytics.dataProcessing.throughput += randomChange() * 100;
        this.pythonAnalytics.realtime.eventsPerSecond += randomChange() * 50;
        
        this.updatePythonAnalytics();
    }

    updatePythonAnalyticsRealTime() {
        // Simulate real-time Python analytics updates
        const processing = this.pythonAnalytics.dataProcessing;
        const realtime = this.pythonAnalytics.realtime;
        
        // Simulate fluctuating values
        processing.throughput = 15000 + Math.floor(Math.random() * 2000 - 1000);
        processing.latency = 20 + Math.floor(Math.random() * 10 - 5);
        
        realtime.eventsPerSecond = 2500 + Math.floor(Math.random() * 500 - 250);
        realtime.memory = 2.0 + (Math.random() * 0.4 - 0.2);
        
        this.updatePythonAnalytics();
    }

    showTaskDetails(taskId) {
        const task = this.currentSprint.tasks.find(t => t.id === taskId);
        if (!task) return;

        console.log(`📋 Task details: ${taskId}`, task);
        // Could open a modal or sidebar with task details
        this.showNotification(`Visualizando tarefa ${taskId}`, 'info');
    }

    showMemberDetails(memberName) {
        const member = this.teamMembers.find(m => m.name.includes(memberName));
        if (!member) return;

        console.log(`👤 Member details: ${memberName}`, member);
        // Could open a modal or sidebar with member details
        this.showNotification(`Visualizando perfil de ${memberName}`, 'info');
    }

    openSettings() {
        console.log('⚙️ Opening settings...');
        this.showNotification('Abrindo configurações', 'info');
        // Could open a settings modal
    }

    openAnalytics() {
        console.log('📊 Opening detailed analytics...');
        this.showNotification('Abrindo analytics detalhado', 'info');
        // Could navigate to a detailed analytics page
    }

    exportData() {
        const data = {
            sprint: this.currentSprint,
            team: this.teamMembers,
            analytics: this.analyticsData,
            pythonAnalytics: this.pythonAnalytics,
            timestamp: new Date().toISOString()
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `scrum_dashboard_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Dados exportados com sucesso!', 'success');
    }

    refreshData() {
        console.log('🔄 Refreshing dashboard data...');
        this.updateDashboard();
        this.showNotification('Dashboard atualizado!', 'success');
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            'info': 'info-circle',
            'success': 'check-circle',
            'warning': 'exclamation-triangle',
            'error': 'times-circle'
        };
        return icons[type] || 'info-circle';
    }

    getNotificationColor(type) {
        const colors = {
            'info': '#17a2b8',
            'success': '#28a745',
            'warning': '#ffc107',
            'error': '#dc3545'
        };
        return colors[type] || '#17a2b8';
    }

    handleResize() {
        // Reinitialize charts on window resize
        this.initializeCharts();
    }

    // Public methods for external access
    getSprintData() {
        return this.currentSprint;
    }

    getTeamData() {
        return this.teamMembers;
    }

    getAnalyticsData() {
        return this.analyticsData;
    }

    updateSprintTask(taskId, newStatus) {
        const task = this.currentSprint.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = newStatus;
            this.updateDashboard();
            this.showNotification(`Tarefa ${taskId} atualizada para ${newStatus}`, 'success');
        }
    }

    addTeamMember(member) {
        this.teamMembers.push(member);
        this.updateTeamPerformance();
        this.showNotification(`${member.name} adicionado à equipe!`, 'success');
    }
}

// Initialize the dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.scrumDashboard = new ScrumDashboard();
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .notification {
            animation: slideIn 0.3s ease;
        }
        
        .task-item:hover {
            cursor: pointer;
        }
        
        .team-member:hover {
            cursor: pointer;
        }
        
        .mini-chart canvas {
            border-radius: 4px;
        }
    `;
    document.head.appendChild(style);
    
    console.log('📊 Scrum Dashboard ready!');
});

// Global functions for external access
window.updateSprintTask = (taskId, status) => {
    if (window.scrumDashboard) {
        window.scrumDashboard.updateSprintTask(taskId, status);
    }
};

window.addTeamMember = (member) => {
    if (window.scrumDashboard) {
        window.scrumDashboard.addTeamMember(member);
    }
};