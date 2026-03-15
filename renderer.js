// ===== DOM ELEMENTS =====
const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const totalCount = document.getElementById('total-count');
const doneCount = document.getElementById('done-count');
const progressRing = document.getElementById('progress-ring');
const progressText = document.getElementById('progress-text');
const clearDoneBtn = document.getElementById('clear-done-btn');
const minimizeBtn = document.getElementById('minimize-btn');
const closeBtn = document.getElementById('close-btn');
const filterTabs = document.querySelectorAll('.filter-tab');
const sakuraCanvas = document.getElementById('sakura-canvas');

// ===== STATE =====
let todos = JSON.parse(localStorage.getItem('anime-todos')) || [];
let currentFilter = 'all';

// ===== SAVE & LOAD =====
function saveTodos() {
  localStorage.setItem('anime-todos', JSON.stringify(todos));
}

// ===== RENDER =====
function render() {
  const filtered = todos.filter(todo => {
    if (currentFilter === 'active') return !todo.done;
    if (currentFilter === 'done') return todo.done;
    return true;
  });

  todoList.innerHTML = '';

  filtered.forEach((todo, filteredIndex) => {
    const li = document.createElement('li');
    li.className = `todo-item${todo.done ? ' done' : ''}`;
    li.style.animationDelay = `${filteredIndex * 0.05}s`;
    li.dataset.id = todo.id;

    li.innerHTML = `
      <button class="anime-checkbox${todo.done ? ' checked' : ''}" data-id="${todo.id}" title="Toggle">
        ${todo.done ? '✓' : ''}
      </button>
      <span class="todo-text">${escapeHTML(todo.text)}</span>
      <button class="delete-btn" data-id="${todo.id}" title="Delete">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    `;

    todoList.appendChild(li);
  });

  // Update stats
  const total = todos.length;
  const done = todos.filter(t => t.done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  totalCount.textContent = total;
  doneCount.textContent = done;
  progressText.textContent = `${pct}%`;

  // Update progress ring
  const circumference = 2 * Math.PI * 14; // r=14
  const offset = circumference - (pct / 100) * circumference;
  progressRing.style.strokeDashoffset = offset;

  // Show/hide empty state
  if (filtered.length === 0) {
    emptyState.classList.add('visible');
  } else {
    emptyState.classList.remove('visible');
  }

  saveTodos();
}

// ===== HELPERS =====
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ===== ACTIONS =====
function addTodo() {
  const text = todoInput.value.trim();
  if (!text) {
    // Shake the input
    todoInput.style.animation = 'none';
    todoInput.offsetHeight; // reflow
    todoInput.style.animation = 'shake 0.4s ease';
    return;
  }

  todos.unshift({
    id: generateId(),
    text,
    done: false,
    createdAt: Date.now()
  });

  todoInput.value = '';
  todoInput.focus();
  render();
}

function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.done = !todo.done;
    render();
  }
}

function deleteTodo(id) {
  const item = todoList.querySelector(`[data-id="${id}"]`);
  if (item) {
    item.classList.add('removing');
    setTimeout(() => {
      todos = todos.filter(t => t.id !== id);
      render();
    }, 300);
  } else {
    todos = todos.filter(t => t.id !== id);
    render();
  }
}

function clearDone() {
  const doneItems = todoList.querySelectorAll('.todo-item.done');
  doneItems.forEach((item, i) => {
    setTimeout(() => item.classList.add('removing'), i * 50);
  });
  setTimeout(() => {
    todos = todos.filter(t => !t.done);
    render();
  }, doneItems.length * 50 + 300);
}

// ===== EVENT LISTENERS =====
addBtn.addEventListener('click', addTodo);

todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodo();
});

todoList.addEventListener('click', (e) => {
  const checkbox = e.target.closest('.anime-checkbox');
  const deleteBtn = e.target.closest('.delete-btn');

  if (checkbox) toggleTodo(checkbox.dataset.id);
  if (deleteBtn) deleteTodo(deleteBtn.dataset.id);
});

filterTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    filterTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentFilter = tab.dataset.filter;
    render();
  });
});

clearDoneBtn.addEventListener('click', clearDone);

// Window controls (Electron)
if (window.electronAPI) {
  minimizeBtn.addEventListener('click', () => window.electronAPI.minimize());
  closeBtn.addEventListener('click', () => window.electronAPI.close());
} else {
  // Fallback for browser testing
  minimizeBtn.addEventListener('click', () => alert('Minimize (works in Electron)'));
  closeBtn.addEventListener('click', () => window.close());
}

// ===== SHAKE ANIMATION (injected) =====
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }
`;
document.head.appendChild(shakeStyle);

// ===== SAKURA PETAL PARTICLES =====
(function initSakura() {
  const ctx = sakuraCanvas.getContext('2d');
  let petals = [];
  const PETAL_COUNT = 18;

  function resize() {
    sakuraCanvas.width = window.innerWidth;
    sakuraCanvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  class Petal {
    constructor() {
      this.reset();
      this.y = Math.random() * sakuraCanvas.height; // start scattered
    }

    reset() {
      this.x = Math.random() * sakuraCanvas.width;
      this.y = -10;
      this.size = Math.random() * 6 + 3;
      this.speedY = Math.random() * 0.6 + 0.2;
      this.speedX = Math.random() * 0.4 - 0.2;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.02;
      this.opacity = Math.random() * 0.3 + 0.1;
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = Math.random() * 0.02 + 0.01;
    }

    update() {
      this.y += this.speedY;
      this.wobble += this.wobbleSpeed;
      this.x += this.speedX + Math.sin(this.wobble) * 0.3;
      this.rotation += this.rotationSpeed;

      if (this.y > sakuraCanvas.height + 10) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = this.opacity;

      // Draw petal shape
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        this.size * 0.5, -this.size * 0.8,
        this.size, -this.size * 0.3,
        0, this.size
      );
      ctx.bezierCurveTo(
        -this.size, -this.size * 0.3,
        -this.size * 0.5, -this.size * 0.8,
        0, 0
      );

      // Gradient fill
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
      grad.addColorStop(0, 'rgba(255, 210, 220, 0.9)');
      grad.addColorStop(1, 'rgba(255, 183, 197, 0.5)');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.restore();
    }
  }

  // Create petals
  for (let i = 0; i < PETAL_COUNT; i++) {
    petals.push(new Petal());
  }

  function animate() {
    ctx.clearRect(0, 0, sakuraCanvas.width, sakuraCanvas.height);
    petals.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }

  animate();
})();

// ===== INITIAL RENDER =====
render();

// Focus input on start
todoInput.focus();
