import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import Auth from './Auth'
import './App.css'

function App() {
  const [todos, setTodos] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')

  async function fetchTodos() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching todos:', error.message)
      setError('Could not load todos.')
    } else {
      setTodos(data)
    }

    setLoading(false)
  }

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Error getting session:', error.message)
      }

      const currentUser = data.session?.user ?? null
      setUser(currentUser)
      setAuthLoading(false)

      if (currentUser) {
        fetchTodos()
      } else {
        setTodos([])
        setLoading(false)
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      setAuthLoading(false)

      if (currentUser) {
        fetchTodos()
      } else {
        setTodos([])
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!inputValue.trim()) return

    setError('')

    const { data, error } = await supabase
      .from('todos')
      .insert({
        text: inputValue.trim(),
      })
      .select()

    if (error) {
      console.error('Error adding todo:', error.message)
      setError('Could not add todo.')
    } else {
      setTodos([...todos, data[0]])
      setInputValue('')
    }
  }

  const deleteTodo = async (id) => {
    setError('')

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting todo:', error.message)
      setError('Could not delete todo.')
    } else {
      setTodos(todos.filter((todo) => todo.id !== id))
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Error signing out:', error.message)
      setError('Could not sign out.')
    }
  }

  if (authLoading) {
    return (
      <div className="app">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app">
        <h1>Authenticated Todo App</h1>
        <p className="subtitle">Manage your tasks securely</p>
        <Auth />
      </div>
    )
  }

  return (
    <div className="app">
      <div className="header">
        <div>
          <h1>Authenticated Todo App</h1>
          <p className="subtitle">Manage your tasks securely</p>
        </div>

        <div className="user-box">
          <span>{user.email}</span>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}

      <form className="todo-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Add a new todo..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      {loading ? (
        <p>Loading todos...</p>
      ) : todos.length === 0 ? (
        <p>No todos yet.</p>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo.id} className="todo-item">
              <span>{todo.text}</span>
              <button
                className="delete-btn"
                onClick={() => deleteTodo(todo.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App