import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './KanbanBoard.css'

function KanbanColumn({ id, title, items, onItemClick }) {
  return (
    <div className="kanban-column">
      <div className="kanban-column-header">
        <h3>{title}</h3>
        <span className="kanban-count">{items.length}</span>
      </div>
      <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
        <div className="kanban-column-content">
          {items.map((item) => (
            <KanbanCard key={item.id} item={item} onClick={() => onItemClick(item)} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

function KanbanCard({ item, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleClick = (e) => {
    // Only navigate if not dragging
    if (!isDragging) {
      onClick(item)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="kanban-card"
      onClick={handleClick}
    >
      <div className="kanban-card-title">{item.name || item.title}</div>
      {item.address && (
        <div className="kanban-card-subtitle">{item.address}</div>
      )}
      {item.install_date && (
        <div className="kanban-card-subtitle">Install: {new Date(item.install_date).toLocaleDateString()}</div>
      )}
    </div>
  )
}

function KanbanBoard({ columns, items, onItemMove, onItemClick }) {
  const [localItems, setLocalItems] = useState(items)
  
  useEffect(() => {
    setLocalItems(items)
  }, [items])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts (allows clicks)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const activeItem = localItems.find(item => item.id === active.id)
    const overItem = localItems.find(item => item.id === over.id)
    
    if (!activeItem || !overItem) {
      return
    }

    // Find which columns these items belong to
    const activeColumn = columns.find(col => 
      localItems.filter(item => item.stage === col.id).some(item => item.id === active.id)
    )
    const overColumn = columns.find(col => 
      localItems.filter(item => item.stage === col.id).some(item => item.id === over.id)
    )

    if (activeColumn && overColumn && activeColumn.id !== overColumn.id) {
      // Item moved to different column - update stage
      const updatedItems = localItems.map(item =>
        item.id === active.id ? { ...item, stage: overColumn.id } : item
      )
      setLocalItems(updatedItems)
      onItemMove(active.id, overColumn.id)
    } else if (activeColumn && overColumn && activeColumn.id === overColumn.id) {
      // Item reordered within same column
      const columnItems = localItems.filter(item => item.stage === activeColumn.id)
      const oldIndex = columnItems.findIndex(item => item.id === active.id)
      const newIndex = columnItems.findIndex(item => item.id === over.id)
      
      const reorderedItems = arrayMove(columnItems, oldIndex, newIndex)
      const updatedItems = localItems.map(item => {
        const reorderedItem = reorderedItems.find(ri => ri.id === item.id)
        return reorderedItem || item
      })
      setLocalItems(updatedItems)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board">
        {columns.map((column) => {
          const columnItems = localItems.filter(item => item.stage === column.id)
          return (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              items={columnItems}
              onItemClick={onItemClick}
            />
          )
        })}
      </div>
    </DndContext>
  )
}

export default KanbanBoard

