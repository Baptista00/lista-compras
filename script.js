const botao = document.getElementById('add-button');
const valorAdd = document.getElementById('item-input');
const lista = document.getElementById('lista-mercado');

botao.addEventListener('click', adicionarItem);

function adicionarItem() {

    const li = document.createElement('li');
    li.classList.add('item');

    const span = document.createElement('span');
    span.textContent = valorAdd.value;

    const botaoPeguei = document.createElement('button');
    botaoPeguei.textContent = 'Já peguei';
    botaoPeguei.classList.add('ja-peguei-button');

    li.appendChild(span);
    li.appendChild(botaoPeguei);

    lista.appendChild(li);

    valorAdd.value = '';
}