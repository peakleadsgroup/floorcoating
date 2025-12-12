import React, { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay,
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
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${id}`,
  })

  return (
    <div className="kanban-column">
      <div className="kanban-column-header">
        <h3>{title}</h3>
        <span className="kanban-count">{items.length}</span>
      </div>
      <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
        <div 
          ref={setNodeRef} 
          className={`kanban-column-content ${isOver ? 'kanban-column-drop-zone' : ''}`}
        >
          {items.length === 0 && (
            <div className="kanban-column-empty">Drop items here</div>
          )}
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
    opacity: isDragging ? 0.3 : 1,
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
      <div className="kanban-card-title">
        {item.name || item.title}
        {item.unreadCount > 0 && (
          <span className="kanban-card-unread-badge">{item.unreadCount}</span>
        )}
      </div>
      {(() => {
        // Construct address from new fields if available, otherwise use legacy address field
        const address = item.street_address || item.city || item.state || item.zip
          ? [item.street_address, item.city, item.state, item.zip].filter(Boolean).join(', ')
          : item.address
        return address && (
          <div className="kanban-card-subtitle">{address}</div>
        )
      })()}
      {item.install_date && (
        <div className="kanban-card-subtitle">Install: {new Date(item.install_date).toLocaleDateString()}</div>
      )}
    </div>
  )
}

function KanbanBoard({ columns, items, onItemMove, onItemClick, separatorAfter }) {
  const [localItems, setLocalItems] = useState(items)
  const [activeId, setActiveId] = useState(null)
  
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

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) {
      return
    }

    const activeItem = localItems.find(item => item.id === active.id)
    if (!activeItem) {
      return
    }

    // Check if dropping on a column
    const columnIdMatch = over.id.toString().match(/^column-(.+)$/)
    if (columnIdMatch) {
      const targetColumnId = columnIdMatch[1]
      const activeColumn = columns.find(col => 
        localItems.filter(item => item.stage === col.id).some(item => item.id === active.id)
      )
      
      if (activeColumn && activeColumn.id !== targetColumnId) {
        // Item moved to different column - update stage
        const updatedItems = localItems.map(item =>
          item.id === active.id ? { ...item, stage: targetColumnId } : item
        )
        setLocalItems(updatedItems)
        onItemMove(active.id, targetColumnId)
      }
      return
    }

    // Check if dropping on another item
    const overItem = localItems.find(item => item.id === over.id)
    if (!overItem) {
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

  const activeItem = activeId ? localItems.find(item => item.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board">
        {columns.map((column, index) => {
          const columnItems = localItems.filter(item => item.stage === column.id)
          return (
            <React.Fragment key={column.id}>
              <KanbanColumn
                id={column.id}
                title={column.title}
                items={columnItems}
                onItemClick={onItemClick}
              />
              {separatorAfter && index === separatorAfter - 1 && (
                <div className="kanban-separator"></div>
              )}
            </React.Fragment>
          )
        })}
      </div>
      <DragOverlay>
        {activeItem ? (
          <div className="kanban-card-drag-preview">
            <div className="kanban-card-title">
              {activeItem.name || activeItem.title}
              {activeItem.unreadCount > 0 && (
                <span className="kanban-card-unread-badge">{activeItem.unreadCount}</span>
              )}
            </div>
            {(() => {
              const address = activeItem.street_address || activeItem.city || activeItem.state || activeItem.zip
                ? [activeItem.street_address, activeItem.city, activeItem.state, activeItem.zip].filter(Boolean).join(', ')
                : activeItem.address
              return address && (
                <div className="kanban-card-subtitle">{address}</div>
              )
            })()}
            {activeItem.install_date && (
              <div className="kanban-card-subtitle">Install: {new Date(activeItem.install_date).toLocaleDateString()}</div>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default KanbanBoard

