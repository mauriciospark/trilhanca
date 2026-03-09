// TRILHANÇA - Progress Tracker Automático
// Sistema para calcular porcentagem real do projeto baseado nos arquivos existentes

class ProgressTracker {
    constructor() {
        this.weights = {
            enterprise: 45,    // Web App Enterprise
            mapa: 25,         // Mapa Offline
            ptt: 20,          // Comunicação PTT
            extras: 8,        // Funcionalidades Extras
            mobile: 2         // Mobile Native
        };
        
        this.files = {
            enterprise: [
                'perfil.html', 'css/perfil.css', 'perfil.js',
                'Configurações.html', 'css/Configurações.css', 'Configurações.js',
                'paineldecontrole.html', 'paineldecontrole.css',
                'scrum_dashboard.html', 'scrum_dashboard.css', 'scrum_dashboard.js'
            ],
            mapa: [
                'mapa.html', 'css/mapa.css', 'mapa.js'
            ],
            ptt: [
                'Comunicações.html', 'css/Comunicações.css', 'Comunicações.js'
            ],
            extras: [
                'cadastro_grupo.html', 'css/cadastro_grupo.css',
                'Transportes.html', 'Transportes.css', 'Transportes.js',
                'Obd.html', 'Obd.css', 'Obd.js'
            ],
            mobile: [
                // Arquivos mobile nativos (quando existirem)
            ]
        };
    }

    async checkFileExists(filePath) {
        try {
            const response = await fetch(filePath, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }

    async analyzeFileContent(filePath) {
        try {
            const response = await fetch(filePath);
            const content = await response.text();
            
            // Análise de completude baseada no conteúdo
            const indicators = {
                hasStructure: content.includes('<!DOCTYPE') || content.includes('class'),
                hasFunctionality: content.includes('function') || content.includes('const') || content.includes('let'),
                hasStyling: content.includes('background') || content.includes('color') || content.includes('padding'),
                hasInteractivity: content.includes('addEventListener') || content.includes('onclick') || content.includes('submit')
            };
            
            const score = Object.values(indicators).filter(Boolean).length;
            return Math.min(score / 4, 1); // Máximo 100%
        } catch {
            return 0;
        }
    }

    async calculateProgress() {
        let totalProgress = 0;
        const results = {};

        for (const [category, files] of Object.entries(this.files)) {
            let categoryProgress = 0;
            let fileCount = 0;

            for (const file of files) {
                if (await this.checkFileExists(file)) {
                    const contentScore = await this.analyzeFileContent(file);
                    categoryProgress += contentScore;
                    fileCount++;
                }
            }

            const categoryTotal = files.length;
            const finalProgress = fileCount > 0 ? (categoryProgress / categoryTotal) : 0;
            results[category] = {
                progress: Math.round(finalProgress * 100),
                weight: this.weights[category],
                contribution: Math.round(finalProgress * this.weights[category] * 10) / 10
            };

            totalProgress += results[category].contribution;
        }

        return {
            total: Math.round(totalProgress * 10) / 10,
            breakdown: results,
            timestamp: new Date().toLocaleDateString('pt-BR')
        };
    }

    generateProgressBar(percentage) {
        const totalChars = 100;
        const filledChars = Math.round(percentage);
        const emptyChars = totalChars - filledChars;
        
        return '█'.repeat(filledChars) + '░'.repeat(emptyChars) + ' ' + percentage + '%';
    }

    async updateProgressInFile() {
        const progress = await this.calculateProgress();
        const progressBar = this.generateProgressBar(progress.total);
        
        // Atualizar o arquivo Data.md com os novos valores
        const updateData = {
            percentage: progress.total,
            progressBar: progressBar,
            breakdown: progress.breakdown,
            timestamp: progress.timestamp
        };

        return updateData;
    }
}

// Função para uso no navegador
async function updateProjectProgress() {
    const tracker = new ProgressTracker();
    const progress = await tracker.updateProgressInFile();
    
    console.log('📊 Progresso do Projeto TRILHANÇA:');
    console.log(`Total: ${progress.percentage}%`);
    console.log(`Barra: ${progress.progressBar}`);
    console.log('Breakdown:', progress.breakdown);
    console.log(`Atualizado em: ${progress.timestamp}`);
    
    return progress;
}

// Exportar para uso
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProgressTracker, updateProjectProgress };
}
