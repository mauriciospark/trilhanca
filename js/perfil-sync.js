// Sistema de Sincronização de Perfil - Trilhança
// Sincroniza dados das configurações com a página de perfil

class ProfileSyncManager {
    constructor() {
        this.profileData = {
            nome: '',
            email: '',
            telefone: '',
            fotoPerfil: '',
            biografia: ''
        };
        
        this.init();
    }
    
    init() {
        this.loadProfileData();
        this.setupEventListeners();
        this.updateProfileDisplay();
        this.startAutoSync();
    }
    
    loadProfileData() {
        try {
            // Carregar do storage do perfil primeiro
            const savedProfile = localStorage.getItem('trilha_profile');
            if (savedProfile) {
                this.profileData = { ...this.profileData, ...JSON.parse(savedProfile) };
            }
            
            // Carregar também das configurações (prioridade maior)
            const configData = localStorage.getItem('trilha_config');
            if (configData) {
                const config = JSON.parse(configData);
                this.profileData = {
                    nome: config.fullName || this.profileData.nome,
                    email: config.email || this.profileData.email,
                    telefone: config.telefone1 || this.profileData.telefone,
                    fotoPerfil: config.profilePhoto || this.profileData.fotoPerfil,
                    biografia: config.bio || this.profileData.biografia
                };
                
                // Salvar de volta no perfil para consistência
                this.saveProfileData();
            }
            
            console.log('Dados do perfil carregados:', this.profileData);
        } catch (error) {
            console.error('Erro ao carregar dados do perfil:', error);
        }
    }
    
    setupEventListeners() {
        // Escutar atualizações das configurações
        window.addEventListener('profileUpdate', (e) => {
            const { field, value } = e.detail;
            this.updateProfileField(field, value);
            this.showUpdateNotification(field);
        });
        
        // Escutar atualizações de foto
        window.addEventListener('profilePhotoUpdate', (e) => {
            const { photoUrl } = e.detail;
            this.updateProfilePhoto(photoUrl);
        });
        
        // Escutar mudanças no storage
        window.addEventListener('storage', (e) => {
            if (e.key === 'trilha_config') {
                this.loadProfileData();
                this.updateProfileDisplay();
            }
        });
        
        // Setup dos botões de ação
        this.setupActionButtons();
    }
    
    setupActionButtons() {
        // Botão de alterar foto
        const changePhotoBtn = document.getElementById('change-photo');
        if (changePhotoBtn) {
            changePhotoBtn.addEventListener('click', () => {
                this.changeProfilePhoto();
            });
        }
        
        // Botão de sincronizar relógio
        const syncWatchBtn = document.getElementById('sync-watch');
        if (syncWatchBtn) {
            syncWatchBtn.addEventListener('click', () => {
                this.syncWithWatch();
            });
        }
        
        // Botão de sincronizar configurações
        const syncConfigBtn = document.getElementById('sync-config');
        if (syncConfigBtn) {
            syncConfigBtn.addEventListener('click', () => {
                this.syncWithConfig();
            });
        }
    }
    
    updateProfilePhoto(photoUrl) {
        // Atualizar dados do perfil
        this.profileData.fotoPerfil = photoUrl;
        
        // Atualizar display - mostrar padrão se não tiver foto
        const fotoEl = document.getElementById('perfil-foto');
        if (fotoEl) {
            if (photoUrl) {
                fotoEl.style.backgroundImage = `url('${photoUrl}')`;
                this.animateElement(fotoEl);
            } else {
                fotoEl.style.backgroundImage = "url('/icon/Usuario.png')";  // Imagem padrão
                this.animateElement(fotoEl);
            }
        }
        
        // Salvar no storage
        this.saveProfileData();
        
        // Feedback
        if (photoUrl) {
            this.showNotification('Foto atualizada com sucesso!', 'success');
        } else {
            this.showNotification('Foto removida. Usando imagem padrão.', 'success');
        }
    }
    
    updateProfileField(field, value) {
        // Mapear campos do perfil
        const fieldMap = {
            'name': 'nome',
            'email': 'email',
            'telefone1': 'telefone',
            'birthdate': 'dataNascimento',
            'bio': 'biografia'
        };
        
        const profileField = fieldMap[field];
        if (profileField && this.profileData[profileField] !== value) {
            this.profileData[profileField] = value;
            this.updateProfileDisplay();
            this.saveProfileData();
        }
    }
    
