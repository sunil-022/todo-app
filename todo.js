// ===== Task Manager Class =====
class TaskManager {
  constructor() {
    this.tasks = this.loadTasks();
    this.currentFilter = 'all';
    this.init();
  }

  // Initialize the app
  init() {
    this.cacheDOMElements();
    this.attachEventListeners();
    this.renderTasks();
    this.updateStats();
  }

  // Cache DOM elements for better performance
  cacheDOMElements() {
    this.taskInput = document.getElementById('taskInput');
    this.addBtn = document.getElementById('addBtn');
    this.taskList = document.getElementById('taskList');
    this.filterBtns = document.querySelectorAll('.filter-btn');
    this.clearCompletedBtn = document.getElementById('clearCompleted');
    this.emptyState = document.getElementById('emptyState');
    this.totalTasksEl = document.getElementById('totalTasks');
    this.completedTasksEl = document.getElementById('completedTasks');
  }

  // Attach all event listeners
  attachEventListeners() {
    // Add task on button click
    this.addBtn.addEventListener('click', () => this.addTask());

    // Add task on Enter key
    this.taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addTask();
    });

    // Filter buttons
    this.filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = e.currentTarget.dataset.filter;
        this.setFilter(filter);
      });
    });

    // Clear completed button
    this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());

    // Task list delegation for better performance
    this.taskList.addEventListener('click', (e) => this.handleTaskAction(e));
    this.taskList.addEventListener('change', (e) => this.handleCheckboxChange(e));
  }

  // Add new task
  addTask() {
    const text = this.taskInput.value.trim();
    
    if (text === '') {
      this.showNotification('Please enter a task!', 'warning');
      this.taskInput.focus();
      return;
    }

    const task = {
      id: Date.now(),
      text: text,
      completed: false,
      createdAt: new Date().toISOString()
    };

    this.tasks.unshift(task);
    this.saveTasks();
    this.renderTasks();
    this.updateStats();
    this.taskInput.value = '';
    this.taskInput.focus();
    this.showNotification('Task added successfully!', 'success');
  }

  // Edit task
  editTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;

    const newText = prompt('Edit your task:', task.text);
    
    if (newText === null) return; // User cancelled
    
    if (newText.trim() === '') {
      this.showNotification('Task cannot be empty!', 'warning');
      return;
    }

    task.text = newText.trim();
    this.saveTasks();
    this.renderTasks();
    this.showNotification('Task updated!', 'success');
  }

  // Delete task
  deleteTask(id) {
    const taskElement = document.querySelector(`[data-id="${id}"]`);
    
    // Add fade out animation
    if (taskElement) {
      taskElement.style.animation = 'slideOut 0.3s ease';
      
      setTimeout(() => {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.showNotification('Task deleted!', 'success');
      }, 300);
    }
  }

  // Toggle task completion
  toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.renderTasks();
      this.updateStats();
    }
  }

  // Handle checkbox change
  handleCheckboxChange(e) {
    if (e.target.classList.contains('task-checkbox')) {
      const id = parseInt(e.target.closest('.task-item').dataset.id);
      this.toggleTask(id);
    }
  }

  // Handle task actions (edit, delete)
  handleTaskAction(e) {
    const taskItem = e.target.closest('.task-item');
    if (!taskItem) return;

    const id = parseInt(taskItem.dataset.id);

    if (e.target.closest('.edit-btn')) {
      this.editTask(id);
    } else if (e.target.closest('.delete-btn')) {
      this.deleteTask(id);
    }
  }

  // Set filter
  setFilter(filter) {
    this.currentFilter = filter;
    
    // Update active button
    this.filterBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    this.renderTasks();
  }

  // Get filtered tasks
  getFilteredTasks() {
    switch (this.currentFilter) {
      case 'completed':
        return this.tasks.filter(t => t.completed);
      case 'pending':
        return this.tasks.filter(t => !t.completed);
      default:
        return this.tasks;
    }
  }

  // Clear completed tasks
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

  // Render tasks
  renderTasks() {
    const filteredTasks = this.getFilteredTasks();
    
    // Show/hide empty state
    if (filteredTasks.length === 0) {
      this.emptyState.classList.remove('hidden');
      this.taskList.innerHTML = '';
      return;
    }

    this.emptyState.classList.add('hidden');

    // Render task items
    this.taskList.innerHTML = filteredTasks.map(task => `
      <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
        <input 
          type="checkbox" 
          class="task-checkbox" 
          ${task.completed ? 'checked' : ''}
          aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}"
        >
        <span class="task-text">${this.escapeHtml(task.text)}</span>
        <div class="task-actions">
          <button class="task-btn edit-btn" aria-label="Edit task">
            <i class="fas fa-edit"></i>
          </button>
          <button class="task-btn delete-btn" aria-label="Delete task">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </li>
    `).join('');
  }

  // Update statistics
  updateStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.completed).length;
    
    this.totalTasksEl.textContent = total;
    this.completedTasksEl.textContent = completed;
  }

  // Save tasks to localStorage
  saveTasks() {
    localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
  }

  // Load tasks from localStorage
  loadTasks() {
    const saved = localStorage.getItem('todoTasks');
    return saved ? JSON.parse(saved) : [];
  }

  // Escape HTML to prevent XSS
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Show notification (simple implementation)
  showNotification(message, type = 'info') {
    // Check if notification container exists, if not create it
    let container = document.querySelector('.notification-container');
    
    if (!container) {
      container = document.createElement('div');
      container.className = 'notification-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      padding: 1rem 1.5rem;
      border-radius: 10px;
      background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#667eea'};
      color: white;
      font-weight: 500;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      animation: slideInRight 0.3s ease;
      max-width: 300px;
    `;

    container.appendChild(notification);

    // Add animation styles if not already present
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateX(-20px) scale(0.8);
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
  new TaskManager();
});