const botao = document.getElementById('add-button');
const valorAdd = document.getElementById('item-input');
const quantityInput = document.getElementById('quantity-input');
const lista = document.getElementById('lista-mercado');
const listaPegados = document.getElementById('lista-pegados');
const badgePreciso = document.getElementById('badge-preciso');
const badgePegados = document.getElementById('badge-pegados');
const emptyPreciso = document.getElementById('empty-preciso');
const emptyPegados = document.getElementById('empty-pegados');
const limparBtn = document.getElementById('limpar-btn');
const inputHint = document.getElementById('input-hint');
const summaryText = document.getElementById('summary-text');
const insightPendentes = document.getElementById('insight-pendentes');
const insightPegos = document.getElementById('insight-pegos');
const insightTotal = document.getElementById('insight-total');
const STORAGE_KEY = 'lista-compras-itens';

let totalPreciso = 0;
let totalPegados = 0;

function pluralizar(valor, singular, plural) {
    return `${valor} ${valor === 1 ? singular : plural}`;
}

function normalizarQuantidade(valor) {
    const numero = Number.parseInt(valor, 10);

    if (Number.isNaN(numero)) return 1;

    return Math.min(99, Math.max(1, numero));
}

function dadosItem(li) {
    return {
        texto: li.querySelector('.item-name').textContent,
        quantidade: normalizarQuantidade(li.dataset.quantidade),
    };
}

function coletarItens(listaAlvo) {
    return Array.from(listaAlvo.querySelectorAll('.item')).map(dadosItem);
}

