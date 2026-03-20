/**
 * Painel de Controle - Trilhança Project
 * Sistema de gerenciamento centralizado com dashboard em tempo real
 */

class PainelDeControle {
    constructor() {
        this.systemData = {
            platforms: 3,
            activeUsers: 1247,
            activeTrails: 42,
            onlineConvoys: 156,
            systemHealth: 98.5,
            networkLatency: 45,
            storageUsage: 67.3,
            errorRate: 0.2
        };

        this.platforms = [
            {
                id: 'mobile',
                name: 'Mobile App',
                icon: 'fa-mobile-alt',
                status: 'online',
                users: 892,
                uptime: 99.8,
                lastUpdate: new Date(),
                version: '2.1.0',
                features: ['GPS Tracking', 'PTT Radio', 'Offline Maps']
            },
            {
                id: 'web',
                name: 'Web Dashboard',
                icon: 'fa-globe',
                status: 'online',
                users: 245,
                uptime: 99.9,
                lastUpdate: new Date(),
                version: '2.1.0',
                features: ['Analytics', 'User Management', 'System Config']
            },
            {
                id: 'api',
                name: 'API Services',
                icon: 'fa-server',
                status: 'maintenance',
                users: 110,
                uptime: 95.2,
                lastUpdate: new Date(Date.now() - 300000),
                version: '2.0.5',
                features: ['REST API', 'WebSocket', 'Authentication']
            }
        ];

        this.users = [];
        this.notifications = [];
        this.alerts = [];
        this.charts = {};

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
        this.initializeCharts();
        this.startRealTimeUpdates();
        this.setupKeyboardShortcuts();
        this.initializeTooltips();
        this.loadNotifications();
        this.checkSystemHealth();
    }

