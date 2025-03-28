import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CommunityPage from './CommunityPage';
import { 
  HomeIcon, 
  UsersIcon, 
  CalendarIcon, 
  UserCircleIcon, 
  CogIcon, 
  LogOutIcon,
  PlusIcon 
} from 'lucide-react';
import './Dashboard.css';
import './CommunityPage.css';

function Dashboard({ user = {}, onLogout }) {
  // Provide default values to prevent undefined errors
  const userName = user.name || 'User';
  const userEmail = user.email || 'user@example.com';

  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [isCreateCommunityModalOpen, setIsCreateCommunityModalOpen] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDescription, setNewCommunityDescription] = useState('');
  
  // Fetch communities on component mount
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await axios.get('/api/communities');
        setCommunities(response.data);
      } catch (error) {
        console.error('Error fetching communities:', error);
      }
    };

    fetchCommunities();
  }, []);

  // Community interaction handlers
  const handleCommunityOpen = (community) => {
    setSelectedCommunity(community);
    setActiveView('community');
  };

  const handleBackToDashboard = () => {
    setSelectedCommunity(null);
    setActiveView('dashboard');
  };

  // Create new community handler
  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/communities', {
        name: newCommunityName,
        description: newCommunityDescription
      });

      // Add new community to list
      setCommunities([...communities, response.data]);
      
      // Reset form and close modal
      setNewCommunityName('');
      setNewCommunityDescription('');
      setIsCreateCommunityModalOpen(false);
    } catch (error) {
      console.error('Error creating community:', error);
      alert('Failed to create community');
    }
  };

  // Render Create Community Modal
  const renderCreateCommunityModal = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create New Community</h2>
        <form onSubmit={handleCreateCommunity}>
          <div>
            <label>Community Name</label>
            <input 
              type="text" 
              value={newCommunityName}
              onChange={(e) => setNewCommunityName(e.target.value)}
              required 
            />
          </div>
          <div>
            <label>Description</label>
            <textarea 
              value={newCommunityDescription}
              onChange={(e) => setNewCommunityDescription(e.target.value)}
              required 
            />
          </div>
          <div className="modal-actions">
            <button 
              type="button" 
              onClick={() => setIsCreateCommunityModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Community
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Render main dashboard view
  const renderDashboard = () => (
    <div className="main-content">
      <div className="header">
        <h1>Welcome back, {userName}!</h1>
        <p>Stay connected with your Spelman community and never miss an update.</p>
        
        <div className="quick-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setActiveView('communities')}
          >
            Browse Communities
          </button>
          <button className="btn btn-secondary">Upcoming Events</button>
        </div>
      </div>
      
      <div className="dashboard-grid">
        <div className="communities-section">
          <div className="section-header">
            <h2>My Communities</h2>
            <a 
              href="#" 
              className="view-all"
              onClick={() => setActiveView('communities')}
            >
              View all
            </a>
          </div>
          {communities.slice(0, 3).map((community) => (
            <div key={community.id} className="community-card">
              <div className="community-icon">🏫</div>
              <div className="community-details">
                <span className="community-name">{community.name}</span>
                <span className="community-members">
                  {community.posts_count?.[0]?.count || 0} posts
                </span>
              </div>
              <button 
                className="btn btn-small"
                onClick={() => handleCommunityOpen(community)}
              >
                Open
              </button>
            </div>
          ))}
        </div>
        
        {/* Existing events section */}
      </div>
    </div>
  );

  // Render communities list view
  const renderCommunitiesList = () => (
    <div className="main-content">
      <div className="header">
        <h1>Campus Communities</h1>
        <p>Explore and join communities across Spelman College</p>
        <button 
          className="btn btn-primary create-community-btn"
          onClick={() => setIsCreateCommunityModalOpen(true)}
        >
          <PlusIcon size={20} /> Create New Community
        </button>
      </div>
      
      <div className="communities-list">
        {communities.map((community) => (
          <div key={community.id} className="community-list-card">
            <div className="community-list-details">
              <h3>{community.name}</h3>
              <p>{community.description || 'No description available'}</p>
              <div className="community-meta">
                <span>{community.posts_count?.[0]?.count || 0} posts</span>
              </div>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => handleCommunityOpen(community)}
            >
              View Community
            </button>
          </div>
        ))}
      </div>
    </div>
  );

// Main render function
return (
  <div className="spelman-connect-dashboard">
    <div className="sidebar">
      <div className="user-profile">
        <div className="user-avatar">
          {userName.charAt(0)}
        </div>
        <div className="user-info">
          <span className="user-name">{userName}</span>
          <span className="user-major">Senior, Computer Science</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <div 
          className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveView('dashboard')}
        >
          <HomeIcon size={20} />
          <span>Dashboard</span>
        </div>
        <div 
          className={`nav-item ${activeView === 'communities' ? 'active' : ''}`}
          onClick={() => setActiveView('communities')}
        >
          <UsersIcon size={20} />
          <span>Communities</span>
        </div>
        <div className="nav-item">
          <CalendarIcon size={20} />
          <span>Campus Events</span>
        </div>
        <div className="nav-item">
          <UserCircleIcon size={20} />
          <span>Profile</span>
        </div>
        <div className="nav-item">
          <CogIcon size={20} />
          <span>Settings</span>
        </div>
      </nav>
      
      <div className="logout-section" onClick={onLogout}>
        <LogOutIcon size={20} />
        <span>Logout</span>
      </div>
    </div>
    
    {/* Conditional rendering based on active view */}
    {activeView === 'dashboard' && renderDashboard()}
    {activeView === 'communities' && renderCommunitiesList()}
    {activeView === 'community' && selectedCommunity && (
      <div>
        <button 
          onClick={handleBackToDashboard} 
          className="back-button"
        >
          ← Back to Communities
        </button>
        <CommunityPage 
          user={user} 
          communityId={selectedCommunity.id} 
          communityName={selectedCommunity.name}
        />
      </div>
    )}
    
    {/* Create Community Modal */}
    {isCreateCommunityModalOpen && renderCreateCommunityModal()}
  </div>
);
}

// Default props to prevent undefined errors
Dashboard.defaultProps = {
user: {
  name: 'User',
  email: 'user@example.com'
},
onLogout: () => {}
};

export default Dashboard;