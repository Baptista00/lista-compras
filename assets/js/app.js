const $ = (selector) => document.querySelector(selector);
const elements = {
  form: $("#add-form"),
  name: $("#item-input"),
  category: $("#category-input"),
  quantity: $("#quantity-input"),
  pending: $("#lista-mercado"),
  done: $("#lista-pegados"),
  emptyPending: $("#empty-preciso"),
  emptyDone: $("#empty-pegados"),
  badgePending: $("#badge-preciso"),
  badgeDone: $("#badge-pegados"),
  clear: $("#limpar-btn"),
  hint: $("#input-hint"),
  summary: $("#summary-text"),
  insightPending: $("#insight-pendentes"),
  insightDone: $("#insight-pegos"),
  insightTotal: $("#insight-total"),
  search: $("#search-input"),
  filter: $("#filter-input"),
  sort: $("#sort-input"),
  toast: $("#toast"),
  toastMessage: $("#toast-message"),
  undo: $("#undo-button"),
};

const STORAGE_KEY = "mercado-lista-v2";
const icons = {
  Hortifruti: "🥬",
  Padaria: "🥖",
  Laticínios: "🥛",
  Mercearia: "🫙",
  Carnes: "🥩",
  Bebidas: "🥤",
  Limpeza: "🧼",
  Outros: "✦",
};
let state = { items: [], preferences: { filter: "Todas", sort: "recentes" } };
let undoAction = null;
let toastTimer;

const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const normalizeQuantity = (value) =>
  Math.min(99, Math.max(1, Number.parseInt(value, 10) || 1));