    setupEventListeners() {
        // Header actions
        document.getElementById('refresh-btn')?.addEventListener('click', () => {
            this.refreshAllData();
        });

        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.openSettings();
        });

        document.getElementById('notifications-btn')?.addEventListener('click', () => {
            this.toggleNotifications();
        });

        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleFilter(e.target.dataset.filter);
            });
        });

        // User actions
        document.querySelectorAll('.user-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleUserAction(e.target.dataset.action, e.target.dataset.userId);
            });
        });

        // Platform cards
        document.querySelectorAll('.platform-card').forEach(card => {
            card.addEventListener('click', () => {
                this.showPlatformDetails(card.dataset.platformId);
            });
        });

        // Quick actions
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.executeQuickAction(e.target.dataset.action);
            });
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Online/offline status
        window.addEventListener('online', () => {
            this.updateConnectionStatus(true);
        });

        window.addEventListener('offline', () => {
            this.updateConnectionStatus(false);
        });
    }

    loadInitialData() {
        this.updateSystemStats();
        this.updatePlatformStatus();
        this.loadUsers();
        this.loadRecentActivity();
        this.updateSystemMetrics();
    }

    updateSystemStats() {
        const stats = document.querySelectorAll('.stat-value');
        if (stats[0]) stats[0].textContent = this.systemData.platforms;
        if (stats[1]) stats[1].textContent = this.systemData.activeUsers.toLocaleString();
        if (stats[2]) stats[2].textContent = this.systemData.activeTrails;
        if (stats[3]) stats[3].textContent = this.systemData.onlineConvoys;

        // Animate numbers
        this.animateNumbers();
    }

    animateNumbers() {
        document.querySelectorAll('.stat-value').forEach(stat => {
            const finalValue = parseInt(stat.textContent.replace(/,/g, ''));
            const duration = 2000;
            const steps = 60;
            const increment = finalValue / steps;
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= finalValue) {
                    current = finalValue;
                    clearInterval(timer);
                }
                stat.textContent = Math.floor(current).toLocaleString();
            }, duration / steps);
        });
    }

    updatePlatformStatus() {
        const platformGrid = document.querySelector('.platform-grid');
        if (!platformGrid) return;

        platformGrid.innerHTML = this.platforms.map(platform => `
            <div class="platform-card ${platform.status}" data-platform-id="${platform.id}">
                <div class="platform-header">
                    <div class="platform-icon">
                        <i class="fas ${platform.icon}"></i>
                    </div>
                    <div class="platform-info">
                        <h3 class="platform-name">${platform.name}</h3>
                        <span class="platform-status ${platform.status}">
                            <i class="fas fa-circle"></i>
                            ${this.getStatusText(platform.status)}
                        </span>
                    </div>
                    <div class="platform-actions">
                        <button class="btn-icon" onclick="painel.showPlatformMenu('${platform.id}')">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </div>
                <div class="platform-metrics">
                    <div class="metric">
                        <span class="metric-label">Usuários</span>
                        <span class="metric-value">${platform.users.toLocaleString()}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Uptime</span>
                        <span class="metric-value">${platform.uptime}%</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Versão</span>
                        <span class="metric-value">${platform.version}</span>
                    </div>
                </div>
                <div class="platform-features">
                    ${platform.features.map(feature => `
                        <span class="feature-tag">${feature}</span>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    getStatusText(status) {
        const statusMap = {
            online: 'Online',
            offline: 'Offline',
            maintenance: 'Manutenção',
            warning: 'Atenção'
        };
        return statusMap[status] || status;
    }

    loadUsers() {
        // Simulate loading users from API
        this.users = [
            {
                id: 1,
                name: 'João Silva',
                email: 'joao@exemplo.com',
                status: 'online',
                platform: 'mobile',
                lastSeen: new Date(),
                role: 'Líder',
                convoy: 'Comboio Norte'
            },
            {
                id: 2,
                name: 'Maria Santos',
                email: 'maria@exemplo.com',
                status: 'online',
                platform: 'web',
                lastSeen: new Date(Date.now() - 300000),
                role: 'Navegador',
                convoy: 'Comboio Sul'
            },
            {
                id: 3,
                name: 'Pedro Costa',
                email: 'pedro@exemplo.com',
                status: 'offline',
                platform: 'mobile',
                lastSeen: new Date(Date.now() - 3600000),
                role: 'Suporte',
                convoy: 'Comboio Leste'
            }
        ];

        this.updateUsersTable();
    }

    updateUsersTable() {
        const usersTable = document.getElementById('users-table');
        if (!usersTable) return;

        const tbody = usersTable.querySelector('tbody');
        tbody.innerHTML = this.users.map(user => `
            <tr class="user-row" data-user-id="${user.id}">
                <td class="user-info">
                    <div class="user-avatar">
                        <img src="/icon/Usuario.png" alt="${user.name}">
                    </div>
                    <div class="user-details">
                        <span class="user-name">${user.name}</span>
                        <span class="user-email">${user.email}</span>
                    </div>
                </td>
                <td class="user-status">
                    <span class="status-indicator ${user.status}">
                        <i class="fas fa-circle"></i>
                        ${this.getStatusText(user.status)}
                    </span>
                </td>
                <td class="user-platform">
                    <i class="fas ${this.getPlatformIcon(user.platform)}"></i>
                    ${this.getPlatformName(user.platform)}
                </td>
                <td class="user-role">${user.role}</td>
                <td class="user-convoy">${user.convoy}</td>
                <td class="user-actions">
                    <button class="btn-icon" onclick="painel.viewUserDetails(${user.id})" title="Ver Detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="painel.editUser(${user.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon danger" onclick="painel.removeUser(${user.id})" title="Remover">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getPlatformIcon(platform) {
        const icons = {
            mobile: 'fa-mobile-alt',
            web: 'fa-globe',
            api: 'fa-server'
        };
        return icons[platform] || 'fa-question';
    }

    getPlatformName(platform) {
        const names = {
            mobile: 'Mobile',
            web: 'Web',
            api: 'API'
        };
        return names[platform] || platform;
    }

    loadRecentActivity() {
        const activities = [
            {
                id: 1,
                type: 'user_login',
                user: 'João Silva',
                platform: 'mobile',
                timestamp: new Date(Date.now() - 300000),
                description: 'Usuário fez login no aplicativo mobile'
            },
            {
                id: 2,
                type: 'convoy_created',
                user: 'Maria Santos',
                platform: 'web',
                timestamp: new Date(Date.now() - 600000),
                description: 'Novo comboio criado: "Expedição Centro-Oeste"'
            },
            {
                id: 3,
                type: 'system_alert',
                user: 'Sistema',
                platform: 'api',
                timestamp: new Date(Date.now() - 900000),
                description: 'API Services em modo de manutenção'
            }
        ];

        this.updateActivityFeed(activities);
    }

    updateActivityFeed(activities) {
        const activityFeed = document.getElementById('activity-feed');
        if (!activityFeed) return;

        activityFeed.innerHTML = activities.map(activity => `
            <div class="activity-item ${activity.type}">
                <div class="activity-icon">
                    <i class="fas ${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-header">
                        <span class="activity-user">${activity.user}</span>
                        <span class="activity-time">${this.formatTime(activity.timestamp)}</span>
                    </div>
                    <p class="activity-description">${activity.description}</p>
                </div>
            </div>
        `).join('');
    }

    getActivityIcon(type) {
        const icons = {
            user_login: 'fa-sign-in-alt',
            convoy_created: 'fa-users',
            system_alert: 'fa-exclamation-triangle',
            user_logout: 'fa-sign-out-alt',
            message_sent: 'fa-comment',
            location_update: 'fa-map-marker-alt'
        };
        return icons[type] || 'fa-info-circle';
    }

    formatTime(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Agora';
        if (minutes < 60) return `${minutes} min atrás`;
        if (hours < 24) return `${hours} h atrás`;
        return `${days} d atrás`;
    }

    updateSystemMetrics() {
        const metrics = {
            health: this.systemData.systemHealth,
            latency: this.systemData.networkLatency,
            storage: this.systemData.storageUsage,
            errors: this.systemData.errorRate
        };

        Object.keys(metrics).forEach(key => {
            const element = document.getElementById(`metric-${key}`);
            if (element) {
                element.textContent = this.formatMetric(key, metrics[key]);
                this.updateMetricStatus(element, key, metrics[key]);
            }
        });
    }

    formatMetric(key, value) {
        const formatters = {
            health: `${value}%`,
            latency: `${value}ms`,
            storage: `${value}%`,
            errors: `${value}%`
        };
        return formatters[key] || value;
    }

    updateMetricStatus(element, key, value) {
        element.classList.remove('status-good', 'status-warning', 'status-danger');
        
        const thresholds = {
            health: { good: 95, warning: 90 },
            latency: { good: 100, warning: 200 },
            storage: { good: 80, warning: 90 },
            errors: { good: 1, warning: 5 }
        };

        const threshold = thresholds[key];
        if (value <= threshold.good) {
            element.classList.add('status-good');
        } else if (value <= threshold.warning) {
            element.classList.add('status-warning');
        } else {
            element.classList.add('status-danger');
        }
    }

    initializeCharts() {
        this.initializeUserActivityChart();
        this.initializeSystemPerformanceChart();
        this.initializePlatformUsageChart();
    }

    initializeUserActivityChart() {
        const ctx = document.getElementById('user-activity-chart');
        if (!ctx) return;

        const chartData = {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
            datasets: [{
                label: 'Usuários Ativos',
                data: [245, 189, 456, 892, 1102, 987, 412],
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                tension: 0.4,
                fill: true
            }]
        };

        // Simulate Chart.js implementation
        this.charts.userActivity = { ctx, data: chartData };
        this.renderChart(ctx, chartData);
    }

    initializeSystemPerformanceChart() {
        const ctx = document.getElementById('system-performance-chart');
        if (!ctx) return;

        const chartData = {
            labels: ['CPU', 'Memória', 'Disco', 'Rede', 'API'],
            datasets: [{
                label: 'Uso (%)',
                data: [67, 73, 45, 89, 56],
                backgroundColor: [
                    '#007bff',
                    '#28a745',
                    '#ffc107',
                    '#dc3545',
                    '#6c757d'
                ]
            }]
        };

        this.charts.systemPerformance = { ctx, data: chartData };
        this.renderChart(ctx, chartData);
    }

    initializePlatformUsageChart() {
        const ctx = document.getElementById('platform-usage-chart');
        if (!ctx) return;

        const chartData = {
            labels: ['Mobile', 'Web', 'API'],
            datasets: [{
                label: 'Usuários por Plataforma',
                data: [892, 245, 110],
                backgroundColor: [
                    '#007bff',
                    '#28a745',
                    '#ffc107'
                ]
            }]
        };

        this.charts.platformUsage = { ctx, data: chartData };
        this.renderChart(ctx, chartData);
    }

    renderChart(ctx, data) {
        // Simplified chart rendering (in production, use Chart.js or similar)
        const canvas = ctx;
        if (canvas.tagName === 'CANVAS') {
            const context = canvas.getContext('2d');
            // Basic chart visualization
            context.fillStyle = '#f8f9fa';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#007bff';
            context.font = '14px Arial';
            context.fillText('Chart visualization', 10, 30);
        }
    }

    startRealTimeUpdates() {
        // Update system stats every 30 seconds
        setInterval(() => {
            this.updateSystemStats();
            this.updateSystemMetrics();
        }, 30000);

        // Update user activity every 10 seconds
        setInterval(() => {
            this.updateUserActivity();
        }, 10000);

        // Update platform status every 15 seconds
        setInterval(() => {
            this.updatePlatformStatus();
        }, 15000);

        // Update activity feed every 20 seconds
        setInterval(() => {
            this.loadRecentActivity();
        }, 20000);
    }

    updateUserActivity() {
        // Simulate real-time user activity updates
        const variation = Math.floor(Math.random() * 20) - 10;
        this.systemData.activeUsers = Math.max(1000, this.systemData.activeUsers + variation);
        
        const activeUsersElement = document.querySelectorAll('.stat-value')[1];
        if (activeUsersElement) {
            activeUsersElement.textContent = this.systemData.activeUsers.toLocaleString();
            activeUsersElement.classList.add('updated');
            setTimeout(() => activeUsersElement.classList.remove('updated'), 1000);
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + R: Refresh data
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.refreshAllData();
            }

            // Ctrl/Cmd + S: Open settings
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.openSettings();
            }

            // Ctrl/Cmd + F: Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                const searchInput = document.getElementById('search-input');
                if (searchInput) searchInput.focus();
            }

            // Esc: Close modals
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    initializeTooltips() {
        document.querySelectorAll('[title]').forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target);
            });

            element.addEventListener('mouseleave', (e) => {
                this.hideTooltip(e.target);
            });
        });
    }

    showTooltip(element) {
        const title = element.getAttribute('title');
        if (!title) return;

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = title;
        document.body.appendChild(tooltip);

        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';

        element.removeAttribute('title');
        element.dataset.tooltip = title;
    }

    hideTooltip(element) {
        const tooltip = document.querySelector('.tooltip');
        if (tooltip) {
            tooltip.remove();
        }

        if (element.dataset.tooltip) {
            element.setAttribute('title', element.dataset.tooltip);
            delete element.dataset.tooltip;
        }
    }

    loadNotifications() {
        this.notifications = [
            {
                id: 1,
                type: 'warning',
                title: 'API Services',
                message: 'API Services em modo de manutenção',
                timestamp: new Date(Date.now() - 300000),
                read: false
            },
            {
                id: 2,
                type: 'info',
                title: 'Novo Usuário',
                message: 'Pedro Costa se registrou no sistema',
                timestamp: new Date(Date.now() - 600000),
                read: false
            },
            {
                id: 3,
                type: 'success',
                title: 'Backup Completo',
                message: 'Backup automático concluído com sucesso',
                timestamp: new Date(Date.now() - 900000),
                read: true
            }
        ];

        this.updateNotificationsBadge();
    }

    updateNotificationsBadge() {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            const unreadCount = this.notifications.filter(n => !n.read).length;
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    }

    toggleNotifications() {
        const panel = document.getElementById('notifications-panel');
        if (!panel) return;

        panel.classList.toggle('show');
        if (panel.classList.contains('show')) {
            this.renderNotifications();
        }
    }

    renderNotifications() {
        const panel = document.getElementById('notifications-panel');
        if (!panel) return;

        const content = panel.querySelector('.notifications-content');
        content.innerHTML = this.notifications.map(notification => `
            <div class="notification-item ${notification.type} ${notification.read ? 'read' : 'unread'}" data-notification-id="${notification.id}">
                <div class="notification-icon">
                    <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-header">
                        <span class="notification-title">${notification.title}</span>
                        <span class="notification-time">${this.formatTime(notification.timestamp)}</span>
                    </div>
                    <p class="notification-message">${notification.message}</p>
                </div>
                <div class="notification-actions">
                    <button class="btn-icon" onclick="painel.markNotificationRead(${notification.id})" title="Marcar como lida">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-icon" onclick="painel.deleteNotification(${notification.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    getNotificationIcon(type) {
        const icons = {
            info: 'fa-info-circle',
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle'
        };
        return icons[type] || 'fa-info-circle';
    }

    markNotificationRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            this.updateNotificationsBadge();
            this.renderNotifications();
        }
    }

    deleteNotification(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.updateNotificationsBadge();
        this.renderNotifications();
    }

    checkSystemHealth() {
        // Simulate system health check
        const health = this.systemData.systemHealth;
        
        if (health < 90) {
            this.createAlert('warning', 'Saúde do Sistema', `Saúde do sistema em ${health}% - Atenção necessária`);
        } else if (health < 95) {
            this.createAlert('info', 'Saúde do Sistema', `Saúde do sistema em ${health}% - Monitoramento contínuo`);
        }

        // Check individual metrics
        if (this.systemData.errorRate > 5) {
            this.createAlert('error', 'Taxa de Erros', `Taxa de erros elevada: ${this.systemData.errorRate}%`);
        }

        if (this.systemData.networkLatency > 200) {
            this.createAlert('warning', 'Latência de Rede', `Alta latência detectada: ${this.systemData.networkLatency}ms`);
        }
    }

    createAlert(type, title, message) {
        const alert = {
            id: Date.now(),
            type,
            title,
            message,
            timestamp: new Date()
        };

        this.alerts.push(alert);
        this.renderAlert(alert);
    }

    renderAlert(alert) {
        const container = document.getElementById('alerts-container');
        if (!container) return;

        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${alert.type} alert-dismissible`;
        alertElement.innerHTML = `
            <div class="alert-content">
                <div class="alert-header">
                    <strong>${alert.title}</strong>
                    <button class="alert-close" onclick="this.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <p>${alert.message}</p>
                <small class="alert-time">${this.formatTime(alert.timestamp)}</small>
            </div>
        `;

        container.appendChild(alertElement);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (alertElement.parentElement) {
                alertElement.remove();
            }
        }, 10000);
    }

    // Action handlers
    refreshAllData() {
        this.showLoadingState();
        
        setTimeout(() => {
            this.loadInitialData();
            this.hideLoadingState();
            this.showSuccessMessage('Dados atualizados com sucesso!');
        }, 1500);
    }

    showLoadingState() {
        document.querySelectorAll('.card').forEach(card => {
            card.classList.add('loading');
        });
    }

    hideLoadingState() {
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('loading');
        });
    }

    showSuccessMessage(message) {
        this.createAlert('success', 'Sucesso', message);
    }

    openSettings() {
        window.location.href = 'Configurações.html';
    }

    handleSearch(query) {
        if (!query) {
            this.updateUsersTable();
            return;
        }

        const filteredUsers = this.users.filter(user => 
            user.name.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase()) ||
            user.convoy.toLowerCase().includes(query.toLowerCase())
        );

        this.updateUsersTableWithFiltered(filteredUsers);
    }

    updateUsersTableWithFiltered(users) {
        const tbody = document.querySelector('#users-table tbody');
        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-results">
                        <i class="fas fa-search"></i>
                        <p>Nenhum usuário encontrado para "${document.getElementById('search-input').value}"</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr class="user-row" data-user-id="${user.id}">
                <td class="user-info">
                    <div class="user-avatar">
                        <img src="/icon/Usuario.png" alt="${user.name}">
                    </div>
                    <div class="user-details">
                        <span class="user-name">${user.name}</span>
                        <span class="user-email">${user.email}</span>
                    </div>
                </td>
                <td class="user-status">
                    <span class="status-indicator ${user.status}">
                        <i class="fas fa-circle"></i>
                        ${this.getStatusText(user.status)}
                    </span>
                </td>
                <td class="user-platform">
                    <i class="fas ${this.getPlatformIcon(user.platform)}"></i>
                    ${this.getPlatformName(user.platform)}
                </td>
                <td class="user-role">${user.role}</td>
                <td class="user-convoy">${user.convoy}</td>
                <td class="user-actions">
                    <button class="btn-icon" onclick="painel.viewUserDetails(${user.id})" title="Ver Detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="painel.editUser(${user.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon danger" onclick="painel.removeUser(${user.id})" title="Remover">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    handleFilter(filter) {
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        // Filter users based on selected filter
        let filteredUsers = this.users;

        switch (filter) {
            case 'all':
                break;
            case 'online':
                filteredUsers = this.users.filter(user => user.status === 'online');
                break;
            case 'offline':
                filteredUsers = this.users.filter(user => user.status === 'offline');
                break;
            case 'mobile':
                filteredUsers = this.users.filter(user => user.platform === 'mobile');
                break;
            case 'web':
                filteredUsers = this.users.filter(user => user.platform === 'web');
                break;
        }

        this.updateUsersTableWithFiltered(filteredUsers);
    }

    handleUserAction(action, userId) {
        const user = this.users.find(u => u.id == userId);
        if (!user) return;

        switch (action) {
            case 'view':
                this.viewUserDetails(userId);
                break;
            case 'edit':
                this.editUser(userId);
                break;
            case 'remove':
                this.removeUser(userId);
                break;
            case 'suspend':
                this.suspendUser(userId);
                break;
            case 'activate':
                this.activateUser(userId);
                break;
        }
    }

    viewUserDetails(userId) {
        const user = this.users.find(u => u.id == userId);
        if (!user) return;

        const modal = document.getElementById('user-details-modal');
        if (!modal) return;

        modal.querySelector('.modal-title').textContent = `Detalhes do Usuário: ${user.name}`;
        modal.querySelector('.modal-body').innerHTML = `
            <div class="user-details-content">
                <div class="user-profile">
                    <div class="user-avatar-large">
                        <img src="/icon/Usuario.png" alt="${user.name}">
                    </div>
                    <div class="user-info">
                        <h3>${user.name}</h3>
                        <p>${user.email}</p>
                        <span class="status-indicator ${user.status}">
                            <i class="fas fa-circle"></i>
                            ${this.getStatusText(user.status)}
                        </span>
                    </div>
                </div>
                <div class="user-metrics">
                    <div class="metric">
                        <label>Plataforma</label>
                        <span>${this.getPlatformName(user.platform)}</span>
                    </div>
                    <div class="metric">
                        <label>Função</label>
                        <span>${user.role}</span>
                    </div>
                    <div class="metric">
                        <label>Comboio</label>
                        <span>${user.convoy}</span>
                    </div>
                    <div class="metric">
                        <label>Última Atividade</label>
                        <span>${this.formatTime(user.lastSeen)}</span>
                    </div>
                </div>
                <div class="user-activity">
                    <h4>Atividade Recente</h4>
                    <div class="activity-list">
                        <div class="activity-item">
                            <i class="fas fa-sign-in-alt"></i>
                            <span>Login no sistema</span>
                            <small>${this.formatTime(user.lastSeen)}</small>
                        </div>
                        <div class="activity-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>Localização atualizada</span>
                            <small>${this.formatTime(new Date(Date.now() - 600000))}</small>
                        </div>
                        <div class="activity-item">
                            <i class="fas fa-comment"></i>
                            <span>Mensagem enviada</span>
                            <small>${this.formatTime(new Date(Date.now() - 1200000))}</small>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.showModal();
    }

    editUser(userId) {
        const user = this.users.find(u => u.id == userId);
        if (!user) return;

        const modal = document.getElementById('edit-user-modal');
        if (!modal) return;

        modal.querySelector('.modal-title').textContent = `Editar Usuário: ${user.name}`;
        modal.querySelector('.modal-body').innerHTML = `
            <form class="edit-user-form">
                <div class="form-group">
                    <label for="edit-name">Nome</label>
                    <input type="text" id="edit-name" value="${user.name}" required>
                </div>
                <div class="form-group">
                    <label for="edit-email">Email</label>
                    <input type="email" id="edit-email" value="${user.email}" required>
                </div>
                <div class="form-group">
                    <label for="edit-role">Função</label>
                    <select id="edit-role">
                        <option value="Líder" ${user.role === 'Líder' ? 'selected' : ''}>Líder</option>
                        <option value="Navegador" ${user.role === 'Navegador' ? 'selected' : ''}>Navegador</option>
                        <option value="Suporte" ${user.role === 'Suporte' ? 'selected' : ''}>Suporte</option>
                        <option value="Administrador" ${user.role === 'Administrador' ? 'selected' : ''}>Administrador</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-convoy">Comboio</label>
                    <input type="text" id="edit-convoy" value="${user.convoy}" required>
                </div>
                <div class="form-group">
                    <label for="edit-status">Status</label>
                    <select id="edit-status">
                        <option value="online" ${user.status === 'online' ? 'selected' : ''}>Online</option>
                        <option value="offline" ${user.status === 'offline' ? 'selected' : ''}>Offline</option>
                        <option value="away" ${user.status === 'away' ? 'selected' : ''}>Ausente</option>
                    </select>
                </div>
            </form>
        `;

        this.showModal();
    }

    removeUser(userId) {
        const user = this.users.find(u => u.id == userId);
        if (!user) return;

        if (confirm(`Tem certeza que deseja remover o usuário "${user.name}"?`)) {
            this.users = this.users.filter(u => u.id !== userId);
            this.updateUsersTable();
            this.showSuccessMessage(`Usuário "${user.name}" removido com sucesso!`);
        }
    }

    suspendUser(userId) {
        const user = this.users.find(u => u.id == userId);
        if (!user) return;

        user.status = 'offline';
        this.updateUsersTable();
        this.showSuccessMessage(`Usuário "${user.name}" suspenso com sucesso!`);
    }

    activateUser(userId) {
        const user = this.users.find(u => u.id == userId);
        if (!user) return;

        user.status = 'online';
        this.updateUsersTable();
        this.showSuccessMessage(`Usuário "${user.name}" ativado com sucesso!`);
    }

    showPlatformDetails(platformId) {
        const platform = this.platforms.find(p => p.id === platformId);
        if (!platform) return;

        const modal = document.getElementById('platform-details-modal');
        if (!modal) return;

        modal.querySelector('.modal-title').textContent = `Detalhes da Plataforma: ${platform.name}`;
        modal.querySelector('.modal-body').innerHTML = `
            <div class="platform-details">
                <div class="platform-header">
                    <div class="platform-icon-large">
                        <i class="fas ${platform.icon}"></i>
                    </div>
                    <div class="platform-info">
                        <h3>${platform.name}</h3>
                        <span class="platform-status ${platform.status}">
                            <i class="fas fa-circle"></i>
                            ${this.getStatusText(platform.status)}
                        </span>
                        <span class="platform-version">Versão ${platform.version}</span>
                    </div>
                </div>
                <div class="platform-metrics">
                    <div class="metric">
                        <label>Usuários Ativos</label>
                        <span>${platform.users.toLocaleString()}</span>
                    </div>
                    <div class="metric">
                        <label>Uptime</label>
                        <span>${platform.uptime}%</span>
                    </div>
                    <div class="metric">
                        <label>Última Atualização</label>
                        <span>${this.formatTime(platform.lastUpdate)}</span>
                    </div>
                </div>
                <div class="platform-features">
                    <h4>Funcionalidades</h4>
                    <div class="features-list">
                        ${platform.features.map(feature => `
                            <div class="feature-item">
                                <i class="fas fa-check"></i>
                                <span>${feature}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="platform-actions">
                    <button class="btn btn-primary" onclick="painel.restartPlatform('${platformId}')">
                        <i class="fas fa-redo"></i>
                        Reiniciar
                    </button>
                    <button class="btn btn-secondary" onclick="painel.updatePlatform('${platformId}')">
                        <i class="fas fa-download"></i>
                        Atualizar
                    </button>
                    <button class="btn btn-warning" onclick="painel.maintainPlatform('${platformId}')">
                        <i class="fas fa-tools"></i>
                        Manutenção
                    </button>
                </div>
            </div>
        `;

        this.showModal();
    }

    restartPlatform(platformId) {
        const platform = this.platforms.find(p => p.id === platformId);
        if (!platform) return;

        if (confirm(`Tem certeza que deseja reiniciar a plataforma "${platform.name}"?`)) {
            platform.status = 'maintenance';
            this.updatePlatformStatus();
            
            setTimeout(() => {
                platform.status = 'online';
                this.updatePlatformStatus();
                this.showSuccessMessage(`Plataforma "${platform.name}" reiniciada com sucesso!`);
            }, 3000);
        }
    }

    updatePlatform(platformId) {
        const platform = this.platforms.find(p => p.id === platformId);
        if (!platform) return;

        this.showSuccessMessage(`Atualização da plataforma "${platform.name}" iniciada!`);
        
        // Simulate update process
        setTimeout(() => {
            const versionParts = platform.version.split('.');
            versionParts[2] = (parseInt(versionParts[2]) + 1).toString();
            platform.version = versionParts.join('.');
            this.updatePlatformStatus();
            this.showSuccessMessage(`Plataforma "${platform.name}" atualizada para versão ${platform.version}!`);
        }, 5000);
    }

    maintainPlatform(platformId) {
        const platform = this.platforms.find(p => p.id === platformId);
        if (!platform) return;

        platform.status = 'maintenance';
        this.updatePlatformStatus();
        this.showSuccessMessage(`Plataforma "${platform.name}" em modo de manutenção!`);
    }

    executeQuickAction(action) {
        switch (action) {
            case 'backup':
                this.performBackup();
                break;
            case 'cleanup':
                this.performCleanup();
                break;
            case 'optimize':
                this.performOptimization();
                break;
            case 'restart-all':
                this.restartAllPlatforms();
                break;
            case 'export-data':
                this.exportData();
                break;
            case 'import-data':
                this.importData();
                break;
        }
    }

    performBackup() {
        this.showSuccessMessage('Backup do sistema iniciado!');
        
        setTimeout(() => {
            this.showSuccessMessage('Backup concluído com sucesso!');
        }, 3000);
    }

    performCleanup() {
        this.showSuccessMessage('Limpeza do sistema iniciada!');
        
        setTimeout(() => {
            this.systemData.storageUsage = Math.max(20, this.systemData.storageUsage - 10);
            this.updateSystemMetrics();
            this.showSuccessMessage('Limpeza concluída com sucesso!');
        }, 2000);
    }

    performOptimization() {
        this.showSuccessMessage('Otimização do sistema iniciada!');
        
        setTimeout(() => {
            this.systemData.networkLatency = Math.max(10, this.systemData.networkLatency - 20);
            this.systemData.systemHealth = Math.min(100, this.systemData.systemHealth + 2);
            this.updateSystemMetrics();
            this.showSuccessMessage('Otimização concluída com sucesso!');
        }, 4000);
    }

    restartAllPlatforms() {
        if (confirm('Tem certeza que deseja reiniciar todas as plataformas?')) {
            this.showSuccessMessage('Reiniciando todas as plataformas...');
            
            this.platforms.forEach(platform => {
                platform.status = 'maintenance';
            });
            this.updatePlatformStatus();
            
            setTimeout(() => {
                this.platforms.forEach(platform => {
                    platform.status = 'online';
                });
                this.updatePlatformStatus();
                this.showSuccessMessage('Todas as plataformas reiniciadas com sucesso!');
            }, 5000);
        }
    }

    exportData() {
        const data = {
            system: this.systemData,
            platforms: this.platforms,
            users: this.users,
            timestamp: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trilhanca-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showSuccessMessage('Dados exportados com sucesso!');
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        this.loadImportedData(data);
                        this.showSuccessMessage('Dados importados com sucesso!');
                    } catch (error) {
                        this.createAlert('error', 'Erro na Importação', 'Arquivo inválido ou corrompido');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    loadImportedData(data) {
        if (data.system) {
            this.systemData = { ...this.systemData, ...data.system };
        }
        if (data.platforms) {
            this.platforms = data.platforms;
        }
        if (data.users) {
            this.users = data.users;
        }

        this.loadInitialData();
    }

    showPlatformMenu(platformId) {
        // Show context menu for platform actions
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <div class="menu-item" onclick="painel.showPlatformDetails('${platformId}')">
                <i class="fas fa-info-circle"></i>
                Ver Detalhes
            </div>
            <div class="menu-item" onclick="painel.restartPlatform('${platformId}')">
                <i class="fas fa-redo"></i>
                Reiniciar
            </div>
            <div class="menu-item" onclick="painel.updatePlatform('${platformId}')">
                <i class="fas fa-download"></i>
                Atualizar
            </div>
            <div class="menu-item" onclick="painel.maintainPlatform('${platformId}')">
                <i class="fas fa-tools"></i>
                Manutenção
            </div>
        `;

        document.body.appendChild(menu);

        // Position menu
        const rect = event.target.getBoundingClientRect();
        menu.style.left = rect.left + 'px';
        menu.style.top = rect.bottom + 'px';

        // Close menu when clicking outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    showModal() {
        const modal = document.querySelector('.modal.show');
        if (modal) {
            modal.classList.add('active');
        }
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    updateConnectionStatus(isOnline) {
        const status = document.getElementById('connection-status');
        if (status) {
            status.className = `connection-status ${isOnline ? 'online' : 'offline'}`;
            status.innerHTML = `
                <i class="fas ${isOnline ? 'fa-wifi' : 'fa-wifi-slash'}"></i>
                ${isOnline ? 'Online' : 'Offline'}
            `;
        }

        if (!isOnline) {
            this.createAlert('warning', 'Conexão Perdida', 'Você está offline. Algumas funcionalidades podem não estar disponíveis.');
        } else {
            this.createAlert('success', 'Conexão Restabelecida', 'Você está online novamente.');
        }
    }

    handleResize() {
        // Re-render charts on resize
        Object.values(this.charts).forEach(chart => {
            this.renderChart(chart.ctx, chart.data);
        });
    }
}

// Initialize the dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.painel = new PainelDeControle();
});

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PainelDeControle;
}