// Sistema de Navegação por Abas - Configurações Trilhança
// Versão limpa e funcional

class ConfiguracoesManager {
    constructor() {
        this.activeTab = 'general';
        this.config = {
            // Configurações gerais
            language: 'pt-BR',
            timezone: 'America/Sao_Paulo',
            imageQuality: 'medium',
            offlineMode: false,
            autoSync: true,
            cloudBackup: true,
            dataCache: true,
            
            // Configurações de perfil
            fullName: '',
            email: '',
            telefone1: '',
            phone: '',
            birthdate: '',
            bio: '',
            publicEmail: false,
            publicPhone: false,
            privateProfile: false,
            profilePhoto: '',
            
            // Configurações de segurança
            twoFactor: false,
            biometricAuth: false,
            autoLogin: false,
            strongPassword: false,
            passwordExpiry: '90',
            
            // Configurações de notificações
            pushNotifications: true,
            newMessages: true,
            trailUpdates: true,
            newContacts: true,
            dailySummary: false,
            securityAlerts: true,
            systemUpdates: true,
            silentMode: false,
            silentStart: '22:00',
            silentEnd: '08:00',
            
            // Configurações de privacidade
            dataCollection: true,
            analytics: true,
            personalizedAds: false,
            shareLocation: false,
            locationHistory: false,
            realtimeLocation: false,
            
            // Configurações de aparência
            theme: 'light',
            primaryColor: '#007bff',
            secondaryColor: '#6c757d',
            accentColor: '#28a745',
            fontSize: '16px',
            fontFamily: 'Inter, sans-serif',
            animations: true,
            compactMode: false,
            
            // Configurações avançadas
            developerMode: false,
            debugConsole: false,
            verboseLogs: false,
            experimentalFeatures: false,
            betaProgram: false
        };
        
        this.init();
    }
    
    init() {
        this.loadConfig();
        this.setupEventListeners();
        this.setupTabNavigation();
        this.switchTab('general');
        this.setupFormValidation();
    }
    
