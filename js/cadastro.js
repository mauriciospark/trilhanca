// Sistema de Cadastro e Login - Trilhança Mobile
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.googleClient = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initGoogleAuth();
        this.checkExistingSession();
    }

    setupEventListeners() {
        // Toggle entre login e registro
        document.getElementById('show-register').addEventListener('click', () => {
            this.showSection('register');
        });

        document.getElementById('show-login').addEventListener('click', () => {
            this.showSection('login');
        });

        // Forms
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin(e.target);
        });

        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister(e.target);
        });

        // Google auth
        document.getElementById('google-login').addEventListener('click', () => {
            this.handleGoogleAuth('login');
        });

        document.getElementById('google-register').addEventListener('click', () => {
            this.handleGoogleAuth('register');
        });

        // Toggle password visibility
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => {
                this.togglePasswordVisibility(btn);
            });
        });

        // Modals
        document.getElementById('close-success').addEventListener('click', () => {
            this.hideModal('success-modal');
        });

        document.getElementById('close-error').addEventListener('click', () => {
            this.hideModal('error-modal');
        });

        // Forgot password
        document.querySelector('.forgot-password').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleForgotPassword();
        });

        // Terms and privacy
        document.querySelector('.terms-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showTerms();
        });

        document.querySelector('.privacy-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showPrivacy();
        });
    }

    showSection(section) {
        const loginSection = document.getElementById('login-section');
        const registerSection = document.getElementById('register-section');

        if (section === 'register') {
            loginSection.classList.add('hidden');
            registerSection.classList.remove('hidden');
        } else {
            registerSection.classList.add('hidden');
            loginSection.classList.remove('hidden');
        }
    }

    togglePasswordVisibility(button) {
        const targetId = button.dataset.target;
        const input = document.getElementById(targetId);
        const icon = button.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    async initGoogleAuth() {
        try {
            // Aguardar o Google Sign-In script carregar
            if (typeof google !== 'undefined' && google.accounts) {
                await this.initializeGoogleClient();
            } else {
                // Se não carregou, tentar novamente após um delay
                setTimeout(() => this.initGoogleAuth(), 1000);
            }
        } catch (error) {
            console.error('Erro ao inicializar Google Auth:', error);
        }
    }

    async initializeGoogleClient() {
        try {
            this.googleClient = await google.accounts.oauth2.initTokenClient({
                client_id: 'SEU_CLIENT_ID_GOOGLE.apps.googleusercontent.com', // Substitua com seu Client ID
                scope: 'email profile openid',
                callback: (response) => {
                    if (response.access_token) {
                        this.handleGoogleSuccess(response, 'login');
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao inicializar cliente Google:', error);
        }
    }

    handleGoogleAuth(type) {
        if (!this.googleClient) {
            this.showError('Autenticação Google não está disponível no momento');
            return;
        }

        this.showLoading(true);
        
        try {
            this.googleClient.requestAccessToken();
        } catch (error) {
            this.showLoading(false);
            this.showError('Erro ao autenticar com Google');
        }
    }

    handleGoogleSuccess(response, type) {
        this.showLoading(false);
        
        // Decodificar o token JWT para obter informações do usuário
        const userInfo = this.decodeJWT(response.access_token);
        
        if (type === 'register') {
            // Se for registro, verificar se usuário já existe
            this.checkUserExists(userInfo.email).then(exists => {
                if (exists) {
                    this.showError('Este e-mail já está cadastrado. Faça login.');
                    this.showSection('login');
                } else {
                    // Criar conta com dados do Google
                    this.createAccountWithGoogle(userInfo);
                }
            });
        } else {
            // Login normal
            this.loginWithGoogle(userInfo);
        }
    }

    decodeJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Erro ao decodificar JWT:', error);
            return null;
        }
    }

    async handleLogin(form) {
        const formData = new FormData(form);
        const loginData = {
            email: formData.get('email'),
            password: formData.get('password'),
            remember: formData.get('remember') === 'on'
        };

        this.showLoading(true);

        try {
            // Simular chamada API
            const response = await this.mockAPIRequest('/auth/login', loginData);
            
            if (response.success) {
                this.currentUser = response.user;
                this.saveSession(response.user, response.token, loginData.remember);
                this.showSuccess('Login realizado com sucesso!');
                
                // Redirecionar para o mapa
                setTimeout(() => {
                    window.location.href = './mapa.html';
                }, 1500);
            } else {
                this.showError(response.message || 'E-mail ou senha incorretos');
            }
        } catch (error) {
            this.showError('Erro ao fazer login. Tente novamente.');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister(form) {
        const formData = new FormData(form);
        const registerData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            password: formData.get('password'),
            confirm: formData.get('confirm'),
            terms: formData.get('terms') === 'on'
        };

        // Validações
        if (!this.validateRegister(registerData)) {
            return;
        }

        this.showLoading(true);

        try {
            // Simular chamada API
            const response = await this.mockAPIRequest('/auth/register', registerData);
            
            if (response.success) {
                this.showSuccess('Conta criada com sucesso!');
                
                // Limpar formulário
                form.reset();
                
                // Redirecionar para login
                setTimeout(() => {
                    this.showSection('login');
                }, 2000);
            } else {
                this.showError(response.message || 'Erro ao criar conta');
            }
        } catch (error) {
            this.showError('Erro ao criar conta. Tente novamente.');
        } finally {
            this.showLoading(false);
        }
    }

    validateRegister(data) {
        // Validação de senha
        if (data.password.length < 6) {
            this.showError('A senha deve ter pelo menos 6 caracteres');
            return false;
        }

        if (data.password !== data.confirm) {
            this.showError('As senhas não coincidem');
            return false;
        }

        // Validação de e-mail
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            this.showError('E-mail inválido');
            return false;
        }

        // Validação de telefone
        const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
        if (!phoneRegex.test(data.phone)) {
            this.showError('Telefone inválido. Use o formato (11) 98765-4321');
            return false;
        }

        // Validação de termos
        if (!data.terms) {
            this.showError('Você deve aceitar os termos de uso');
            return false;
        }

        return true;
    }

    async createAccountWithGoogle(userInfo) {
        const googleData = {
            name: userInfo.name,
            email: userInfo.email,
            avatar: userInfo.picture,
            provider: 'google',
            googleId: userInfo.sub
        };

        try {
            const response = await this.mockAPIRequest('/auth/google-register', googleData);
            
            if (response.success) {
                this.currentUser = response.user;
                this.saveSession(response.user, response.token, true);
                this.showSuccess('Conta criada com Google com sucesso!');
                
                setTimeout(() => {
                    window.location.href = './mapa.html';
                }, 1500);
            } else {
                this.showError(response.message || 'Erro ao criar conta com Google');
            }
        } catch (error) {
            this.showError('Erro ao criar conta com Google');
        }
    }

    loginWithGoogle(userInfo) {
        this.currentUser = userInfo;
        this.saveSession(userInfo, 'google_token_' + Date.now(), true);
        this.showSuccess('Login com Google realizado com sucesso!');
        
        setTimeout(() => {
            window.location.href = './mapa.html';
        }, 1500);
    }

    async checkUserExists(email) {
        try {
            const response = await this.mockAPIRequest('/auth/check-email', { email });
            return response.exists;
        } catch (error) {
            console.error('Erro ao verificar e-mail:', error);
            return false;
        }
    }

    handleForgotPassword() {
        const email = prompt('Digite seu e-mail para recuperação de senha:');
        if (email) {
            this.showLoading(true);
            
            // Simular envio de e-mail
            setTimeout(() => {
                this.showLoading(false);
                this.showSuccess('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
            }, 2000);
        }
    }

    showTerms() {
        this.showModal('terms-modal', `
            <h2>Termos de Uso</h2>
            <div style="text-align: left; max-height: 300px; overflow-y: auto;">
                <h3>1. Uso da Aplicação</h3>
                <p>Ao usar o aplicativo Trilhança, você concorda em utilizar a plataforma para fins de navegação e rastreamento de rotas.</p>
                
                <h3>2. Responsabilidades</h3>
                <p>Você é responsável por manter seus dados atualizados e utilizar a aplicação de acordo com as leis locais.</p>
                
                <h3>3. Privacidade</h3>
                <p>Seus dados serão tratados com confidencialidade e não serão compartilhados sem seu consentimento.</p>
                
                <h3>4. Serviço</h3>
                <p>O serviço é fornecido "como está" e pode sofrer alterações ou interrupções.</p>
            </div>
        `);
    }

    showPrivacy() {
        this.showModal('privacy-modal', `
            <h2>Política de Privacidade</h2>
            <div style="text-align: left; max-height: 300px; overflow-y: auto;">
                <h3>Coleta de Dados</h3>
                <p>Coletamos apenas informações necessárias para o funcionamento do aplicativo:</p>
                <ul>
                    <li>Localização GPS (com sua permissão)</li>
                    <li>Dados de perfil (nome, e-mail)</li>
                    <li>Informações de uso do aplicativo</li>
                </ul>
                
                <h3>Uso dos Dados</h3>
                <p>Seus dados são usados para:</p>
                <ul>
                    <li>Fornecer funcionalidades do aplicativo</li>
                    <li>Melhorar nossos serviços</li>
                    <li>Comunicação sobre atualizações</li>
                </ul>
                
                <h3>Compartilhamento</h3>
                <p>Não vendemos nem compartilhamos seus dados pessoais com terceiros.</p>
                
                <h3>Segurança</h3>
                <p>Utilizamos criptografia e medidas de segurança para proteger suas informações.</p>
            </div>
        `);
    }

    saveSession(user, token, remember) {
        const sessionData = {
            user: user,
            token: token,
            loginTime: new Date().toISOString()
        };

        if (remember) {
            localStorage.setItem('trilhancas_session', JSON.stringify(sessionData));
        } else {
            sessionStorage.setItem('trilhancas_session', JSON.stringify(sessionData));
        }
    }

    checkExistingSession() {
        try {
            const sessionData = localStorage.getItem('trilhancas_session') || 
                             sessionStorage.getItem('trilhancas_session');
            
            if (sessionData) {
                const session = JSON.parse(sessionData);
                
                // Verificar se a sessão ainda é válida (24 horas)
                const loginTime = new Date(session.loginTime);
                const now = new Date();
                const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
                
                if (hoursDiff < 24) {
                    this.currentUser = session.user;
                    // Redirecionar para o mapa
                    window.location.href = './mapa.html';
                }
            }
        } catch (error) {
            console.error('Erro ao verificar sessão:', error);
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }

    showModal(modalId, content) {
        // Criar modal dinamicamente se não existir
        let modal = document.getElementById(modalId);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="authSystem.hideModal('${modalId}')">Fechar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        modal.classList.remove('hidden');
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    showSuccess(message) {
        document.getElementById('success-message').textContent = message;
        document.getElementById('success-modal').classList.remove('hidden');
    }

    showError(message) {
        document.getElementById('error-message').textContent = message;
        document.getElementById('error-modal').classList.remove('hidden');
    }

    // Mock API para desenvolvimento
    async mockAPIRequest(endpoint, data) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simular respostas da API
                if (endpoint === '/auth/login') {
                    if (data.email === 'teste@trilhanca.com' && data.password === '123456') {
                        resolve({
                            success: true,
                            user: {
                                id: 1,
                                name: 'Usuário Teste',
                                email: data.email,
                                avatar: null
                            },
                            token: 'mock_token_' + Date.now()
                        });
                    } else {
                        resolve({
                            success: false,
                            message: 'E-mail ou senha incorretos'
                        });
                    }
                } else if (endpoint === '/auth/register') {
                    resolve({
                        success: true,
                        user: {
                            id: Date.now(),
                            name: data.name,
                            email: data.email,
                            phone: data.phone,
                            avatar: null
                        },
                        token: 'mock_token_' + Date.now()
                    });
                } else if (endpoint === '/auth/check-email') {
                    resolve({
                        exists: data.email === 'jaexiste@trilhanca.com'
                    });
                } else {
                    resolve({ success: true });
                }
            }, 1500); // Simular delay de rede
        });
    }
}

// Inicializar o sistema quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
});

// Função global para o Google Sign-In callback
function handleCredentialResponse(response) {
    if (window.authSystem) {
        window.authSystem.handleGoogleSuccess(response, 'login');
    }
}
