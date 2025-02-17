import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useColumns } from '../contexts/ColumnContext';
import { useAuth } from '../contexts/AuthContext';
import TimelineColumn from '../components/TimelineColumn';
import { ColumnType } from '../types/column';

export default function HomePage() {
  const { columns, addColumn } = useColumns();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnType, setNewColumnType] = useState<ColumnType>('home');
  const [hashtag, setHashtag] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
      <div className="header">
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <div className="columns-container">
        {columns.map((column, index) => (
          <TimelineColumn 
            key={column.id} 
            column={column}
            index={index}
            isFirst={index === 0}
            isLast={index === columns.length - 1}
          />
        ))}
        
        <button 
          className="add-column-button"
          onClick={() => setIsAddingColumn(true)}
        >
          + Add Column
        </button>
      </div>

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