    loadConfig() {
        try {
            const saved = localStorage.getItem('trilha_config');
            if (saved) {
                this.config = { ...this.config, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
    }
    
    saveConfig() {
        try {
            localStorage.setItem('trilha_config', JSON.stringify(this.config));
            this.showNotification('Configurações salvas com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            this.showNotification('Erro ao salvar configurações', 'error');
        }
    }
    
    setupEventListeners() {
        // Header actions
        document.getElementById('save-all-btn')?.addEventListener('click', () => this.saveAllConfigs());
        document.getElementById('reset-all-btn')?.addEventListener('click', () => this.resetAllConfigs());
        document.getElementById('export-config-btn')?.addEventListener('click', () => this.exportConfig());
        
        // Form actions
        document.getElementById('save-btn')?.addEventListener('click', () => this.saveCurrentTab());
        document.getElementById('cancel-btn')?.addEventListener('click', () => this.cancelChanges());
        
        // Profile actions
        document.getElementById('change-photo-btn')?.addEventListener('click', () => this.changeProfilePhoto());
        document.getElementById('remove-photo-btn')?.addEventListener('click', () => this.removeProfilePhoto());
        
        // Auto-save on change para campos com data-profile-field
        this.setupProfileSync();
        
        // Auto-save geral
        this.setupAutoSave();
    }
    
    setupProfileSync() {
        // Sincronização automática com perfil
        const profileFields = document.querySelectorAll('[data-profile-field]');
        
        profileFields.forEach(field => {
            field.addEventListener('input', (e) => {
                const fieldName = field.dataset.profileField;
                const value = field.value;
                
                // Atualizar configuração local
                this.updateProfileField(fieldName, value);
                
                // Salvar automaticamente
                this.saveConfig();
                
                // Notificar perfil sobre mudança
                this.notifyProfileUpdate(fieldName, value);
            });
            
            field.addEventListener('change', (e) => {
                const fieldName = field.dataset.profileField;
                const value = field.value;
                
                this.updateProfileField(fieldName, value);
                this.saveConfig();
                this.notifyProfileUpdate(fieldName, value);
            });
        });
    }
    
    updateProfileField(fieldName, value) {
        // Mapear campos para as configurações correspondentes
        const fieldMap = {
            'name': 'fullName',
            'email': 'email',
            'phone': 'phone',
            'telefone1': 'telefone1',
            'birthdate': 'birthdate',
            'bio': 'bio'
        };
        
        const configField = fieldMap[fieldName];
        if (configField) {
            this.config[configField] = value;
            
            // Adicionar feedback visual
            this.showSyncStatus(field, 'success');
        }
    }
    
    notifyProfileUpdate(fieldName, value) {
        // Disparar evento para o perfil escutar
        const event = new CustomEvent('profileUpdate', {
            detail: { field: fieldName, value: value }
        });
        window.dispatchEvent(event);
        
        // Salvar também no storage específico do perfil
        try {
            const profileData = JSON.parse(localStorage.getItem('trilha_profile') || '{}');
            profileData[fieldName] = value;
            localStorage.setItem('trilha_profile', JSON.stringify(profileData));
        } catch (error) {
            console.error('Erro ao sincronizar com perfil:', error);
        }
    }
    
    showSyncStatus(field, status) {
        // Mostrar indicador visual de sincronização
        let statusEl = field.parentNode.querySelector('.sync-status');
        
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.className = 'sync-status';
            statusEl.innerHTML = `
                <i class="fas fa-${status === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${status === 'success' ? 'Sincronizado' : 'Erro'}</span>
            `;
            field.parentNode.appendChild(statusEl);
        }
        
        // Atualizar status
        statusEl.className = `sync-status ${status} show`;
        
        // Remover após 2 segundos
        setTimeout(() => {
            statusEl.classList.remove('show');
        }, 2000);
    }
    
    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        
        if (tabButtons.length === 0) {
            console.error('Nenhuma aba encontrada');
            return;
        }
        
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = btn.dataset.tab;
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
            
            // Suporte a teclado
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const tabName = btn.dataset.tab;
                    if (tabName) {
                        this.switchTab(tabName);
                    }
                }
            });
        });
        
        // Adicionar navegação por setas
        this.setupArrowNavigation(tabButtons);
    }
    
    setupArrowNavigation(tabButtons) {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                const activeBtn = document.querySelector('.tab-btn.active');
                if (!activeBtn) return;
                
                const currentIndex = Array.from(tabButtons).indexOf(activeBtn);
                if (currentIndex === -1) return;
                
                let nextIndex;
                if (e.key === 'ArrowLeft') {
                    nextIndex = currentIndex > 0 ? currentIndex - 1 : tabButtons.length - 1;
                } else {
                    nextIndex = currentIndex < tabButtons.length - 1 ? currentIndex + 1 : 0;
                }
                
                e.preventDefault();
                tabButtons[nextIndex].focus();
                tabButtons[nextIndex].click();
            }
        });
    }
    
    switchTab(tabName) {
        // Validar nome da aba
        const validTabs = ['general', 'profile', 'security', 'notifications', 'privacy', 'appearance', 'advanced'];
        if (!validTabs.includes(tabName)) {
            console.error(`Aba inválida: ${tabName}`);
            return;
        }
        
        // Remover classe active de todos os botões
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });
        
        // Adicionar classe active ao botão clicado
        const activeTabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTabBtn) {
            activeTabBtn.classList.add('active');
            activeTabBtn.setAttribute('aria-selected', 'true');
        }
        
        // Esconder todos os conteúdos
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });
        
        // Mostrar conteúdo da aba selecionada
        const activeTabContent = document.getElementById(`${tabName}-tab`);
        if (activeTabContent) {
            activeTabContent.classList.add('active');
            activeTabContent.style.display = 'block';
        }
        
        this.activeTab = tabName;
        this.updateTabContent(tabName);
        console.log(`Aba ativa: ${tabName}`);
    }
    
    updateTabContent(tabName) {
        switch (tabName) {
            case 'general':
                this.updateGeneralTab();
                break;
            case 'profile':
                this.updateProfileTab();
                break;
            case 'security':
                this.updateSecurityTab();
                break;
            case 'notifications':
                this.updateNotificationsTab();
                break;
            case 'privacy':
                this.updatePrivacyTab();
                break;
            case 'appearance':
                this.updateAppearanceTab();
                break;
            case 'advanced':
                this.updateAdvancedTab();
                break;
        }
    }
    
    updateGeneralTab() {
        // Update selects
        document.getElementById('language-select').value = this.config.language;
        document.getElementById('timezone-select').value = this.config.timezone;
        document.getElementById('image-quality').value = this.config.imageQuality;
        
        // Update toggles
        this.updateToggle('offline-mode', this.config.offlineMode);
        this.updateToggle('auto-sync', this.config.autoSync);
        this.updateToggle('cloud-backup', this.config.cloudBackup);
        this.updateToggle('data-cache', this.config.dataCache);
    }
    
    updateProfileTab() {
        // Update inputs
        document.getElementById('full-name').value = this.config.fullName || '';
        document.getElementById('email').value = this.config.email || '';
        document.getElementById('telefone1').value = this.config.telefone1 || '';
        document.getElementById('phone').value = this.config.phone || '';
        document.getElementById('birthdate').value = this.config.birthdate || '';
        document.getElementById('bio').value = this.config.bio || '';
        
        // Update toggles
        this.updateToggle('public-email', this.config.publicEmail);
        this.updateToggle('public-phone', this.config.publicPhone);
        this.updateToggle('private-profile', this.config.privateProfile);
        
        // Update profile photo - mostrar padrão se não tiver foto
        const photoEl = document.getElementById('profile-photo');
        if (photoEl) {
            if (this.config.profilePhoto) {
                photoEl.src = this.config.profilePhoto;
            } else {
                photoEl.src = '/icon/Usuario.png';  // Imagem padrão
            }
        }
    }
    
    updateSecurityTab() {
        // Update toggles
        this.updateToggle('two-factor', this.config.twoFactor);
        this.updateToggle('biometric-auth', this.config.biometricAuth);
        this.updateToggle('auto-login', this.config.autoLogin);
        this.updateToggle('strong-password', this.config.strongPassword);
        
        // Update select
        document.getElementById('password-expiry').value = this.config.passwordExpiry;
    }
    
    updateNotificationsTab() {
        // Update toggles
        this.updateToggle('push-notifications', this.config.pushNotifications);
        this.updateToggle('new-messages', this.config.newMessages);
        this.updateToggle('trail-updates', this.config.trailUpdates);
        this.updateToggle('new-contacts', this.config.newContacts);
        this.updateToggle('daily-summary', this.config.dailySummary);
        this.updateToggle('security-alerts', this.config.securityAlerts);
        this.updateToggle('system-updates', this.config.systemUpdates);
        this.updateToggle('silent-mode', this.config.silentMode);
        
        // Update time inputs
        document.getElementById('silent-start').value = this.config.silentStart;
        document.getElementById('silent-end').value = this.config.silentEnd;
    }
    
    updatePrivacyTab() {
        // Update toggles
        this.updateToggle('data-collection', this.config.dataCollection);
        this.updateToggle('analytics', this.config.analytics);
        this.updateToggle('personalized-ads', this.config.personalizedAds);
        this.updateToggle('share-location', this.config.shareLocation);
        this.updateToggle('location-history', this.config.locationHistory);
        this.updateToggle('realtime-location', this.config.realtimeLocation);
    }
    
    updateAppearanceTab() {
        // Update theme selector
        this.updateThemeSelector();
        
        // Update color inputs
        document.getElementById('primary-color').value = this.config.primaryColor;
        document.getElementById('secondary-color').value = this.config.secondaryColor;
        document.getElementById('accent-color').value = this.config.accentColor;
        
        // Update selects
        document.getElementById('font-size').value = this.config.fontSize;
        document.getElementById('font-family').value = this.config.fontFamily;
        
        // Update toggles
        this.updateToggle('animations', this.config.animations);
        this.updateToggle('compact-mode', this.config.compactMode);
    }
    
    updateAdvancedTab() {
        // Update toggles
        this.updateToggle('developer-mode', this.config.developerMode);
        this.updateToggle('debug-console', this.config.debugConsole);
        this.updateToggle('verbose-logs', this.config.verboseLogs);
        this.updateToggle('experimental-features', this.config.experimentalFeatures);
        this.updateToggle('beta-program', this.config.betaProgram);
    }
    
    updateToggle(id, value) {
        const toggle = document.getElementById(id);
        if (toggle) {
            toggle.checked = value;
        }
    }
    
    updateThemeSelector() {
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.theme === this.config.theme) {
                option.classList.add('selected');
            }
        });
    }
    
    setupFormValidation() {
        // Email validation
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('input', (e) => {
                this.validateEmail(e.target);
            });
        }
        
        // Phone validation
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                this.validatePhone(e.target);
            });
        }
    }
    
    validateEmail(input) {
        const email = input.value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email && !emailRegex.test(email)) {
            input.classList.add('error');
            this.showFieldError(input, 'Email inválido');
        } else {
            input.classList.remove('error');
            this.clearFieldError(input);
        }
    }
    
    validatePhone(input) {
        const phone = input.value;
        const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
        
        if (phone && !phoneRegex.test(phone)) {
            input.classList.add('error');
            this.showFieldError(input, 'Formato: (00) 00000-0000');
        } else {
            input.classList.remove('error');
            this.clearFieldError(input);
        }
    }
    
    showFieldError(input, message) {
        let errorElement = input.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            input.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }
    
    clearFieldError(input) {
        const errorElement = input.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    setupAutoSave() {
        // Auto-save functionality
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.saveCurrentTab();
            });
        });
    }
    
    saveCurrentTab() {
        // Salvar configurações da aba atual
        this.saveConfig();
    }
    
    saveAllConfigs() {
        // Salvar todas as configurações
        this.saveConfig();
    }
    
    resetAllConfigs() {
        // Redefinir configurações
        if (confirm('Tem certeza que deseja redefinir todas as configurações?')) {
            localStorage.removeItem('trilha_config');
            location.reload();
        }
    }
    
    exportConfig() {
        // Exportar configurações
        const dataStr = JSON.stringify(this.config, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'trilha-config.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
    
    changeProfilePhoto() {
        // Abrir seletor de arquivos
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                // Validar tamanho máximo (5MB)
                if (file.size > 5 * 1024 * 1024) {
                    this.showNotification('Arquivo muito grande. Máximo 5MB.', 'error');
                    return;
                }
                
                // Validar tipo
                if (!file.type.startsWith('image/')) {
                    this.showNotification('Por favor, selecione uma imagem válida.', 'error');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    const photoUrl = e.target.result;
                    
                    // Atualizar preview
                    const photoEl = document.getElementById('profile-photo');
                    if (photoEl) {
                        photoEl.src = photoUrl;
                        this.animateElement(photoEl);
                    }
                    
                    // Salvar nas configurações
                    this.config.profilePhoto = photoUrl;
                    this.saveConfig();
                    
                    // Sincronizar com perfil
                    this.syncPhotoToProfile(photoUrl);
                    
                    // Feedback
                    this.showNotification('Foto atualizada com sucesso!', 'success');
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }
    
    removeProfilePhoto() {
        if (confirm('Tem certeza que deseja remover a foto do perfil?')) {
            // Remover das configurações
            this.config.profilePhoto = '';
            this.saveConfig();
            
            // Resetar preview para imagem padrão
            const photoEl = document.getElementById('profile-photo');
            if (photoEl) {
                photoEl.src = '/icon/Usuario.png';
                this.animateElement(photoEl);
            }
            
            // Sincronizar com perfil
            this.syncPhotoToProfile('');
            
            // Feedback
            this.showNotification('Foto removida. Usando imagem padrão.', 'success');
        }
    }
    
    syncPhotoToProfile(photoUrl) {
        // Disparar evento para o perfil
        window.dispatchEvent(new CustomEvent('profilePhotoUpdate', {
            detail: { photoUrl }
        }));
        
        // Salvar também no storage do perfil
        try {
            const profileData = JSON.parse(localStorage.getItem('trilha_profile') || '{}');
            profileData.fotoPerfil = photoUrl;
            localStorage.setItem('trilha_profile', JSON.stringify(profileData));
        } catch (error) {
            console.error('Erro ao sincronizar foto:', error);
        }
    }
    
    animateElement(element) {
        // Adicionar animação de feedback
        element.style.transition = 'all 0.3s ease';
        element.style.transform = 'scale(1.05)';
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 300);
    }
    
    showNotification(message, type = 'info') {
        // Implementar notificação
        console.log(`${type}: ${message}`);
        
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `config-notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Adicionar ao DOM
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    cancelChanges() {
        // Cancelar mudanças
        location.reload();
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se estamos na página de configurações
    if (document.querySelector('.config-nav')) {
        window.configManager = new ConfiguracoesManager();
        console.log('Sistema de configurações inicializado');
    }
});

// Função global para troca de aba (compatibilidade)
window.switchToTab = function(tabName) {
    if (window.configManager) {
        window.configManager.switchTab(tabName);
    }
};
