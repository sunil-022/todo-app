class TaskManager {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem('todoTasks')) || [];
    this.currentFilter = 'all';
    this.taskInput = document.getElementById('taskInput');
    this.addBtn = document.getElementById('addBtn');
    this.taskList = document.getElementById('taskList');
    this.filterBtns = document.querySelectorAll('.filter-btn');
    this.clearCompletedBtn = document.getElementById('clearCompleted');
    this.emptyState = document.getElementById('emptyState');
    this.totalTasksEl = document.getElementById('totalTasks');
    this.completedTasksEl = document.getElementById('completedTasks');
    
    this.addBtn.addEventListener('click', () => this.addTask());
    this.taskInput.addEventListener('keypress', (e) => e.key === 'Enter' && this.addTask());
    this.filterBtns.forEach(btn => btn.addEventListener('click', (e) => this.setFilter(e.currentTarget.dataset.filter)));
    this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
    this.taskList.addEventListener('click', (e) => this.handleTaskAction(e));
    this.taskList.addEventListener('change', (e) => {
      if (e.target.classList.contains('task-checkbox')) {
        this.toggleTask(parseInt(e.target.closest('.task-item').dataset.id));
      }
    });
    
    this.renderTasks();
    this.updateStats();
  }

  addTask() {
    const text = this.taskInput.value.trim();
    if (!text) {
      this.showNotification('Please enter a task!', 'warning');
      return;
    }
    
    this.tasks.unshift({ id: Date.now(), text, completed: false });
    this.saveTasks();
    this.renderTasks();
    this.updateStats();
    this.taskInput.value = '';
    this.showNotification('Task added!', 'success');
  }

  editTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;
    
    const newText = prompt('Edit your task:', task.text);
    if (newText === null || !newText.trim()) return;
    
    task.text = newText.trim();
    this.saveTasks();
    this.renderTasks();
    this.showNotification('Task updated!', 'success');
  }

  deleteTask(id) {
    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) {
      el.style.animation = 'slideOut 0.3s';
      setTimeout(() => {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.showNotification('Task deleted!', 'success');
      }, 300);
    }
  }

  toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.renderTasks();
      this.updateStats();
    }
  }

  handleTaskAction(e) {
    const item = e.target.closest('.task-item');
    if (!item) return;
    
    const id = parseInt(item.dataset.id);
    if (e.target.closest('.edit-btn')) this.editTask(id);
    else if (e.target.closest('.delete-btn')) this.deleteTask(id);
  }

  setFilter(filter) {
    this.currentFilter = filter;
    this.filterBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === filter));
    this.renderTasks();
  }

  getFilteredTasks() {
    if (this.currentFilter === 'completed') return this.tasks.filter(t => t.completed);
    if (this.currentFilter === 'pending') return this.tasks.filter(t => !t.completed);
    return this.tasks;
  }

  clearCompleted() {
    const completedCount = this.tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
      this.showNotification('No completed tasks to clear!', 'warning');
      return;
    }
    
    if (confirm(`Delete ${completedCount} completed task(s)?`)) {
      this.tasks = this.tasks.filter(t => !t.completed);
      this.saveTasks();
      this.renderTasks();
      this.updateStats();
      this.showNotification(`${completedCount} task(s) cleared!`, 'success');
    }
  }

  renderTasks() {
    const filteredTasks = this.getFilteredTasks();
    
    if (filteredTasks.length === 0) {
      this.emptyState.classList.remove('hidden');
      this.taskList.innerHTML = '';
      return;
    }

    this.emptyState.classList.add('hidden');
    this.taskList.innerHTML = filteredTasks.map(task => `
      <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <span class="task-text">${this.escapeHtml(task.text)}</span>
        <div class="task-actions">
          <button class="task-btn edit-btn"><i class="fas fa-edit"></i></button>
          <button class="task-btn delete-btn"><i class="fas fa-trash"></i></button>
        </div>
      </li>
    `).join('');
  }

  updateStats() {
    this.totalTasksEl.textContent = this.tasks.length;
    this.completedTasksEl.textContent = this.tasks.filter(t => t.completed).length;
  }

  saveTasks() {
    localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showNotification(message, type = 'info') {
    let container = document.querySelector('.notification-container');
    
    if (!container) {
      container = document.createElement('div');
      container.className = 'notification-container';
      document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    container.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideInRight 0.3s reverse';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => new TaskManager());