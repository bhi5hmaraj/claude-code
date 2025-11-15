import { useCallback, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow'
import dagre from 'dagre'
import { Task } from '../types'
import 'reactflow/dist/style.css'
import './TaskGraph.css'

interface TaskGraphProps {
  tasks: Task[]
}

const nodeWidth = 250
const nodeHeight = 80

// Layout tasks using dagre
const getLayoutedElements = (tasks: Task[]) => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 100 })

  const nodes: Node[] = []
  const edges: Edge[] = []

  // Create nodes
  tasks.forEach((task) => {
    const status = task.status || 'pending'

    const node: Node = {
      id: task.id,
      data: {
        label: task.title,
        status,
        assignee: task.assignee,
        taskId: task.id,
      },
      position: { x: 0, y: 0 },
      className: `task-node status-${status}`,
      style: {
        width: nodeWidth,
        height: nodeHeight,
      },
    }

    nodes.push(node)
    dagreGraph.setNode(task.id, { width: nodeWidth, height: nodeHeight })
  })

  // Create edges from dependencies
  tasks.forEach((task) => {
    if (task.dependencies) {
      task.dependencies.forEach((dep) => {
        // Edge from depends_on -> task (depends_on blocks task)
        const edge: Edge = {
          id: `${dep.depends_on_id}-${task.id}`,
          source: dep.depends_on_id,
          target: task.id,
          type: 'smoothstep',
          animated: task.status === 'ready',
          label: dep.type === 'blocks' ? '🔒' : '',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
          style: {
            strokeWidth: 2,
          },
        }

        edges.push(edge)
        dagreGraph.setEdge(dep.depends_on_id, task.id)
      })
    }
  })

  // Calculate layout
  dagre.layout(dagreGraph)

  // Apply positions
  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    }
  })

  return { nodes, edges }
}

// Custom node component
const TaskNode = ({ data }: { data: any }) => {
  const { label, status, assignee, taskId } = data

  return (
    <div className={`task-card status-${status}`}>
      <div className="task-header">
        <span className="task-id">{taskId}</span>
        <span className={`task-status status-${status}`}>
          {status === 'completed' ? '✓' : status === 'in_progress' ? '⚙' : '○'}
        </span>
      </div>
      <div className="task-title">{label}</div>
      {assignee && (
        <div className="task-assignee">
          👤 {assignee}
        </div>
      )}
    </div>
  )
}

const nodeTypes = {
  default: TaskNode,
}

export default function TaskGraph({ tasks }: TaskGraphProps) {
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(tasks),
    [tasks]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)

  // Update nodes when tasks change
  useMemo(() => {
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges])

  if (!tasks.length) {
    return (
      <div className="empty-state">
        <p>No tasks found</p>
      </div>
    )
  }

  return (
    <div className="task-graph">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
      >
        <Background color="#333" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const status = node.className?.includes('completed')
              ? '#60a5fa'
              : node.className?.includes('in_progress')
              ? '#fbbf24'
              : node.className?.includes('ready')
              ? '#4ade80'
              : '#6b7280'
            return status
          }}
          maskColor="rgba(0, 0, 0, 0.8)"
        />
      </ReactFlow>
    </div>
  )
}
