export function SearchTabs({ activeTab, onTabChange, keyword }) {
  const tabs = [
    { id: 'all', label: 'Tümü', icon: 'bi-grid' },
    { id: 'users', label: 'Kullanıcılar', icon: 'bi-people' },
    { id: 'posts', label: 'Gönderiler', icon: 'bi-chat-square-text' }
  ];

  return (
    <div className="card mb-3">
      <div className="card-header">
        <ul className="nav nav-tabs card-header-tabs">
          {tabs.map(tab => (
            <li key={tab.id} className="nav-item">
              <button
                className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => onTabChange(tab.id)}
              >
                <i className={`${tab.icon} me-2`}></i>
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="card-body py-2">
        <small className="text-muted">
          <strong>"{keyword}"</strong> için arama sonuçları
        </small>
      </div>
    </div>
  );
} 