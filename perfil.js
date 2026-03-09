// TRILHANÇA - Perfil Modernizado com Relógio Inteligente
// Integração completa com sistema de Configurações

class TrilhancaProfile {
  constructor() {
    this.profileData = null;
    this.groupData = null;
    this.configData = null;
    this.watchData = {
      battery: 75,
      heartRate: 72,
      steps: 8432,
      altitude: 847,
      isConnected: true,
      isMeshActive: true
    };
    this.currentMode = 'ape'; // 'ape', 'car', 'moto'
    this.currentPage = 'perfil'; // Página atual para navegação
    
    this.init();
  }

  init() {
    this.loadProfileData();
    this.loadConfigData();
    this.loadGroupData();
    this.initializeNavigation();
    this.initializeWatchPanel();
    this.initializeEventListeners();
    this.startRealTimeUpdates();
    this.updateUI();
    this.setActiveNavigation();
    this.setupConfigSync();
  }

  loadProfileData() {
    try {
      // Carregar do localStorage (perfil tradicional)
      let perfilRaw = localStorage.getItem('perfil_usuario');
      if (perfilRaw) {
        this.profileData = JSON.parse(perfilRaw);
      }
      
      // Carregar das configurações (sistema unificado)
      const configRaw = localStorage.getItem('trilha_config');
      if (configRaw) {
        const config = JSON.parse(configRaw);
        // Merge dos dados das configurações com o perfil
        this.profileData = this.mergeProfileWithConfig(this.profileData, config);
      }
      
      // Se não existir nenhum dado, usar padrão
      if (!this.profileData) {
        this.profileData = this.getDefaultProfileData();
      }
      
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      this.profileData = this.getDefaultProfileData();
    }
  }

  loadConfigData() {
    try {
      const configRaw = localStorage.getItem('trilha_config');
      if (configRaw) {
        this.configData = JSON.parse(configRaw);
      } else {
        this.configData = this.getDefaultConfigData();
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      this.configData = this.getDefaultConfigData();
    }
  }

  loadGroupData() {
    try {
      const grupoRaw = localStorage.getItem('grupo_viagem');
      if (grupoRaw) {
        this.groupData = JSON.parse(grupoRaw);
      }
    } catch (error) {
      console.error('Erro ao carregar grupo:', error);
    }
  }

  initializeWatchPanel() {
    // Carregar modo atual do localStorage
    const vehicleType = localStorage.getItem('veiculo_selecionado') || 'ape';
    this.currentMode = vehicleType;
    
    // Sincronizar com mudanças de veículo
    document.addEventListener('vehicleChanged', (e) => {
      this.handleVehicleChange(e.detail);
    });
    
    // Sincronizar com mudanças de modo de transporte
    document.addEventListener('travelModeChanged', (e) => {
      this.handleTravelModeChange(e.detail);
    });
  }

  initializeEventListeners() {
    // Botões do relógio
    this.initWatchButtons();
    
    // Botões de ações rápidas
    this.initQuickActions();
    
    // Botões de compartilhamento
    this.initShareButtons();
    
    // Botões de avatar
    this.initAvatarActions();
  }

  initWatchButtons() {
    const watchPTT = document.getElementById('watch-ptt');
    const watchLight = document.getElementById('watch-light');
    const watchSOS = document.getElementById('watch-sos');
    const watchSync = document.getElementById('watch-sync');

    if (watchPTT) {
      watchPTT.addEventListener('click', () => this.togglePTT());
    }

    if (watchLight) {
      watchLight.addEventListener('click', () => this.toggleLight());
    }

    if (watchSOS) {
      watchSOS.addEventListener('click', () => this.activateSOS());
    }

    if (watchSync) {
      watchSync.addEventListener('click', () => this.syncWatch());
    }
  }

  initQuickActions() {
    const checkInBtn = document.getElementById('check-in-btn');
    const emergencyBtn = document.getElementById('emergency-btn');
    const shareLocationBtn = document.getElementById('share-location-btn');
    const syncDataBtn = document.getElementById('sync-data-btn');

    if (checkInBtn) {
      checkInBtn.addEventListener('click', () => this.performCheckIn());
    }

    if (emergencyBtn) {
      emergencyBtn.addEventListener('click', () => this.activateEmergency());
    }

    if (shareLocationBtn) {
      shareLocationBtn.addEventListener('click', () => this.shareLocation());
    }

    if (syncDataBtn) {
      syncDataBtn.addEventListener('click', () => this.syncAllData());
    }
  }

  initShareButtons() {
    const copyLinkBtn = document.getElementById('copy-link');
    const shareWhatsAppBtn = document.getElementById('share-whatsapp');
    const shareSMSBtn = document.getElementById('share-sms');

    if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', () => this.copyGroupLink());
    }

    if (shareWhatsAppBtn) {
      shareWhatsAppBtn.addEventListener('click', () => this.shareViaWhatsApp());
    }

    if (shareSMSBtn) {
      shareSMSBtn.addEventListener('click', () => this.shareViaSMS());
    }
  }

