const VEICULOS = [
  { id: 'caminhao', nome: 'Camião', url_icone: 'https://cdn-icons-png.flaticon.com/512/3448/3448609.png' },
  { id: 'automovel', nome: 'Automóvel', url_icone: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png' },
  { id: 'autocarro', nome: 'Autocarro', url_icone: 'https://cdn-icons-png.flaticon.com/512/2833/2833407.png' },
  { id: 'motociclo', nome: 'Motociclo', url_icone: 'https://cdn-icons-png.flaticon.com/512/2972/2972458.png' },
  { id: 'comboio', nome: 'Comboio', url_icone: 'https://cdn-icons-png.flaticon.com/512/1168/1168041.png' },
  { id: 'metro', nome: 'Metro', url_icone: 'https://cdn-icons-png.flaticon.com/512/741/741467.png' },
  { id: 'eletrico', nome: 'Elétrico', url_icone: 'https://cdn-icons-png.flaticon.com/512/3097/3097149.png' },
  { id: 'bicicleta', nome: 'Bicicleta', url_icone: 'https://cdn-icons-png.flaticon.com/512/171/171244.png' },
  { id: 'trator', nome: 'Trator', url_icone: 'https://cdn-icons-png.flaticon.com/512/868/868578.png' },
  { id: 'blindado', nome: 'Blindado Militar', url_icone: 'https://cdn-icons-png.flaticon.com/512/1999/1999831.png' },
  { id: 'carro_7', nome: 'Carros 7', url_icone: 'https://cdn-icons-png.flaticon.com/512/5814/5814144.png' } 
];

document.addEventListener('DOMContentLoaded', () => {
    const grade = document.getElementById('grade-veiculos');
    if (!grade) return;

    const veiculoSelecionadoId = localStorage.getItem('veiculo_selecionado');

    VEICULOS.forEach(veiculo => {
        const card = document.createElement('div');
        card.className = 'veiculo-card';
        if (veiculo.id === veiculoSelecionadoId) {
            card.classList.add('selecionado');
        }
        card.dataset.id = veiculo.id;

        card.innerHTML = `
            <img src="${veiculo.url_icone}" alt="${veiculo.nome}" class="veiculo-icone">
            <div class="veiculo-nome">${veiculo.nome}</div>
        `;

        card.addEventListener('click', () => {
            // Salva a escolha no localStorage
            localStorage.setItem('veiculo_selecionado', veiculo.id);
            
            // Atualiza a classe 'selecionado' visualmente
            document.querySelectorAll('.veiculo-card').forEach(c => c.classList.remove('selecionado'));
            card.classList.add('selecionado');

            // Redireciona para o mapa após um breve delay para o usuário ver a seleção
            setTimeout(() => {
                window.location.href = 'mapa.html';
            }, 300);
        });

        grade.appendChild(card);
    });
});