    updateProfileDisplay() {
        console.log('Atualizando display com dados:', this.profileData);
        
        // Atualizar nome
        const nomeEl = document.getElementById('perfil-nome');
        if (nomeEl) {
            nomeEl.textContent = this.profileData.nome || '—';
            if (this.profileData.nome) {
                this.animateElement(nomeEl);
            }
        }
        
        // Atualizar email
        const emailEl = document.getElementById('perfil-email');
        if (emailEl) {
            emailEl.textContent = this.profileData.email || '—';
            if (this.profileData.email) {
                this.animateElement(emailEl);
            }
        }
        
        // Atualizar telefone
        const telefoneEl = document.getElementById('perfil-telefone');
        if (telefoneEl) {
            telefoneEl.textContent = this.profileData.telefone ? this.formatPhoneNumber(this.profileData.telefone) : '—';
            if (this.profileData.telefone) {
                this.animateElement(telefoneEl);
            }
        }
        
        // Atualizar biografia
        const bioEl = document.getElementById('perfil-biografia');
        if (bioEl) {
            bioEl.textContent = this.profileData.biografia || '—';
            if (this.profileData.biografia) {
                this.animateElement(bioEl);
            }
        }
        
        // Atualizar foto - mostrar padrão se não tiver foto
        const fotoEl = document.getElementById('perfil-foto');
        if (fotoEl) {
            if (this.profileData.fotoPerfil) {
                fotoEl.style.backgroundImage = `url('${this.profileData.fotoPerfil}')`;
                this.animateElement(fotoEl);
            } else {
                fotoEl.style.backgroundImage = "url('/icon/Usuario.png')";  // Imagem padrão
                this.animateElement(fotoEl);
            }
        }
    }
    
    formatPhoneNumber(phone) {
        // Formatar número de telefone para exibição
        if (!phone) return '—';
        
        // Remover caracteres não numéricos
        const cleanPhone = phone.replace(/\D/g, '');
        
        // Formatar para Brasil
        if (cleanPhone.length === 11) {
            return `(${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 7)}-${cleanPhone.substring(7)}`;
        } else if (cleanPhone.length === 10) {
            return `(${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 6)}-${cleanPhone.substring(6)}`;
        }
        
        return phone;
    }
    
    animateElement(element) {
        // Adicionar animação sutil de atualização
        element.style.transition = 'all 0.3s ease';
        element.style.transform = 'scale(1.02)';
        element.style.color = 'var(--primary-color)';
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
            element.style.color = '';
        }, 300);
    }
    
    showUpdateNotification(field) {
        // Mostrar notificação de atualização
        const fieldNames = {
            'name': 'Nome',
            'email': 'Email',
            'telefone1': 'Telefone',
            'bio': 'Biografia'
        };
        
        const fieldName = fieldNames[field] || field;
        this.showNotification(`${fieldName} atualizado com sucesso!`, 'success');
    }
    
    showNotification(message, type = 'info') {
        // Criar notificação
        const notification = document.createElement('div');
        notification.className = `profile-notification ${type}`;
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
    
    saveProfileData() {
        try {
            localStorage.setItem('trilha_profile', JSON.stringify(this.profileData));
        } catch (error) {
            console.error('Erro ao salvar dados do perfil:', error);
        }
    }
    
    changeProfilePhoto() {
        // Implementar mudança de foto
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const photoUrl = e.target.result;
                    this.profileData.fotoPerfil = photoUrl;
                    
                    // Atualizar display
                    const fotoEl = document.getElementById('perfil-foto');
                    if (fotoEl) {
                        fotoEl.style.backgroundImage = `url('${photoUrl}')`;
                        this.animateElement(fotoEl);
                    }
                    
                    // Salvar e sincronizar
                    this.saveProfileData();
                    this.syncPhotoToConfig(photoUrl);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }
    
    syncPhotoToConfig(photoUrl) {
        // Sincronizar foto com configurações
        try {
            const configData = JSON.parse(localStorage.getItem('trilha_config') || '{}');
            configData.profilePhoto = photoUrl;
            localStorage.setItem('trilha_config', JSON.stringify(configData));
            
            // Disparar evento para configurações
            window.dispatchEvent(new CustomEvent('profilePhotoUpdate', {
                detail: { photoUrl }
            }));
        } catch (error) {
            console.error('Erro ao sincronizar foto:', error);
        }
    }
    
    syncWithWatch() {
        // Simular sincronização com relógio
        this.showNotification('Sincronizando com relógio...', 'info');
        
        setTimeout(() => {
            this.showNotification('Relógio sincronizado com sucesso!', 'success');
        }, 2000);
    }
    
    syncWithConfig() {
        // Forçar sincronização com configurações
        this.showNotification('Sincronizando com configurações...', 'info');
        
        setTimeout(() => {
            this.loadProfileData();
            this.updateProfileDisplay();
            this.showNotification('Configurações sincronizadas com sucesso!', 'success');
        }, 1000);
    }
    
    startAutoSync() {
        // Sincronização automática a cada 30 segundos
        setInterval(() => {
            this.loadProfileData();
            this.updateProfileDisplay();
        }, 30000);
        
        // Forçar sincronização inicial após 1 segundo
        setTimeout(() => {
            console.log('Forçando sincronização inicial...');
            this.loadProfileData();
            this.updateProfileDisplay();
        }, 1000);
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se estamos na página de perfil
    if (document.querySelector('.main-profile')) {
        window.profileSyncManager = new ProfileSyncManager();
        console.log('Sincronização de perfil inicializada');
    }
});

// Função global para atualização manual
window.updateProfileField = function(field, value) {
    if (window.profileSyncManager) {
        window.profileSyncManager.updateProfileField(field, value);
    }
};