  initAvatarActions() {
    const changePhotoBtn = document.getElementById('change-photo');
    const syncWatchBtn = document.getElementById('sync-watch');

    if (changePhotoBtn) {
      changePhotoBtn.addEventListener('click', () => this.changePhoto());
    }

    if (syncWatchBtn) {
      syncWatchBtn.addEventListener('click', () => this.syncWatch());
    }
  }

  handleVehicleChange(detail) {
    this.currentMode = detail.vehicle;
    this.updateModeDisplay(detail.isWalking);
  }

  handleTravelModeChange(detail) {
    const isWalking = detail.mode === 'walking';
    this.updateModeDisplay(isWalking);
  }

  updateModeDisplay(isWalking) {
    const modeBadge = document.getElementById('mode-badge');
    const currentMode = document.getElementById('current-mode');

    if (modeBadge) {
      if (isWalking) {
        modeBadge.innerHTML = '<i class="fas fa-walking"></i> A Pé';
      } else {
        modeBadge.innerHTML = '<i class="fas fa-car"></i> Motorizado';
      }
    }

    if (currentMode) {
      const modeMap = {
        'ape': '🚶 A Pé',
        'moto-adventure': '🏍️ Moto',
        'sport': '🚗 Carro',
        'suv-urban': '🚙 SUV',
        'suv-offroad-1': '🚙 SUV Off-Road',
        'suv-offroad-2': '🚙 SUV Off-Road',
        'jeep-open': '🚙 Jeep',
        'pickup-4x4': '🚚 Caminhonete',
        'expedition': '🚐 Expedição'
      };
      currentMode.textContent = modeMap[this.currentMode] || '🚶 A Pé';
    }
  }

  togglePTT() {
    const watchPTT = document.getElementById('watch-ptt');
    watchPTT.classList.toggle('transmitting');
    
    if (watchPTT.classList.contains('transmitting')) {
      this.showNotification('🎤 PTT Ativado - Transmitindo...', 'success');
      // Simular transmissão
      setTimeout(() => {
        watchPTT.classList.remove('transmitting');
        this.showNotification('🎤 Transmissão finalizada', 'info');
      }, 3000);
    } else {
      this.showNotification('🎤 PTT Desativado', 'info');
    }
  }

  toggleLight() {
    const watchLight = document.getElementById('watch-light');
    watchLight.classList.toggle('active');
    
    if (watchLight.classList.contains('active')) {
      this.showNotification('💡 Lanterna do relógio ativada', 'warning');
      document.body.classList.add('night-mode');
    } else {
      this.showNotification('💡 Lanterna do relógio desativada', 'info');
      document.body.classList.remove('night-mode');
    }
  }