function salvarItens() {
    const dados = {
        preciso: coletarItens(lista),
        pegados: coletarItens(listaPegados),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}

function atualizarResumo() {
    const totalItens = totalPreciso + totalPegados;
    const totalUnidades = [...coletarItens(lista), ...coletarItens(listaPegados)]
        .reduce((soma, item) => soma + item.quantidade, 0);

    badgePreciso.textContent = totalPreciso;
    badgePreciso.setAttribute('aria-label', pluralizar(totalPreciso, 'item', 'itens'));
    animateBadge(badgePreciso);

    badgePegados.textContent = totalPegados;
    badgePegados.setAttribute('aria-label', pluralizar(totalPegados, 'item', 'itens'));
    animateBadge(badgePegados);

    insightPendentes.textContent = totalPreciso;
    insightPegos.textContent = totalPegados;
    insightTotal.textContent = totalUnidades;

    emptyPreciso.hidden = totalPreciso > 0;
    emptyPegados.hidden = totalPegados > 0;
    limparBtn.hidden = totalPegados === 0;
    summaryText.textContent = `Voce tem ${pluralizar(totalItens, 'item cadastrado', 'itens cadastrados')} e ${pluralizar(totalUnidades, 'unidade', 'unidades')} no total.`;
}

function atualizarQuantidadeVisual(li, quantidade) {
    const quantidadeNormalizada = normalizarQuantidade(quantidade);
    li.dataset.quantidade = quantidadeNormalizada;
    li.querySelector('.quantity-value').textContent = quantidadeNormalizada;
    li.querySelector('.quantity-badge').textContent = `x${quantidadeNormalizada}`;
}

function atualizarQuantidade(li, delta) {
    const quantidadeAtual = normalizarQuantidade(li.dataset.quantidade);
    const novaQuantidade = quantidadeAtual + delta;

    if (novaQuantidade < 1 || novaQuantidade > 99) return;

    atualizarQuantidadeVisual(li, novaQuantidade);
    salvarItens();
    atualizarResumo();
}

function animateBadge(badge) {
    badge.classList.remove('bump');
    void badge.offsetWidth;
    badge.classList.add('bump');
}

function criarBotaoAcao({ classe, label, texto, onClick }) {
    const botaoAcao = document.createElement('button');
    botaoAcao.type = 'button';
    botaoAcao.className = classe;
    botaoAcao.setAttribute('aria-label', label);
    botaoAcao.textContent = texto;
    botaoAcao.addEventListener('click', onClick);
    return botaoAcao;
}

function criarControleQuantidade(li, texto, quantidade) {
    const quantidadeWrap = document.createElement('div');
    quantidadeWrap.className = 'quantity-control';
    quantidadeWrap.setAttribute('aria-label', `Quantidade de ${texto}`);

    const menos = criarBotaoAcao({
        classe: 'quantity-stepper',
        label: `Diminuir quantidade de ${texto}`,
        texto: '−',
        onClick: () => atualizarQuantidade(li, -1),
    });

    const valor = document.createElement('span');
    valor.className = 'quantity-value';
    valor.textContent = quantidade;

    const mais = criarBotaoAcao({
        classe: 'quantity-stepper',
        label: `Aumentar quantidade de ${texto}`,
        texto: '+',
        onClick: () => atualizarQuantidade(li, 1),
    });

    quantidadeWrap.append(menos, valor, mais);
    return quantidadeWrap;
}

function criarItemLista(texto, quantidade, jaPegado) {
    const li = document.createElement('li');
    li.className = `item${jaPegado ? ' item--done' : ''}`;

    const content = document.createElement('div');
    content.className = 'item-content';

    const titleRow = document.createElement('div');
    titleRow.className = 'item-title-row';

    const nome = document.createElement('span');
    nome.className = 'item-name';
    nome.textContent = texto;

    const quantityBadge = document.createElement('span');
    quantityBadge.className = 'quantity-badge';

    titleRow.append(nome, quantityBadge);

    const meta = document.createElement('div');
    meta.className = 'item-meta';
    meta.appendChild(criarControleQuantidade(li, texto, quantidade));

    content.append(titleRow, meta);

    const acoes = document.createElement('div');
    acoes.className = 'item-actions';

    if (!jaPegado) {
        acoes.appendChild(criarBotaoAcao({
            classe: 'btn-pegar',
            label: `Marcar ${texto} como pego`,
            texto: 'Peguei',
            onClick: () => moverParaPegados(li),
        }));
    } else {
        acoes.appendChild(criarBotaoAcao({
            classe: 'btn-devolver',
            label: `Devolver ${texto} para a lista`,
            texto: 'Devolver',
            onClick: () => moverParaPreciso(li),
        }));
    }

    acoes.appendChild(criarBotaoAcao({
        classe: 'btn-remover',
        label: `Remover ${texto} da lista`,
        texto: '✕',
        onClick: () => removerItem(li, jaPegado),
    }));

    li.append(content, acoes);
    atualizarQuantidadeVisual(li, quantidade);
    return li;
}

function restaurarItem(item, jaPegado) {
    if (typeof item === 'string') {
        return criarItemLista(item, 1, jaPegado);
    }

    const texto = typeof item?.texto === 'string' ? item.texto.trim() : '';

    if (!texto) return null;

    return criarItemLista(texto, normalizarQuantidade(item.quantidade), jaPegado);
}

function carregarItens() {
    const dadosSalvos = localStorage.getItem(STORAGE_KEY);

    if (!dadosSalvos) return;

    try {
        const dados = JSON.parse(dadosSalvos);
        const itensPreciso = Array.isArray(dados.preciso) ? dados.preciso : [];
        const itensPegados = Array.isArray(dados.pegados) ? dados.pegados : [];

        itensPreciso.forEach((item) => {
            const li = restaurarItem(item, false);
            if (!li) return;
            lista.appendChild(li);
            totalPreciso++;
        });

        itensPegados.forEach((item) => {
            const li = restaurarItem(item, true);
            if (!li) return;
            listaPegados.appendChild(li);
            totalPegados++;
        });
    } catch {
        localStorage.removeItem(STORAGE_KEY);
    }
}

function adicionarItem() {
    const texto = valorAdd.value.trim();
    const quantidade = normalizarQuantidade(quantityInput.value);

    if (!texto) {
        inputHint.textContent = 'Digite um item antes de adicionar.';
        valorAdd.focus();
        return;
    }

    inputHint.textContent = '';

    lista.appendChild(criarItemLista(texto, quantidade, false));
    totalPreciso++;
    atualizarResumo();
    salvarItens();

    valorAdd.value = '';
    quantityInput.value = '1';
    valorAdd.focus();
}

function moverEntreListas(li, destino, origemConcluida) {
    const item = dadosItem(li);

    removerComAnimacao(li, () => {
        if (origemConcluida) {
            totalPegados--;
            totalPreciso++;
        } else {
            totalPreciso--;
            totalPegados++;
        }

        destino.appendChild(criarItemLista(item.texto, item.quantidade, !origemConcluida));
        atualizarResumo();
        salvarItens();
    });
}

function moverParaPegados(li) {
    moverEntreListas(li, listaPegados, false);
}

function moverParaPreciso(li) {
    moverEntreListas(li, lista, true);
}

function removerItem(li, jaPegado) {
    removerComAnimacao(li, () => {
        if (jaPegado) totalPegados--;
        else totalPreciso--;

        atualizarResumo();
        salvarItens();
    });
}

function removerComAnimacao(li, callback) {
    li.classList.add('removing');
    li.addEventListener('animationend', () => {
        li.remove();
        callback();
    }, { once: true });
}

limparBtn.addEventListener('click', () => {
    const itens = listaPegados.querySelectorAll('.item');
    let itensRestantes = itens.length;

    if (itensRestantes === 0) return;

    totalPegados = 0;
    atualizarResumo();

    itens.forEach((li) => {
        li.classList.add('removing');
        li.addEventListener('animationend', () => {
            li.remove();
            itensRestantes--;

            if (itensRestantes === 0) {
                salvarItens();
                atualizarResumo();
            }
        }, { once: true });
    });
});

botao.addEventListener('click', adicionarItem);

valorAdd.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') adicionarItem();
});

quantityInput.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') adicionarItem();
});

quantityInput.addEventListener('input', () => {
    quantityInput.value = String(normalizarQuantidade(quantityInput.value));
});

valorAdd.addEventListener('input', () => {
    if (valorAdd.value.trim()) inputHint.textContent = '';
});

carregarItens();
atualizarResumo();
