import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

type Priority = 'low' | 'medium' | 'high';
type Filter = 'all' | 'active' | 'completed';

interface Task {
  id: number;
  title: string;
  notes: string;
  priority: Priority;
  dueDate?: string;
  completed: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' }
  ];

  readonly priorities: { id: Priority; label: string }[] = [
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' }
  ];

  protected readonly filter = signal<Filter>('all');
  protected readonly search = signal('');
  protected readonly sort = signal<'created' | 'due' | 'priority'>('created');
  protected readonly tasks = signal<Task[]>([
    {
      id: 1,
      title: 'Draft weekly sprint goals',
      notes: 'Share with the team in the Monday stand-up.',
      priority: 'high',
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().slice(0, 10)
    },
    {
      id: 2,
      title: 'Review pull requests',
      notes: 'Focus on the UI polish tasks before the release.',
      priority: 'medium',
      completed: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      dueDate: undefined
    },
    {
      id: 3,
      title: 'Plan usability testing session',
      notes: 'Collect feedback questions and invite participants.',
      priority: 'low',
      completed: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10)
    }
  ]);

  protected draft: { title: string; notes: string; dueDate: string; priority: Priority } = {
    title: '',
    notes: '',
    dueDate: '',
    priority: 'medium'
  };

  #nextId = 4;

  protected readonly stats = computed(() => {
    const items = this.tasks();
    const completed = items.filter(task => task.completed).length;
    return {
      total: items.length,
      completed,
      active: items.length - completed
    };
  });

  protected readonly visibleTasks = computed(() => {
    const filter = this.filter();
    const search = this.search().trim().toLowerCase();
    const sort = this.sort();

    const filtered = this.tasks().filter(task => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' && !task.completed) ||
        (filter === 'completed' && task.completed);

      const matchesSearch =
        !search ||
        task.title.toLowerCase().includes(search) ||
        task.notes.toLowerCase().includes(search);

      return matchesFilter && matchesSearch;
    });

    const sorted = [...filtered];

    if (sort === 'due') {
      sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    } else if (sort === 'priority') {
      const order: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
      sorted.sort((a, b) => order[a.priority] - order[b.priority]);
    } else {
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return sorted;
  });

  protected addTask(form: NgForm): void {
    const title = this.draft.title.trim();
    if (!title) {
      return;
    }

    const task: Task = {
      id: this.#nextId++,
      title,
      notes: this.draft.notes.trim(),
      priority: this.draft.priority,
      dueDate: this.draft.dueDate || undefined,
      completed: false,
      createdAt: new Date().toISOString()
    };

    this.tasks.update(list => [...list, task]);
    form.resetForm({ title: '', notes: '', dueDate: '', priority: 'medium' });
    this.draft = { title: '', notes: '', dueDate: '', priority: 'medium' };
  }

  protected toggleCompletion(taskId: number): void {
    this.tasks.update(tasks =>
      tasks.map(task => (task.id === taskId ? { ...task, completed: !task.completed } : task))
    );
  }

  protected removeTask(taskId: number): void {
    this.tasks.update(tasks => tasks.filter(task => task.id !== taskId));
  }

  protected updateFilter(filter: Filter): void {
    this.filter.set(filter);
  }

  protected updateSort(sort: 'created' | 'due' | 'priority'): void {
    this.sort.set(sort);
  }

  protected onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'created' | 'due' | 'priority';
    this.updateSort(value);
  }

  protected onSearchChange(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected clearCompleted(): void {
    this.tasks.update(tasks => tasks.filter(task => !task.completed));
  }

  protected completeAll(): void {
    this.tasks.update(tasks => tasks.map(task => ({ ...task, completed: true })));
  }
}
