import { supabase } from '../supabase/client';
import { Todo } from '../types';

// Function to fetch all todos for a user
export const fetchUserTodos = async (userId: string): Promise<Todo[]> => {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(todo => ({
      id: todo.id,
      userId: todo.user_id,
      title: todo.title,
      completed: todo.completed,
      createdAt: new Date(todo.created_at),
      updatedAt: new Date(todo.updated_at)
    }));
  } catch (error) {
    console.error('Error fetching todos:', error);
    throw error;
  }
};

// Function to create a new todo
export const createTodo = async (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Todo> => {
  try {
    const { data, error } = await supabase
      .from('todos')
      .insert({
        user_id: todo.userId,
        title: todo.title,
        completed: todo.completed
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      completed: data.completed,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Error creating todo:', error);
    throw error;
  }
};

// Function to update a todo
export const updateTodo = async (id: string, updates: Partial<Todo>): Promise<Todo> => {
  try {
    const updateData: any = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.completed !== undefined) updateData.completed = updates.completed;
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    const { data, error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      completed: data.completed,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Error updating todo:', error);
    throw error;
  }
};

// Function to delete a todo
export const deleteTodo = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting todo:', error);
    throw error;
  }
};

// Function to toggle all todos completion status
export const toggleAllTodos = async (userId: string, completed: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('todos')
      .update({ completed: completed, updated_at: new Date() })
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error toggling all todos:', error);
    throw error;
  }
};

// Function to clear completed todos
export const clearCompletedTodos = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('user_id', userId)
      .eq('completed', true);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error clearing completed todos:', error);
    throw error;
  }
};

// Export the service as a default export
export default {
  fetchUserTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleAllTodos,
  clearCompletedTodos
};