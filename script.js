// ── Referências ──
const botao = document.getElementById('add-button');
const valorAdd = document.getElementById('item-input');
const lista = document.getElementById('lista-mercado');
const listaPegados = document.getElementById('lista-pegados');
const badgePreciso = document.getElementById('badge-preciso');
const badgePegados = document.getElementById('badge-pegados');
const emptyPreciso = document.getElementById('empty-preciso');
const emptyPegados = document.getElementById('empty-pegados');
const limparBtn = document.getElementById('limpar-btn');
const inputHint = document.getElementById('input-hint');
const summaryText = document.getElementById('summary-text');
const STORAGE_KEY = 'lista-compras-itens';

// ── Contadores ──
let totalPreciso = 0;
let totalPegados = 0;

// ── Atualizar badges e estados vazios ──
function atualizarUI() {
    const totalItens = totalPreciso + totalPegados;

    badgePreciso.textContent = totalPreciso;
    badgePreciso.setAttribute('aria-label', `${totalPreciso} ${totalPreciso === 1 ? 'item' : 'itens'}`);
    animateBadge(badgePreciso);

    badgePegados.textContent = totalPegados;
    badgePegados.setAttribute('aria-label', `${totalPegados} ${totalPegados === 1 ? 'item' : 'itens'}`);
    animateBadge(badgePegados);

    emptyPreciso.hidden = totalPreciso > 0;
    emptyPegados.hidden = totalPegados > 0;
    limparBtn.hidden = totalPegados === 0;
    summaryText.textContent = `Voce tem ${totalItens} ${totalItens === 1 ? 'item' : 'itens'} no total.`;
}

function animateBadge(badge) {
    badge.classList.remove('bump');
    void badge.offsetWidth; // reflow para reiniciar animação
    badge.classList.add('bump');
}

function coletarItens(seletorLista) {
    return Array.from(seletorLista.querySelectorAll('.item-name')).map((item) => item.textContent);
}

function salvarItens() {
    const dados = {
        preciso: coletarItens(lista),
        pegados: coletarItens(listaPegados),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}

function carregarItens() {
    const dadosSalvos = localStorage.getItem(STORAGE_KEY);

    if (!dadosSalvos) return;

    try {
        const dados = JSON.parse(dadosSalvos);
        const itensPreciso = Array.isArray(dados.preciso) ? dados.preciso : [];
        const itensPegados = Array.isArray(dados.pegados) ? dados.pegados : [];

        itensPreciso.forEach((texto) => {
            lista.appendChild(criarItemLista(texto, false));
        });

        itensPegados.forEach((texto) => {
            listaPegados.appendChild(criarItemLista(texto, true));
        });

        totalPreciso = itensPreciso.length;
        totalPegados = itensPegados.length;
    } catch {
        localStorage.removeItem(STORAGE_KEY);
    }
}

// ── Adicionar item ──
function adicionarItem() {
    const texto = valorAdd.value.trim();

    if (!texto) {
        inputHint.textContent = '⚠ Digite um item antes de adicionar.';
        valorAdd.focus();
        return;
    }

    inputHint.textContent = '';

    const li = criarItemLista(texto, false);
    lista.appendChild(li);

    totalPreciso++;
    atualizarUI();
    salvarItens();

    valorAdd.value = '';
    valorAdd.focus();
}

// ── Criar elemento <li> ──
function criarItemLista(texto, jaPegado) {
    const li = document.createElement('li');
    li.classList.add('item');
    if (jaPegado) li.classList.add('item--done');

    // Nome
    const span = document.createElement('span');
    span.classList.add('item-name');
    span.textContent = texto;

    // Ações
    const acoes = document.createElement('div');
    acoes.classList.add('item-actions');

    if (!jaPegado) {
        // Botão: Pegar ✅
        const btnPegar = document.createElement('button');
        btnPegar.classList.add('btn-pegar');
        btnPegar.setAttribute('aria-label', `Marcar "${texto}" como pego`);
        btnPegar.innerHTML = '✅ Peguei';
        btnPegar.onclick = () => moverParaPegados(li, texto);
        acoes.appendChild(btnPegar);
    } else {
        // Botão: Devolver 🔄
        const btnDevolver = document.createElement('button');
        btnDevolver.classList.add('btn-devolver');
        btnDevolver.setAttribute('aria-label', `Devolver "${texto}" para a lista`);
        btnDevolver.innerHTML = '↩ Devolver';
        btnDevolver.onclick = () => moverParaPreciso(li, texto);
        acoes.appendChild(btnDevolver);
    }

    // Botão: Remover 🗑
    const btnRemover = document.createElement('button');
    btnRemover.classList.add('btn-remover');
    btnRemover.setAttribute('aria-label', `Remover "${texto}" da lista`);
    btnRemover.innerHTML = '✕';
    btnRemover.onclick = () => removerItem(li, jaPegado);
    acoes.appendChild(btnRemover);

    li.appendChild(span);
    li.appendChild(acoes);

    return li;
}

// ── Mover para "Já Peguei" ──
function moverParaPegados(li, texto) {
    removerComAnimacao(li, () => {
        totalPreciso--;
        const liNovo = criarItemLista(texto, true);
        listaPegados.appendChild(liNovo);
        totalPegados++;
        atualizarUI();
        salvarItens();
    });
}

// ── Mover de volta para "Preciso Pegar" ──
function moverParaPreciso(li, texto) {
    removerComAnimacao(li, () => {
        totalPegados--;
        const liNovo = criarItemLista(texto, false);
        lista.appendChild(liNovo);
        totalPreciso++;
        atualizarUI();
        salvarItens();
    });
}

// ── Remover item ──
function removerItem(li, jaPegado) {
    removerComAnimacao(li, () => {
        if (jaPegado) totalPegados--;
        else          totalPreciso--;
        atualizarUI();
        salvarItens();
    });
}

// ── Animação de saída ──
function removerComAnimacao(li, callback) {
    li.classList.add('removing');
    li.addEventListener('animationend', () => {
        li.remove();
        callback();
    }, { once: true });
}

// ── Limpar todos os itens pegados ──
limparBtn.addEventListener('click', () => {
    const itens = listaPegados.querySelectorAll('.item');
    let itensRestantes = itens.length;

    if (itensRestantes === 0) return;

    itens.forEach(li => {
        li.classList.add('removing');
        li.addEventListener('animationend', () => {
            li.remove();
            itensRestantes--;
            if (itensRestantes === 0) salvarItens();
        }, { once: true });
    });
    totalPegados = 0;
    atualizarUI();
});

// ── Eventos ──
botao.addEventListener('click', adicionarItem);

valorAdd.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') adicionarItem();
});

valorAdd.addEventListener('input', () => {
    if (valorAdd.value.trim()) inputHint.textContent = '';
});

// ── Init ──
carregarItens();
atualizarUI();