  activateSOS() {
    const watchSOS = document.getElementById('watch-sos');
    watchSOS.classList.add('active');
    
    this.showNotification('🚨 EMERGÊNCIA ATIVADA! 🚨', 'error');
    
    // Simular envio de SOS
    console.log('🚨 ENVIANDO SOS DO PERFIL...');
    console.log('Localização:', {
      latitude: -3.096576,
      longitude: -60.0342528,
      timestamp: new Date().toISOString()
    });
    
    // Feedback visual
    document.body.style.animation = 'pulse 0.5s ease 3';
    setTimeout(() => {
      document.body.style.animation = '';
      watchSOS.classList.remove('active');
    }, 1500);
    
    // Simular resposta
    setTimeout(() => {
      this.showNotification('🚁 SOS recebido pelo comboio!', 'success');
    }, 3000);
  }

  syncWatch() {
    const watchSync = document.getElementById('watch-sync');
    const syncWatchBtn = document.getElementById('sync-watch');
    
    // Adicionar animação de rotação
    [watchSync, syncWatchBtn].forEach(btn => {
      if (btn) btn.style.animation = 'spin 1s linear';
    });
    
    this.showNotification('🔄 Sincronizando relógio...', 'info');
    
    setTimeout(() => {
      [watchSync, syncWatchBtn].forEach(btn => {
        if (btn) btn.style.animation = '';
      });
      
      this.watchData.isConnected = true;
      this.updateWatchDisplay();
      this.showNotification('✅ Relógio sincronizado com sucesso!', 'success');
    }, 2000);
  }

  performCheckIn() {
    const now = new Date();
    const checkInTime = now.toLocaleString('pt-BR');
    
    // Atualizar no perfil
    if (this.profileData) {
      this.profileData.ultimoCheckin = checkInTime;
      localStorage.setItem('perfil_usuario', JSON.stringify(this.profileData));
      
      // Emitir evento de atualização do perfil
      document.dispatchEvent(new CustomEvent('perfilUpdated', {
        detail: { 
          type: 'checkin', 
          data: this.profileData,
          timestamp: now.toISOString()
        }
      }));
    }
    
    // Atualizar UI
    const checkInElement = document.getElementById('perfil-checkin');
    if (checkInElement) {
      checkInElement.textContent = checkInTime;
    }
    
    this.showNotification('✅ Check-in realizado com sucesso!', 'success');
  }

  activateEmergency() {
    this.showNotification('🚨 Modo de emergência ativado', 'error');
    
    // Simular envio de alerta para o grupo
    if (this.groupData && this.groupData.membros) {
      console.log('🚨 Alerta de emergência enviado para', this.groupData.membros.length, 'membros');
    }
    
    // Ativar SOS do relógio também
    this.activateSOS();
  }

  shareLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
          
