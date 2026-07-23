# Lista de Compras

Aplicação web para organizar itens de mercado com uma interface responsiva e direta. O projeto foi construído com HTML, CSS e JavaScript puro, sem dependências de framework ou servidor.

## Visao geral

A página permite planejar a compra por categoria, acompanhar itens pendentes e concluídos e manter tudo salvo no navegador.

## Funcionalidades

- Adicionar itens com quantidade e categoria
- Evitar duplicatas atualizando a quantidade do item existente
- Buscar, filtrar por categoria e ordenar por nome, categoria ou recência
- Marcar itens como pegos, devolver, editar ou remover individualmente
- Limpar concluídos e desfazer remoções, limpezas ou mudanças de status
- Persistir lista e preferências no `localStorage`, incluindo a migração da versão anterior
- Exibir contadores, total de unidades e estados vazios contextuais
- Navegação por teclado, mensagens acessíveis e suporte a redução de movimento

## Tecnologias

- HTML5
- CSS3
- JavaScript

## Estrutura do projeto

```text
lista-compras/
├─ index.html
├─ README.md
└─ assets/
   ├─ css/
   │  └─ style.css
   ├─ js/
   │  └─ app.js
   └─ icons/
```

## Objetivo do projeto

Este projeto serve para praticar conceitos essenciais de desenvolvimento web:

- manipulação de estado e persistência local
- eventos e atualização dinâmica do DOM
- componentes acessíveis criados em JavaScript
- layout responsivo com CSS moderno
