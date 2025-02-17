import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useColumns } from '../contexts/ColumnContext';
import TimelineColumn from '../components/TimelineColumn';
import { ColumnType } from '../types/column';

export default function HomePage() {
  const { columns, addColumn, moveColumn } = useColumns();
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnType, setNewColumnType] = useState<ColumnType>('home');
  const [hashtag, setHashtag] = useState('');

  const handleAddColumn = () => {
    if (newColumnType === 'hashtag' && !hashtag) return;

    const title = newColumnType === 'hashtag' 
      ? `#${hashtag}` 
      : newColumnType.charAt(0).toUpperCase() + newColumnType.slice(1);

    addColumn({
      type: newColumnType,
      title,
      ...(newColumnType === 'hashtag' ? { options: { hashtag } } : {})
    });

    setIsAddingColumn(false);
    setHashtag('');
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    moveColumn(result.source.index, result.destination.index);
  };

  return (
    <div className="home-page">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="columns" direction="horizontal">
          {(provided) => (
            <div
              className="columns-container"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {columns.map((column, index) => (
                <Draggable key={column.id} draggableId={column.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <TimelineColumn column={column} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              
              <button 
                className="add-column-button"
                onClick={() => setIsAddingColumn(true)}
              >
                + Add Column
              </button>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {isAddingColumn && (
        <div className="add-column-modal">
          <h3>Add New Column</h3>
          <select 
            value={newColumnType}
            onChange={(e) => setNewColumnType(e.target.value as ColumnType)}
          >
            <option value="home">Home Timeline</option>
            <option value="local">Local Timeline</option>
            <option value="public">Public Timeline</option>
            <option value="notifications">Notifications</option>
            <option value="hashtag">Hashtag</option>
          </select>

          {newColumnType === 'hashtag' && (
            <input
              type="text"
              placeholder="Enter hashtag"
              value={hashtag}
              onChange={(e) => setHashtag(e.target.value)}
            />
          )}

          <div className="modal-buttons">
            <button onClick={handleAddColumn}>Add</button>
            <button onClick={() => setIsAddingColumn(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}