          // Copiar para área de transferência
          navigator.clipboard.writeText(locationUrl).then(() => {
            this.showNotification('📍 Localização copiada para área de transferência', 'success');
          }).catch(() => {
            prompt('Copie sua localização:', locationUrl);
          });
        },
        (error) => {
          this.showNotification('❌ Não foi possível obter sua localização', 'error');
        }
      );
    } else {
      this.showNotification('❌ Geolocalização não suportada pelo navegador', 'error');
    }
  }

  syncAllData() {
    this.showNotification('🔄 Sincronizando todos os dados...', 'info');
    
    // Simular sincronização
    setTimeout(() => {
      this.showNotification('✅ Dados sincronizados com sucesso!', 'success');
    }, 3000);
  }

  copyGroupLink() {
    if (!this.groupData) {
      this.showNotification('❌ Nenhum grupo encontrado', 'error');
      return;
    }

    const base = location.href.split('?')[0];
    const encoded = this.b64urlEncode(JSON.stringify(this.groupData));
    const link = base.replace('perfil.html', 'cadastro_grupo.html') + '?grupo=' + encodeURIComponent(encoded);

    navigator.clipboard.writeText(link).then(() => {
      this.showNotification('🔗 Link do grupo copiado!', 'success');
    }).catch(() => {
      prompt('Copie o link do grupo:', link);
    });
  }

  shareViaWhatsApp() {
    if (!this.groupData) {
      this.showNotification('❌ Nenhum grupo encontrado', 'error');
      return;
    }

    const base = location.href.split('?')[0];
    const encoded = this.b64urlEncode(JSON.stringify(this.groupData));
    const link = base.replace('perfil.html', 'cadastro_grupo.html') + '?grupo=' + encodeURIComponent(encoded);
    
    const message = `Convite: ${this.groupData.nome || ''} • ${this.groupData.partida || ''} → ${this.groupData.destino || ''} • ${this.groupData.saida || ''} • Link: ${link}`;
    const url = 'https://wa.me/?text=' + encodeURIComponent(message);
    
    window.open(url, '_blank');
  }

  shareViaSMS() {
    if (!this.groupData) {
      this.showNotification('❌ Nenhum grupo encontrado', 'error');
      return;
    }

    const base = location.href.split('?')[0];
    const encoded = this.b64urlEncode(JSON.stringify(this.groupData));
    const link = base.replace('perfil.html', 'cadastro_grupo.html') + '?grupo=' + encodeURIComponent(encoded);
    
    const message = `Convite: ${this.groupData.nome || ''} • ${this.groupData.partida || ''} → ${this.groupData.destino || ''} • ${this.groupData.saida || ''} • Link: ${link}`;
    const url = 'sms:?body=' + encodeURIComponent(message);
    
    window.location.href = url;
  }

  changePhoto() {
    // Simular troca de foto
    this.showNotification('📷 Funcionalidade de troca de foto em desenvolvimento', 'info');
  }

  b64urlEncode(str) {
    const b64 = btoa(unescape(encodeURIComponent(str)));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  startRealTimeUpdates() {
    // Atualizar dados do relógio
    setInterval(() => {
      this.updateWatchData();
      this.updateWatchDisplay();
    }, 5000);

    // Atualizar status em tempo real
    setInterval(() => {
      this.updateRealTimeStatus();
    }, 10000);

    // Atualizar posição simulada
    setInterval(() => {
      this.updatePosition();
    }, 3000);
  }

  updateWatchData() {
    // Simular variação de dados
    this.watchData.battery = Math.max(0, this.watchData.battery - Math.random() * 0.5);
    this.watchData.heartRate = Math.floor(65 + Math.random() * 20);
    this.watchData.steps += Math.floor(Math.random() * 10);
    this.watchData.altitude = Math.floor(840 + Math.random() * 20);
    
    // Simular conexão
    this.watchData.isConnected = Math.random() > 0.1;
    this.watchData.isMeshActive = Math.random() > 0.05;
  }

  updateWatchDisplay() {
    // Atualizar bateria
    const batteryElement = document.getElementById('watch-battery');
    if (batteryElement) {
      batteryElement.textContent = `${Math.floor(this.watchData.battery)}%`;
      if (this.watchData.battery < 20) {
        batteryElement.style.color = '#dc3545';
      } else if (this.watchData.battery < 50) {
        batteryElement.style.color = '#ffc107';
      } else {
        batteryElement.style.color = '#28a745';
      }
    }

    // Atualizar frequência cardíaca
    const heartElement = document.getElementById('watch-heart');
    if (heartElement) {
      heartElement.textContent = `${this.watchData.heartRate} bpm`;
    }

    // Atualizar passos
    const stepsElement = document.getElementById('watch-steps');
    if (stepsElement) {
      stepsElement.textContent = this.watchData.steps.toLocaleString('pt-BR');
    }

    // Atualizar altitude
    const altitudeElement = document.getElementById('watch-altitude');
    if (altitudeElement) {
      altitudeElement.textContent = `${this.watchData.altitude}m`;
    }
  }

  updateRealTimeStatus() {
    // Atualizar indicadores de status
    const onlineDot = document.querySelector('.status-dot.online');
    const meshDot = document.querySelector('.status-dot.mesh');
    const gpsDot = document.querySelector('.status-dot.gps');

    if (onlineDot) {
      onlineDot.style.opacity = this.watchData.isConnected ? '1' : '0.3';
    }

    if (meshDot) {
      meshDot.style.opacity = this.watchData.isMeshActive ? '1' : '0.3';
    }

    if (gpsDot) {
      // Simular status GPS
      gpsDot.style.opacity = Math.random() > 0.1 ? '1' : '0.3';
    }
  }

  updatePosition() {
    // Simular atualização de posição
    const positionElement = document.getElementById('current-position');
    if (positionElement) {
      const lat = (-3.096576 + (Math.random() - 0.5) * 0.01).toFixed(6);
      const lng = (-60.0342528 + (Math.random() - 0.5) * 0.01).toFixed(6);
      positionElement.textContent = `${lat}, ${lng}`;
    }

    // Simular velocidade
    const speedElement = document.getElementById('current-speed');
    if (speedElement) {
      const speed = (Math.random() * 80).toFixed(1);
      speedElement.textContent = `${speed} km/h`;
    }

    // Simular distância hoje
    const distanceElement = document.getElementById('today-distance');
    if (distanceElement) {
      const distance = (Math.random() * 50 + 10).toFixed(1);
      distanceElement.textContent = `${distance} km`;
    }

    // Simular tempo ativo
    const timeElement = document.getElementById('active-time');
    if (timeElement) {
      const hours = Math.floor(Math.random() * 8 + 1);
      const minutes = Math.floor(Math.random() * 60);
      timeElement.textContent = `${hours}h ${minutes}m`;
    }
  }

  updateUI() {
    this.updateProfileUI();
    this.updateGroupUI();
    this.updateWatchDisplay();
    this.updateModeDisplay(this.currentMode === 'ape');
    
    // Emitir evento de atualização do perfil
    document.dispatchEvent(new CustomEvent('perfilUpdated', {
      detail: { 
        type: 'ui_update', 
        data: this.profileData,
        timestamp: new Date().toISOString()
      }
    }));
  }

  updateProfileUI() {
    if (!this.profileData) return;

    // Avatar
    const avatar = document.getElementById('perfil-foto');
    if (avatar && this.profileData.foto) {
      avatar.style.backgroundImage = `url(${this.profileData.foto})`;
    }

    // Informações básicas
    this.updateElement('perfil-nome', this.profileData.nome);
    this.updateElement('perfil-telefone', this.profileData.telefone);
    this.updateElement('perfil-email', this.profileData.email);

    // Veículo
    this.updateElement('perfil-veiculo', this.profileData.veiculoTipo);
    this.updateElement('perfil-autonomia', this.profileData.autonomiaKm);
    this.updateElement('perfil-consumo', this.profileData.consumoL100);

    // Saúde e segurança
    this.updateElement('perfil-sangue', this.profileData.sangue);
    this.updateElement('perfil-alergias', this.profileData.alergias);
    
    if (this.profileData.emergencia) {
      const emergency = (this.profileData.emergencia.nome || '') + ' · ' + (this.profileData.emergencia.telefone || '');
      this.updateElement('perfil-emergencia', emergency);
    }
    
    this.updateElement('perfil-papel', this.profileData.papel);
    this.updateElement('perfil-experiencia', this.profileData.experiencia);
    this.updateElement('perfil-checkin', this.profileData.ultimoCheckin);

    // Comunicação
    const coms = [];
    if (this.profileData.comunicacao) {
      if (this.profileData.comunicacao.px) coms.push('PX');
      if (this.profileData.comunicacao.starlink) coms.push('Starlink');
    }
    this.updateElement('perfil-comunicacao', coms.join(', ') || '—');
    this.updateElement('perfil-mapaso', this.profileData.mapasOffline);

    // Resgate
    const req = [];
    if (this.profileData.resgate) {
      if (this.profileData.resgate.guincho) req.push('Guincho');
      if (this.profileData.resgate.camburao) req.push('Camburão');
      if (this.profileData.resgate.ferramentas) req.push('Ferramentas');
    }
    this.updateElement('perfil-resgate', req.join(', ') || '—');

    // Veículos
    if (this.profileData.veiculos) {
      const keys = Object.keys(this.profileData.veiculos);
      if (keys.length) {
        const vehicle = this.profileData.veiculos[keys[0]];
        this.updateElement('perfil-placa', vehicle.placa || vehicle.tipo || '—');
        this.updateElement('perfil-odometro', vehicle.odometro || '—');
        this.updateElement('perfil-viagem-km', vehicle.viagemKm || '—');
      }
    }

    // Badges
    const roleBadge = document.getElementById('role-badge');
    if (roleBadge && this.profileData.papel) {
      const roleIcons = {
        'Líder': 'fa-user-shield',
        'Navegador': 'fa-compass',
        'Mecânico': 'fa-wrench',
        'Médico': 'fa-user-md',
        'Comunicador': 'fa-radio'
      };
      const icon = roleIcons[this.profileData.papel] || 'fa-user';
      roleBadge.innerHTML = `<i class="fas ${icon}"></i> ${this.profileData.papel}`;
    }
  }

  updateGroupUI() {
    if (!this.groupData) return;

    // Foto do grupo
    const groupCover = document.getElementById('grupo-foto');
    if (groupCover && this.groupData.foto) {
      groupCover.style.backgroundImage = `url(${this.groupData.foto})`;
    }

    // Informações básicas
    this.updateElement('grupo-nome', this.groupData.nome);
    this.updateElement('grupo-rota', `${this.groupData.partida || ''} → ${this.groupData.destino || ''}`);
    this.updateElement('grupo-datas', `${this.groupData.saida || ''} · ${this.groupData.chegada || ''}`);

    // Especificações
    this.updateElement('grupo-veiculo', this.groupData.veiculoAceito);
    this.updateElement('grupo-ritmo', this.groupData.ritmo);
    this.updateElement('grupo-limite', this.groupData.limite);
    this.updateElement('grupo-carona', this.groupData.carona);
    this.updateElement('grupo-encontro', this.groupData.pontoEncontro);
    this.updateElement('grupo-descricao', this.groupData.descricao);

    // Requisitos
    const reqs = [];
    if (this.groupData.requisitos) {
      if (this.groupData.requisitos.px) reqs.push('PX');
      if (this.groupData.requisitos.combustivel) reqs.push('Galão');
      if (this.groupData.requisitos.estepe) reqs.push('Estepe');
      if (this.groupData.requisitos.kit) reqs.push('Kit socorros');
    }
    this.updateElement('grupo-requisitos', reqs.join(', ') || '—');

    // Estatísticas
    this.updateElement('member-count', this.groupData.membros ? this.groupData.membros.length : 0);
    
    // Membros
    const membersContainer = document.getElementById('membros');
    if (membersContainer && this.groupData.membros) {
      membersContainer.innerHTML = '';
      this.groupData.membros.forEach(member => {
        const memberCard = document.createElement('div');
        memberCard.className = 'member';
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        if (member.photo) {
          avatar.style.backgroundImage = `url(${member.photo})`;
        }
        
        const name = document.createElement('div');
        name.textContent = member.name || '—';
        
        memberCard.appendChild(avatar);
        memberCard.appendChild(name);
        membersContainer.appendChild(memberCard);
      });
    }
  }

  updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value || '—';
    }
  }

  showNotification(message, type = 'info') {
    // Criar notificação temporária
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : '#007bff'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease-out;
      max-width: 300px;
      font-size: 0.9rem;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Adicionar CSS para animações
const profileCSS = document.createElement('style');
profileCSS.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }

  .watch-btn.transmitting {
    animation: pulse 1s infinite;
    background: #dc3545 !important;
    color: white !important;
    border-color: #dc3545 !important;
  }

  .watch-btn.active {
    background: rgba(40, 167, 69, 0.3) !important;
    border-color: rgba(40, 167, 69, 0.5) !important;
    color: #28a745 !important;
  }

  body.night-mode {
    filter: brightness(0.8) hue-rotate(20deg);
  }
`;
document.head.appendChild(profileCSS);

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  window.trilhancaProfile = new TrilhancaProfile();
});