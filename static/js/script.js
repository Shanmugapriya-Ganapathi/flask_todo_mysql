document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('task-form');
  const input = form?.querySelector('input[name="content"]');
  const prioritySelect = form?.querySelector('select[name="priority"]');
  const taskList = document.getElementById('task-list');
  const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
  const sortToggle = document.getElementById('sort-toggle');

  const state = {
    filter: 'all',
    sort: 'created_at_desc',
    editing: null, // task id being edited
    refreshInterval: null,
  };

  const priorityLabels = {
    imp: 'imp',
    mid: 'mid',
    low: 'low',
  };

  function renderTasks(tasks) {
    taskList.innerHTML = '';
    tasks.forEach((task) => {
      const li = document.createElement('li');
      li.className = `task-${task.priority}`;
      li.dataset.id = task.id;

      const main = document.createElement('div');
      main.className = 'task-main';

      const title = document.createElement('div');
      title.textContent = task.content;

      const meta = document.createElement('div');
      meta.className = 'task-meta';
      const dateStr = new Date(task.created_at).toLocaleString();
      meta.textContent = `${priorityLabels[task.priority]} • ${dateStr}`;

      main.appendChild(title);
      main.appendChild(meta);

      const actions = document.createElement('div');
      actions.className = 'task-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn';
      editBtn.textContent = 'Edit';
      editBtn.onclick = () => startEdit(li, task);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn delete';
      deleteBtn.textContent = 'Delete';
      deleteBtn.onclick = () => deleteTask(task.id);

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      li.appendChild(main);
      li.appendChild(actions);
      taskList.appendChild(li);
    });
  }

  async function loadTasks() {
    // Skip auto-refresh during edit to avoid losing state
    if (state.editing) return;
    const params = new URLSearchParams();
    if (state.filter !== 'all') params.set('priority', state.filter);
    params.set('sort', state.sort);
    const res = await fetch(`/tasks?${params.toString()}`);
    const data = await res.json();
    renderTasks(data.tasks || []);
  }

  async function addTask(content, priority) {
    const res = await fetch('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, priority }),
    });
    if (!res.ok) {
      alert('Failed to add task');
      return;
    }
    await loadTasks();
  }

  async function deleteTask(id) {
    const res = await fetch(`/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('Failed to delete');
      return;
    }
    await loadTasks();
  }

  function startEdit(li, task) {
    state.editing = task.id;
    li.innerHTML = '';
    li.className = `task-${task.priority}`;

    const wrapper = document.createElement('div');
    wrapper.className = 'inline-input';

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.value = task.content;

    const select = document.createElement('select');
    ['imp', 'mid', 'low'].forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      if (p === task.priority) opt.selected = true;
      select.appendChild(opt);
    });

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn save';
    saveBtn.textContent = 'Save';
    saveBtn.onclick = async () => {
      const content = textInput.value.trim();
      const priority = select.value;
      if (!content) {
        alert('Please enter a task.');
        return;
      }
      const res = await fetch(`/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, priority }),
      });
      if (!res.ok) {
        alert('Failed to update');
        return;
      }
      state.editing = null;
      await loadTasks();
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => {
      state.editing = null;
      loadTasks();
    };

    wrapper.appendChild(textInput);
    wrapper.appendChild(select);
    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);

    li.appendChild(wrapper);
    li.appendChild(actions);
  }

  // Form submit
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!input || !prioritySelect) return;
    const content = input.value.trim();
    const priority = prioritySelect.value;
    if (!content) {
      alert('Please enter a task.');
      return;
    }
    await addTask(content, priority);
    input.value = '';
    prioritySelect.value = 'imp';
  });

  // Filters
  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.filter;
      loadTasks();
    });
  });

  // Sort toggle
  sortToggle?.addEventListener('click', () => {
    if (state.sort === 'created_at_desc') {
      state.sort = 'priority';
      sortToggle.textContent = 'By Priority';
    } else {
      state.sort = 'created_at_desc';
      sortToggle.textContent = 'Newest';
    }
    sortToggle.classList.toggle('active');
    loadTasks();
  });

  // Auto refresh
  state.refreshInterval = setInterval(loadTasks, 15000);

  // Initial load
  loadTasks();
});

