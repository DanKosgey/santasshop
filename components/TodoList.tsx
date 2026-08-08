import React, { useState, useEffect } from 'react';
import { Plus, Check, Trash2, RotateCcw } from 'lucide-react';
import { Todo } from '../types';
import todoService from '../services/todoService';

interface TodoListProps {
  userId: string;
}

const TodoList: React.FC<TodoListProps> = ({ userId }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch todos on component mount
  useEffect(() => {
    fetchTodos();
  }, [userId]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const userTodos = await todoService.fetchUserTodos(userId);
      setTodos(userTodos);
      setError(null);
    } catch (err) {
      setError('Failed to fetch todos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;

    try {
      const todo = await todoService.createTodo({
        userId,
        title: newTodo.trim(),
        completed: false
      });
      
      setTodos([todo, ...todos]);
      setNewTodo('');
    } catch (err) {
      setError('Failed to add todo');
      console.error(err);
    }
  };

  const handleToggleTodo = async (id: string, completed: boolean) => {
    try {
      const updatedTodo = await todoService.updateTodo(id, { completed });
      setTodos(todos.map(todo => todo.id === id ? updatedTodo : todo));
    } catch (err) {
      setError('Failed to update todo');
      console.error(err);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await todoService.deleteTodo(id);
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (err) {
      setError('Failed to delete todo');
      console.error(err);
    }
  };

  const handleToggleAll = async () => {
    const allCompleted = todos.every(todo => todo.completed);
    try {
      await todoService.toggleAllTodos(userId, !allCompleted);
      setTodos(todos.map(todo => ({ ...todo, completed: !allCompleted })));
    } catch (err) {
      setError('Failed to toggle all todos');
      console.error(err);
    }
  };

  const handleClearCompleted = async () => {
    try {
      await todoService.clearCompletedTodos(userId);
      setTodos(todos.filter(todo => !todo.completed));
    } catch (err) {
      setError('Failed to clear completed todos');
      console.error(err);
    }
  };

  const activeCount = todos.filter(todo => !todo.completed).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-trade-neon"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-trade-dark rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-2">Task Manager</h2>
        <p className="text-gray-400 text-sm">Manage your trading tasks and goals</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 text-red-200 text-sm">
          {error}
          <button 
            onClick={fetchTodos}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="p-6">
        {/* Add Todo Form */}
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
            placeholder="Add a new task..."
            className="flex-1 bg-gray-900 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-trade-accent"
          />
          <button
            onClick={handleAddTodo}
            disabled={!newTodo.trim()}
            className="bg-trade-accent text-white p-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>

        {/* Todo List */}
        <div className="space-y-3 mb-6">
          {todos.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p>No tasks yet. Add your first task above!</p>
            </div>
          ) : (
            todos.map(todo => (
              <div 
                key={todo.id} 
                className="flex items-center gap-4 p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-700 transition"
              >
                <button
                  onClick={() => handleToggleTodo(todo.id, !todo.completed)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                    todo.completed 
                      ? 'bg-trade-neon border-trade-neon' 
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  {todo.completed && <Check className="h-4 w-4 text-black" />}
                </button>
                <span className={`flex-1 ${todo.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                  {todo.title}
                </span>
                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="flex-shrink-0 p-2 text-gray-500 hover:text-red-500 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Todo Stats and Actions */}
        {todos.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-800">
            <div className="text-sm text-gray-400">
              {activeCount} {activeCount === 1 ? 'task' : 'tasks'} left
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleToggleAll}
                className="text-sm text-gray-400 hover:text-white transition"
              >
                Toggle All
              </button>
              <button
                onClick={handleClearCompleted}
                className="text-sm text-gray-400 hover:text-white transition flex items-center gap-1"
              >
                <RotateCcw className="h-4 w-4" />
                Clear Completed
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoList;