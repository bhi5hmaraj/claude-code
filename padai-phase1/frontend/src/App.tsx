import { useEffect, useState } from 'react'
import TaskGraph from './components/TaskGraph'
import { Task, Status } from './types'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch tasks and status in parallel
      const [tasksRes, statusRes] = await Promise.all([
        fetch(`${API_URL}/api/tasks`),
        fetch(`${API_URL}/api/status`)
      ])

      if (!tasksRes.ok || !statusRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const tasksData = await tasksRes.json()
      const statusData = await statusRes.json()

      setTasks(tasksData.tasks || [])
      setStatus(statusData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Poll every 5 seconds
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !tasks.length) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchData}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>PadAI Dashboard</h1>
        {status && (
          <div className="status-bar">
            <div className="status-item">
              <span className="label">Total:</span>
              <span className="value">{status.total}</span>
            </div>
            <div className="status-item ready">
              <span className="label">Ready:</span>
              <span className="value">{status.ready}</span>
            </div>
            <div className="status-item in-progress">
              <span className="label">In Progress:</span>
              <span className="value">{status.in_progress}</span>
            </div>
            <div className="status-item completed">
              <span className="label">Completed:</span>
              <span className="value">{status.completed}</span>
            </div>
          </div>
        )}
      </header>

      <main className="main">
        <TaskGraph tasks={tasks} />
      </main>
    </div>
  )
}

export default App