const normalizeText = (text) => text.trim().replace(/\s+/g, " ");
const plural = (number, one, many) => `${number} ${number === 1 ? one : many}`;

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function load() {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem("lista-compras-itens");
    const saved = JSON.parse(raw);
    if (!saved) return;
    if (Array.isArray(saved.items))
      state = {
        ...state,
        ...saved,
        items: saved.items.filter((item) => item && item.name),
      };
    else if (Array.isArray(saved.preciso) || Array.isArray(saved.pegados)) {
      state.items = [
        ...(saved.preciso || []).map((item) => ({
          ...item,
          name: item.texto || item.name,
          done: false,
        })),
        ...(saved.pegados || []).map((item) => ({
          ...item,
          name: item.texto || item.name,
          done: true,
        })),
      ].map((item) => ({
        id: uid(),
        name: normalizeText(item.name),
        quantity: normalizeQuantity(item.quantidade || item.quantity),
        category: "Outros",
        done: item.done,
        createdAt: Date.now(),
      }));
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function getVisible(done) {
  const term = elements.search.value.trim().toLocaleLowerCase("pt-BR");
  const filter = elements.filter.value;
  const sort = elements.sort.value;
  return state.items
    .filter(
      (item) =>
        item.done === done &&
        (!term || item.name.toLocaleLowerCase("pt-BR").includes(term)) &&
        (filter === "Todas" || item.category === filter),
    )
    .sort((a, b) =>
      sort === "az"
        ? a.name.localeCompare(b.name, "pt-BR")
        : sort === "categoria"
          ? a.category.localeCompare(b.category, "pt-BR") ||
            a.name.localeCompare(b.name, "pt-BR")
          : b.createdAt - a.createdAt,
    );
}

function renderItem(item) {
  const li = document.createElement("li");
  li.className = `item${item.done ? " item--done" : ""}`;
  li.dataset.id = item.id;
  const content = document.createElement("div");
  content.className = "item-content";
  const title = document.createElement("div");
  title.className = "item-title-row";
  const name = document.createElement("span");
  name.className = "item-name";
  name.textContent = item.name;
  const category = document.createElement("span");
  category.className = "category-tag";
  category.textContent = `${icons[item.category] || "✦"} ${item.category}`;
  const badge = document.createElement("span");
  badge.className = "quantity-badge";
  badge.textContent = `×${item.quantity}`;
  title.append(name, category, badge);
  const meta = document.createElement("div");
  meta.className = "item-meta";
  const control = document.createElement("div");
  control.className = "quantity-control";
  control.setAttribute("aria-label", `Quantidade de ${item.name}`);
  [
    ["−", -1, "Diminuir"],
    ["+", 1, "Aumentar"],
  ].forEach(([label, delta, action]) => {
    const button = actionButton(
      "quantity-stepper",
      `${action} quantidade de ${item.name}`,
      label,
      () => changeQuantity(item.id, delta),
    );
    control.append(button);
    if (delta === -1) {
      const value = document.createElement("span");
      value.className = "quantity-value";
      value.textContent = item.quantity;
      control.append(value);
    }
  });
  meta.append(control);
  content.append(title, meta);
  const actions = document.createElement("div");
  actions.className = "item-actions";
  actions.append(
    actionButton(
      item.done ? "btn-devolver" : "btn-pegar",
      item.done ? `Devolver ${item.name}` : `Marcar ${item.name} como pego`,
      item.done ? "Devolver" : "Peguei",
      () => toggleDone(item.id),
    ),
  );
  actions.append(
    actionButton("btn-edit", `Editar ${item.name}`, "Editar", () =>
      editItem(item.id),
    ),
  );
  actions.append(
    actionButton("btn-remover", `Remover ${item.name}`, "×", () =>
      removeItem(item.id),
    ),
  );
  li.append(content, actions);
  return li;
}

function actionButton(className, label, text, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.setAttribute("aria-label", label);
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}

function render() {
  const pending = state.items.filter((item) => !item.done);
  const done = state.items.filter((item) => item.done);
  elements.pending.replaceChildren(...getVisible(false).map(renderItem));
  elements.done.replaceChildren(...getVisible(true).map(renderItem));
  const hasFilter = Boolean(
    elements.search.value || elements.filter.value !== "Todas",
  );
  const noResultsPending = hasFilter && !getVisible(false).length;
  const noResultsDone = hasFilter && !getVisible(true).length;
  elements.emptyPending.hidden = pending.length > 0 && !noResultsPending;
  elements.emptyDone.hidden = done.length > 0 && !noResultsDone;
  if (noResultsPending)
    elements.emptyPending.innerHTML =
      '<span aria-hidden="true">⌕</span><p>Nenhum item encontrado com esse filtro.</p>';
  else
    elements.emptyPending.innerHTML =
      '<span aria-hidden="true">🌿</span><p>Nenhum item por aqui ainda.<br>Adicione sua primeira compra acima.</p>';
  if (noResultsDone)
    elements.emptyDone.innerHTML =
      '<span aria-hidden="true">⌕</span><p>Nenhum item encontrado com esse filtro.</p>';
  else
    elements.emptyDone.innerHTML =
      '<span aria-hidden="true">✨</span><p>Os itens concluídos aparecem aqui<br>com a quantidade registrada.</p>';
  elements.badgePending.textContent = pending.length;
  elements.badgeDone.textContent = done.length;
  elements.badgePending.setAttribute(
    "aria-label",
    plural(pending.length, "item pendente", "itens pendentes"),
  );
  elements.badgeDone.setAttribute(
    "aria-label",
    plural(done.length, "item concluído", "itens concluídos"),
  );
  elements.insightPending.textContent = pending.length;
  elements.insightDone.textContent = done.length;
  const units = state.items.reduce((total, item) => total + item.quantity, 0);
  elements.insightTotal.textContent = units;
  elements.summary.textContent = `Você tem ${plural(state.items.length, "item cadastrado", "itens cadastrados")} e ${plural(units, "unidade", "unidades")} no total.`;
  elements.clear.hidden = done.length === 0;
  save();
}

function addItem(event) {
  event.preventDefault();
  const name = normalizeText(elements.name.value);
  const quantity = normalizeQuantity(elements.quantity.value);
  const category = elements.category.value;
  if (!name) {
    elements.hint.textContent = "Digite um item antes de adicionar.";
    elements.name.focus();
    return;
  }
  const duplicate = state.items.find(
    (item) =>
      !item.done &&
      item.category === category &&
      item.name.localeCompare(name, "pt-BR", { sensitivity: "accent" }) === 0,
  );
  if (duplicate) {
    duplicate.quantity = Math.min(99, duplicate.quantity + quantity);
    elements.hint.textContent = `${name} já estava na lista — quantidade atualizada.`;
    showToast("Quantidade atualizada.");
  } else {
    state.items.push({
      id: uid(),
      name,
      quantity,
      category,
      done: false,
      createdAt: Date.now(),
    });
    elements.hint.textContent = "";
    showToast(`${name} adicionado à lista.`);
  }
  elements.form.reset();
  elements.quantity.value = "1";
  elements.name.focus();
  render();
}

function changeQuantity(id, delta) {
  const item = state.items.find((entry) => entry.id === id);
  if (!item) return;
  item.quantity = normalizeQuantity(item.quantity + delta);
  render();
}
function toggleDone(id) {
  const item = state.items.find((entry) => entry.id === id);
  if (!item) return;
  item.done = !item.done;
  showToast(
    item.done
      ? `${item.name} marcado como pego.`
      : `${item.name} voltou para pendentes.`,
    () => {
      item.done = !item.done;
      render();
    },
  );
  render();
}
function removeItem(id) {
  const index = state.items.findIndex((item) => item.id === id);
  if (index < 0) return;
  const [removed] = state.items.splice(index, 1);
  showToast(`${removed.name} removido.`, () => {
    state.items.splice(index, 0, removed);
    render();
  });
  render();
}
function editItem(id) {
  const item = state.items.find((entry) => entry.id === id);
  if (!item) return;
  const nextName = window.prompt("Nome do item:", item.name);
  if (nextName === null) return;
  const name = normalizeText(nextName);
  if (!name) {
    showToast("O nome não pode ficar vazio.");
    return;
  }
  item.name = name;
  render();
  showToast("Item atualizado.");
}
function clearDone() {
  const removed = state.items.filter((item) => item.done);
  if (!removed.length) return;
  state.items = state.items.filter((item) => !item.done);
  showToast(
    `${plural(removed.length, "item concluído removido", "itens concluídos removidos")}.`,
    () => {
      state.items.push(...removed);
      render();
    },
  );
  render();
}
function showToast(message, undo) {
  clearTimeout(toastTimer);
  undoAction = undo || null;
  elements.toastMessage.textContent = message;
  elements.undo.hidden = !undo;
  elements.toast.classList.add("toast--visible");
  toastTimer = setTimeout(() => {
    elements.toast.classList.remove("toast--visible");
    undoAction = null;
  }, 5000);
}

elements.form.addEventListener("submit", addItem);
elements.quantity.addEventListener("input", () => {
  elements.quantity.value = normalizeQuantity(elements.quantity.value);
});
elements.name.addEventListener("input", () => {
  if (elements.name.value.trim()) elements.hint.textContent = "";
});
[elements.search, elements.filter, elements.sort].forEach((input) =>
  input.addEventListener("input", () => {
    state.preferences = {
      filter: elements.filter.value,
      sort: elements.sort.value,
    };
    render();
  }),
);
elements.clear.addEventListener("click", clearDone);
elements.undo.addEventListener("click", () => {
  if (!undoAction) return;
  const action = undoAction;
  undoAction = null;
  elements.toast.classList.remove("toast--visible");
  action();
});
load();
elements.filter.value = state.preferences?.filter || "Todas";
elements.sort.value = state.preferences?.sort || "recentes";
render();
