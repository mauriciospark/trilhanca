// Todo TRILHANÇA - Sistema de Gerenciamento de Tarefas
class TodoSystem {
    constructor() {
        this.tasks = [];
        this.currentFilter = {
            search: '',
            category: '',
            priority: '',
            status: ''
        };
        this.currentView = 'grid';
        this.settings = {
            autoSave: true,
            notifications: true,
            compactView: false,
            theme: 'light'
        };
        
        this.init();
    }

    // Inicialização
    init() {
        console.log('🚀 Inicializando Todo TRILHANÇA...');
        
        this.loadFromStorage();
        this.setupEventListeners();
        this.renderTasks();
        this.updateStats();
        this.applySettings();
        
        console.log('✅ Todo TRILHANÇA inicializado com sucesso!');
    }

    // Carregar do localStorage
    loadFromStorage() {
        try {
            const savedTasks = localStorage.getItem('trilhanca_tasks');
            if (savedTasks) {
                this.tasks = JSON.parse(savedTasks);
            }
            
            const savedSettings = localStorage.getItem('trilhanca_todo_settings');
            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            }
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            this.showToast('Erro ao carregar dados salvos', 'error');
        }
    }

    // Salvar no localStorage
    saveToStorage() {
        try {
            localStorage.setItem('trilhanca_tasks', JSON.stringify(this.tasks));
            localStorage.setItem('trilhanca_todo_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('❌ Erro ao salvar dados:', error);
            this.showToast('Erro ao salvar dados', 'error');
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        // Formulário de adicionar tarefa
        const addForm = document.getElementById('add-task-form');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addTask();
            });
        }

        // Botões de ação
        this.setupButton('clear-form', () => this.clearAddForm());
        this.setupButton('search-btn', () => this.searchTasks());
        this.setupButton('clear-filters', () => this.clearFilters());
        
        // Toggle de visualização
        this.setupButton('view-grid', () => this.setView('grid'));
        this.setupButton('view-list', () => this.setView('list'));
        
        // Modal de edição
        this.setupButton('close-modal', () => this.closeEditModal());
        this.setupButton('cancel-edit', () => this.closeEditModal());
        
        const editForm = document.getElementById('edit-task-form');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateTask();
            });
        }
        
        // Modal de configurações
        this.setupButton('settings-btn', () => this.openSettingsModal());
        this.setupButton('close-settings', () => this.closeSettingsModal());
        this.setupButton('clear-all-data', () => this.clearAllData());
        
        // Configurações
        this.setupCheckbox('auto-save', (value) => {
            this.settings.autoSave = value;
            this.saveToStorage();
        });
        
        this.setupCheckbox('notifications', (value) => {
            this.settings.notifications = value;
            this.saveToStorage();
        });
        
        this.setupCheckbox('compact-view', (value) => {
            this.settings.compactView = value;
            this.saveToStorage();
            this.applyCompactView();
        });
        
        // Toggle de tema
        this.setupButton('theme-toggle', () => this.toggleTheme());
        
        // Filtros
        this.setupSelect('filter-category', (value) => {
            this.currentFilter.category = value;
            this.renderTasks();
        });
        
        this.setupSelect('filter-priority', (value) => {
            this.currentFilter.priority = value;
            this.renderTasks();
        });
        
        this.setupSelect('filter-status', (value) => {
            this.currentFilter.status = value;
            this.renderTasks();
        });
        
        // Busca em tempo real
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilter.search = e.target.value.toLowerCase();
                this.renderTasks();
            });
        }
        
        // Auto-save
        if (this.settings.autoSave) {
            const inputs = ['task-title', 'task-category', 'task-description'];
            inputs.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('input', () => {
                        this.saveDraft();
                    });
                }
            });
        }
    }

    // Helper para configurar botões
    setupButton(id, callback) {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', callback);
        }
    }

    // Helper para configurar checkboxes
    setupCheckbox(id, callback) {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.checked = this.settings[id];
            checkbox.addEventListener('change', (e) => callback(e.target.checked));
        }
    }

    // Helper para configurar selects
    setupSelect(id, callback) {
        const select = document.getElementById(id);
        if (select) {
            select.addEventListener('change', (e) => callback(e.target.value));
        }
    }

    // Adicionar tarefa
    addTask() {
        const title = document.getElementById('task-title').value.trim();
        const priority = document.getElementById('task-priority').value;
        const category = document.getElementById('task-category').value.trim();
        const deadline = document.getElementById('task-deadline').value;
        const description = document.getElementById('task-description').value.trim();
        
        if (!title) {
            this.showToast('O título da tarefa é obrigatório', 'warning');
            return;
        }
        
        const task = {
            id: Date.now(),
            title,
            priority,
            category: category || 'Geral',
            deadline,
            description,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.tasks.unshift(task);
        this.saveToStorage();
        this.renderTasks();
        this.updateStats();
        this.clearAddForm();
        this.showToast('Tarefa adicionada com sucesso!', 'success');
        
        if (this.settings.notifications && priority === 'urgent') {
            this.showNotification('Tarefa Urgente', title);
        }
    }

    // Editar tarefa
    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;
        
        document.getElementById('edit-task-id').value = task.id;
        document.getElementById('edit-task-title').value = task.title;
        document.getElementById('edit-task-priority').value = task.priority;
        document.getElementById('edit-task-category').value = task.category;
        document.getElementById('edit-task-deadline').value = task.deadline;
        document.getElementById('edit-task-description').value = task.description;
        document.getElementById('edit-task-status').value = task.status;
        
        document.getElementById('edit-modal').classList.remove('hidden');
    }

    // Atualizar tarefa
    updateTask() {
        const id = parseInt(document.getElementById('edit-task-id').value);
        const taskIndex = this.tasks.findIndex(t => t.id === id);
        
        if (taskIndex === -1) return;
        
        this.tasks[taskIndex] = {
            ...this.tasks[taskIndex],
            title: document.getElementById('edit-task-title').value.trim(),
            priority: document.getElementById('edit-task-priority').value,
            category: document.getElementById('edit-task-category').value.trim(),
            deadline: document.getElementById('edit-task-deadline').value,
            description: document.getElementById('edit-task-description').value.trim(),
            status: document.getElementById('edit-task-status').value,
            updatedAt: new Date().toISOString()
        };
        
        this.saveToStorage();
        this.renderTasks();
        this.updateStats();
        this.closeEditModal();
        this.showToast('Tarefa atualizada com sucesso!', 'success');
    }

    // Deletar tarefa
    deleteTask(id) {
        if (!confirm('Tem certeza que deseja deletar esta tarefa?')) return;
        
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveToStorage();
        this.renderTasks();
        this.updateStats();
        this.showToast('Tarefa deletada com sucesso!', 'success');
    }

    // Toggle status da tarefa
    toggleTaskStatus(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;
        
        const statusFlow = {
            'pending': 'in-progress',
            'in-progress': 'completed',
            'completed': 'pending'
        };
        
        task.status = statusFlow[task.status] || 'pending';
        task.updatedAt = new Date().toISOString();
        
        this.saveToStorage();
        this.renderTasks();
        this.updateStats();
        this.showToast(`Status da tarefa alterado para ${this.getStatusLabel(task.status)}`, 'info');
    }

    // Renderizar tarefas
    renderTasks() {
        const container = document.getElementById('tasks-container');
        const emptyState = document.getElementById('empty-state');
        
        if (!container) return;
        
        // Filtrar tarefas
        let filteredTasks = this.tasks.filter(task => {
            const matchesSearch = !this.currentFilter.search || 
                task.title.toLowerCase().includes(this.currentFilter.search) ||
                task.description.toLowerCase().includes(this.currentFilter.search) ||
                task.category.toLowerCase().includes(this.currentFilter.search);
            
            const matchesCategory = !this.currentFilter.category || task.category === this.currentFilter.category;
            const matchesPriority = !this.currentFilter.priority || task.priority === this.currentFilter.priority;
            const matchesStatus = !this.currentFilter.status || task.status === this.currentFilter.status;
            
            return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
        });
        
        // Ordenar tarefas
        filteredTasks.sort((a, b) => {
            // Urgentes primeiro
            const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            
            // Depois por data de criação
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        // Renderizar
        if (filteredTasks.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            container.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
            container.className = this.currentView === 'list' ? 'tasks-list' : 'tasks-grid';
        }
        
        // Atualizar categorias no filtro
        this.updateCategoryFilter();
    }

    // Criar HTML da tarefa
    createTaskHTML(task) {
        const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';
        const priorityClass = `priority-${task.priority}`;
        const statusClass = `status-${task.status}`;
        
        return `
            <div class="task-item ${task.status} ${task.priority}" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-title">${this.escapeHtml(task.title)}</div>
                    <div class="task-priority ${priorityClass}">${this.getPriorityLabel(task.priority)}</div>
                </div>
                
                <div class="task-meta">
                    <div class="task-category">${this.escapeHtml(task.category)}</div>
                    ${task.deadline ? `
                        <div class="task-deadline ${isOverdue ? 'overdue' : ''}">
                            <i class="fas fa-calendar"></i>
                            ${this.formatDate(task.deadline)}
                        </div>
                    ` : ''}
                </div>
                
                ${task.description ? `
                    <div class="task-description">${this.escapeHtml(task.description)}</div>
                ` : ''}
                
                <div class="task-status">
                    <span class="status-badge ${statusClass}">${this.getStatusLabel(task.status)}</span>
                </div>
                
                <div class="task-actions">
                    <button class="btn small" onclick="todoSystem.toggleTaskStatus(${task.id})" title="Alterar Status">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                    <button class="btn small" onclick="todoSystem.editTask(${task.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn small danger" onclick="todoSystem.deleteTask(${task.id})" title="Deletar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Atualizar estatísticas
    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.status === 'completed').length;
        const pendingTasks = this.tasks.filter(t => t.status === 'pending').length;
        const urgentTasks = this.tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
        
        this.updateElement('total-tasks', totalTasks);
        this.updateElement('completed-tasks', completedTasks);
        this.updateElement('pending-tasks', pendingTasks);
        this.updateElement('urgent-tasks', urgentTasks);
    }

    // Helper para atualizar elementos
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    // Limpar formulário de adição
    clearAddForm() {
        document.getElementById('add-task-form').reset();
    }

    // Limpar filtros
    clearFilters() {
        this.currentFilter = {
            search: '',
            category: '',
            priority: '',
            status: ''
        };
        
        document.getElementById('search-input').value = '';
        document.getElementById('filter-category').value = '';
        document.getElementById('filter-priority').value = '';
        document.getElementById('filter-status').value = '';
        
        this.renderTasks();
        this.showToast('Filtros limpos', 'info');
    }

    // Buscar tarefas
    searchTasks() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        this.currentFilter.search = searchTerm;
        this.renderTasks();
    }

    // Atualizar filtro de categorias
    updateCategoryFilter() {
        const categories = [...new Set(this.tasks.map(t => t.category))];
        const select = document.getElementById('filter-category');
        
        if (!select) return;
        
        const currentValue = select.value;
        select.innerHTML = '<option value="">Todas as Categorias</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
        
        select.value = currentValue;
    }

    // Mudar visualização
    setView(view) {
        this.currentView = view;
        
        // Atualizar botões
        document.getElementById('view-grid').classList.toggle('active', view === 'grid');
        document.getElementById('view-list').classList.toggle('active', view === 'list');
        
        // Re-renderizar
        this.renderTasks();
    }

    // Modal de edição
    closeEditModal() {
        document.getElementById('edit-modal').classList.add('hidden');
    }

    // Modal de configurações
    openSettingsModal() {
        document.getElementById('settings-modal').classList.remove('hidden');
    }

    closeSettingsModal() {
        document.getElementById('settings-modal').classList.add('hidden');
    }

    // Limpar todos os dados
    clearAllData() {
        if (!confirm('Tem certeza que deseja deletar TODAS as tarefas? Esta ação não pode ser desfeita!')) return;
        
        this.tasks = [];
        this.saveToStorage();
        this.renderTasks();
        this.updateStats();
        this.closeSettingsModal();
        this.showToast('Todas as tarefas foram deletadas', 'success');
    }

    // Toggle de tema
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        this.settings.theme = newTheme;
        this.saveToStorage();
        
        // Atualizar ícone
        const themeIcon = document.querySelector('#theme-toggle i');
        if (themeIcon) {
            themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    // Aplicar configurações
    applySettings() {
        // Aplicar tema
        if (this.settings.theme) {
            document.documentElement.setAttribute('data-theme', this.settings.theme);
            const themeIcon = document.querySelector('#theme-toggle i');
            if (themeIcon) {
                themeIcon.className = this.settings.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
        
        // Aplicar vista compacta
        this.applyCompactView();
    }

    // Aplicar vista compacta
    applyCompactView() {
        const container = document.getElementById('tasks-container');
        if (container) {
            container.classList.toggle('compact-view', this.settings.compactView);
        }
    }

    // Salvar rascunho
    saveDraft() {
        const draft = {
            title: document.getElementById('task-title').value,
            category: document.getElementById('task-category').value,
            description: document.getElementById('task-description').value
        };
        
        localStorage.setItem('trilhanca_task_draft', JSON.stringify(draft));
    }

    // Mostrar notificação
    showNotification(title, body) {
        if (!('Notification' in window)) return;
        
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: '../favicoico/android-chrome-192x192.png'
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }

    // Mostrar toast
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Helpers de formatação
    getPriorityLabel(priority) {
        const labels = {
            urgent: '🚨 Urgente',
            high: '🔴 Alta',
            medium: '🟡 Média',
            low: '🟢 Baixa'
        };
        return labels[priority] || priority;
    }

    getStatusLabel(status) {
        const labels = {
            pending: 'Pendente',
            'in-progress': 'Em Andamento',
            completed: 'Concluída'
        };
        return labels[status] || status;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const diffTime = date - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Amanhã';
        if (diffDays === -1) return 'Ontem';
        
        return date.toLocaleDateString('pt-BR');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Destruir instância
    destroy() {
        console.log('🗑️ Todo TRILHANÇA destruído');
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.todoSystem = new TodoSystem();
});

// Exportar para uso global
window.TodoSystem = TodoSystem;
