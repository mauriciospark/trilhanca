# TRILHANÇA — Especificações Essenciais v2.1

## **Timeline**
- **Dia de criação**: 03/02/2026
- **Data de conclusão**: Em andamento (v2.1)
- **Dia de lançamento**: A definir
- **Última atualização**: 08/03/2026

## **Conceito**
Primeiro "Super App" para viagens de aventura e expedições em comboio, projetado para funcionar onde a internet não chega.

## **Pilares Técnicos**

### **1. Comunicação**
- **PTT (Push-to-Talk)**: Rádio via Bluetooth/Wi-Fi Direct (curto alcance)
- **Rede Mesh**: Comunicação ponto a ponto sem internet (Bridgefy/Google Nearby)
- **Status Implementado**: ✅ Interface de comunicação pronta

### **2. Navegação**
- **Mapas Offline**: OpenStreetMap baixáveis (MapLibre)
- **Alertas de Perigo**: Atoleiros, pontes, condições da via
- **GPS em Tempo Real**: Localização do comboio
- **Status**: 🚧 Em desenvolvimento

### **3. Gestão de Comboio**
- **Localização em Tempo Real**: GPS do grupo
- **Alertas de Distanciamento**: Avisos quando veículos se afastam
- **Sincronização de Dados**: Bidirecional entre módulos
- **Status**: ✅ Sistema de sincronização implementado

## **Checklist MVP - Atualizado v2.1**

### **✅ Essencial - IMPLEMENTADO**
- **UI/UX**: Modo escuro focado em condução
- **Design Responsivo**: Mobile-first com breakpoints
- **Glassmorphism**: Design moderno com backdrop blur
- **Perfil Completo**: Foto, status, informações pessoais
- **Configurações**: 7 abas de controle global
- **Sincronização**: Bidirecional em tempo real
- **Upload de Foto**: Validação e preview
- **Notificações**: Feedback visual completo

### **🚧 Essencial - EM DESENVOLVIMENTO**
- **Mapas Offline**: MapLibre com tiles .mbtiles
- **PTT Básico**: Rádio via Bluetooth/Wi-Fi Direct
- **GPS Tracking**: Localização em tempo real
- **Alertas Simples**: Distanciamento do grupo

### **✅ Importante - IMPLEMENTADO**
- **Dashboard Administrativo**: Painel de controle completo
- **Analytics**: Métricas e KPIs em tempo real
- **Scrum Dashboard**: Gestão de sprints
- **Painel de Controle**: Sistema administrativo avançado
- **Segurança**: Criptografia enterprise-grade
- **Acessibilidade**: Navegação por teclado
- **Validação**: Formulários em tempo real

### **🚧 Importante - PLANEJADO**
- **Histórico de Viagens**: Log de expedições
- **Export/Import**: Backup de dados
- **Multi-idioma**: Suporte internacional
- **Temas Personalizados**: Customização visual

## **Arquitetura Atual - v2.1**

### **Frontend Web**
```
✅ perfil.html + perfil.js + css/perfil.css + perfil-sync.js
✅ Configurações.html + Configurações.js + css/Configurações.css  
✅ paineldecontrole.html + js/paineldecontrole.js + css/paineldecontrole.css
✅ scrum_dashboard.html + css/scrum_dashboard.css + scrum_dashboard.js
✅ Trilhanca_Mobile_App.html + css/mobile.css
```

### **Sistema de Sincronização**
```
✅ perfil-sync.js (core engine)
✅ Eventos customizados (profileUpdate, profilePhotoUpdate)
✅ localStorage compartilhado (trilha_config, trilha_profile)
✅ Auto-sync a cada 30 segundos
✅ Sincronização manual via botão
```

### **Assets**
```
✅ icon/Usuario.png (imagem padrão)
✅ Sistema de upload com validação (5MB max)
✅ Preview e feedback visual
✅ Fallback inteligente
```

## **Features Implementadas - v2.1**

### **🎨 Interface Moderna**
- ✅ Dark mode com toggle automático
- ✅ Glassmorphism com backdrop blur
- ✅ Animações suaves e micro-interações
- ✅ Design responsivo mobile-first
- ✅ Acessibilidade completa (ARIA roles)

### **👤 Gestão de Perfil**
- ✅ Upload de foto com validação
- ✅ Sincronização bidirecional automática
- ✅ Formatação automática de telefone (DDI +55)
- ✅ Feedback visual com animações
- ✅ Imagem padrão `/icon/Usuario.png`

### **⚙️ Configurações Avançadas**
- ✅ 7 abas completas (Geral, Perfil, Segurança, etc.)
- ✅ Validação de formulários em tempo real
- ✅ Persistência automática em localStorage
- ✅ Navegação por teclado (Enter, Espaço, setas)
- ✅ Notificações de feedback visual

