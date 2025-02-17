import { useState } from 'react';
import { useColumns } from '../contexts/ColumnContext';
import TimelineColumn from '../components/TimelineColumn';
import { ColumnType } from '../types/column';

export default function HomePage() {
  const { columns, addColumn } = useColumns();
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

  return (
    <div className="home-page">
      <div className="columns-container">
        {columns.map(column => (
          <TimelineColumn key={column.id} column={column} />
        ))}
        
        <button 
          className="add-column-button"
          onClick={() => setIsAddingColumn(true)}
        >
          + Add Column
        </button>

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
    </div>
  );
}