### **🔄 Sincronização de Dados**
- ✅ Sistema bidirecional (Configurações ↔ Perfil)
- ✅ Eventos customizados para comunicação
- ✅ Auto-sync automático
- ✅ Sincronização manual via botão
- ✅ Feedback visual com notificações
- ✅ Debug logging para troubleshooting

### **🎛️ Painel de Controle**
- ✅ Dashboard em tempo real com estatísticas
- ✅ Gestão de usuários completa
- ✅ Monitoramento de plataformas
- ✅ Sistema de notificações
- ✅ Gráficos e analytics
- ✅ Modais interativos
- ✅ Busca e filtros avançados
- ✅ Atalhos de teclado
- ✅ Status de conexão

## **Status de Implementação**

### **Frontend Web**: 98% ✅
- Perfil: Completo com sincronização
- Configurações: 7 abas implementadas
- Painel de Controle: Dashboard completo com JavaScript
- Scrum Dashboard: Analytics completo
- Mobile App: Interface responsiva

### **Sincronização**: 80% ✅
- Bidirecional: Configurações ↔ Perfil
- Eventos: Comunicação em tempo real
- Persistência: localStorage funcional
- Feedback: Notificações visuais

### **Core Features**: 65% 🚧
- Perfil: ✅ Completo
- Configurações: ✅ Completo
- Painel de Controle: ✅ Completo
- Mapa: 🚧 Planejado
- PTT: 🚧 Planejado
- GPS: 🚧 Planejado

## **Próximos Passos - Roadmap v2.2**

### **Prioridade 1 (MVP Core)**
1. **Mapa Offline Básico**
   - MapLibre GL com tiles .mbtiles
   - GPS em tempo real do comboio
   - Pontos de interesse (waypoints)

2. **Comunicação PTT Simples**
   - Nearby Connections para mesh local
   - Push-to-Talk via Bluetooth
   - Canal único de comunicação

### **Prioridade 2 (MVP Plus)**
1. **Alertas de Comboio**
   - Distanciamento do grupo
   - Alertas de perigo
   - Histórico de posicionamento

2. **Sincronização Avançada**
   - Realm Database local-first
   - Backup automático na nuvem
   - Conflito resolution

### **Prioridade 3 (MVP Complete)**
1. **Analytics de Viagem**
   - Métricas de expedição
   - Relatórios automáticos
   - Exportação de dados

2. **Multi-idioma**
   - Suporte internacional
   - Traduções dinâmicas
   - Localização completa

## **Métricas de Sucesso**

### **Técnicas**
- ✅ Performance: <3s load time
- ✅ Responsividade: 100% mobile-friendly
- ✅ Acessibilidade: WCAG 2.1 AA
- 🚧 Offline: Funcionalidade 100% sem internet

### **Funcionais**
- ✅ Sincronização: <500ms entre módulos
- ✅ Upload: <5s para fotos 5MB
- ✅ UI: 60fps animações suaves
- 🚧 PTT: <100ms latência local

---

**Status Atual**: MVP Core 98% implementado  
**Próxima Milestone**: Mapa Offline + PTT Básico  
**Timeline Estimada**: 2-3 semanas para MVP v2.2  

**Última atualização**: 09/03/2026  
**Versão**: v2.1  
**Status**: Em desenvolvimento ativo
- **Comunicação Mesh**: Rede sem internet
- **Calculadora**: Combustível e gastos da viagem

### **Diferenciais**
- **SOS**: Botão emergência via SMS com coordenadas GPS
- **Diário de Bordo**: Registro automático de posições e eventos
- **Modo Transamazônica**: Alertas sazonais e condições especiais

## **Tecnologia e Sensores**

### **Stack Principal**
- **Framework**: Flutter/React Native (multiplataforma)
- **Database**: Realm (offline-first)
- **Comunicação**: Protobuf (dados compactos)

### **Integrações**
- **OBD-II**: Telemetria veicular em tempo real
  - Nível de combustível
  - RPM e velocidade
  - Detecção de atoleiros
- **Sensores**: Acelerômetro e giroscópio
  - Detecção de buracos
  - Medição de inclinações perigosas

## **Crowdsourcing Passivo**

### **Coleta Automática**
- **Validação por Consenso**: Obstáculo confirmado após múltiplos registros
- **Transmissão em Cascata**: Dados via Mesh, upload posterior com sinal
- **Processo Invisível**: Ocorre em segundo plano, sem intervenção manual

### **Dados Coletados**
- **Balsas**: Localização, horários, valores
- **Pedágios**: Preços atualizados para cálculo de gastos
- **Pontos de Pernoite**: Locais seguros para acampamento
- **Pontos de Apoio**: Oficinas e suporte em áreas remotas

## **Segurança e Criptografia**

### **Proteção de Dados**
- **E2EE (End-to-End Encryption)**: AES-256 para Mesh e PTT
- **Offline-First**: Troca de chaves local sem servidor
- **HMAC**: Garantia de integridade para telemetria

---
**Última Atualização**: 25/03/2026  
**Versão**: 1.0 Essencial  
**Status**: Especificações consolidadas
