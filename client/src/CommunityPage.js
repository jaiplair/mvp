import React, { useState, useEffect } from 'react';
import { ImageIcon, SendIcon, FileIcon } from 'lucide-react';
import axios from 'axios';

function CommunityPage({ user, communityId, communityName }) {
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [community, setCommunity] = useState(null);

  // Fetch community details and posts when component mounts
  useEffect(() => {
    const fetchCommunityDetails = async () => {
      try {
        // Fetch community details
        const communityResponse = await axios.get(`/api/communities/${communityId}`);
        setCommunity(communityResponse.data);

        // Fetch posts for this community
        const postsResponse = await axios.get(`/api/posts/${communityId}`);
        setPosts(postsResponse.data);
      } catch (err) {
        console.error('Error fetching community details:', err);
        setError('Failed to load community. Please try again later.');
      }
    };

    fetchCommunityDetails();
  }, [communityId]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) {  // 5MB limit
      setSelectedImage(file);
    } else {
      alert('File must be 5MB or smaller');
    }
  };

  const handlePostSubmit = async (event) => {
    event.preventDefault();
    
    if (!newPostText.trim() && !selectedImage) {
      setError('Please enter a post or upload an image');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('communityId', communityId);
      
      if (newPostText.trim()) {
        formData.append('text', newPostText.trim());
      }
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const token = localStorage.getItem('access_token');

      const response = await axios.post('/api/posts', formData, {
      headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}` // Attach token
      }
    });
      // Add new post to the top of the list
      setPosts([response.data, ...posts]);
      
      // Reset form
      setNewPostText('');
      setSelectedImage(null);
    } catch (err) {
      console.error('Error posting:', err);
      const errorMessage = err.response?.data?.error || 
                           err.response?.data?.details || 
                           'Failed to create post. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // In the posts rendering section, update to use the new structure
  {posts.map((post) => (
    <div key={post.id} className="post-card">
      <div className="post-header">
        <div className="post-author-avatar">
          {post.user_name ? post.user_name.charAt(0) : 'U'}
        </div>
        <div className="post-author-info">
          <span className="post-author-name">
            {post.user_name || 'Anonymous User'}
          </span>
          <span className="post-timestamp">
            {new Date(post.created_at).toLocaleString()}
          </span>
        </div>
      </div>
      <div className="post-content">
        <p>{post.text}</p>
        {post.image_url && (
          <img 
            src={post.image_url} 
            alt="Post" 
            className="post-image" 
            onClick={() => window.open(post.image_url, '_blank')}
          />
        )}
      </div>
    </div>
  ))}

  const removeSelectedImage = () => {
    setSelectedImage(null);
  };

  if (error) {
    return (
      <div className="error-container">
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => setError(null)} className="btn btn-secondary">
          Try Again
        </button>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading community details...</p>
      </div>
    );
  }

  return (
    <div className="community-page">
      <div className="community-header">
        <h1>{community.name}</h1>
        <p>{community.description || 'No description available'}</p>
      </div>
      
      <div className="post-creation-section">
        <form onSubmit={handlePostSubmit} className="post-form">
          <textarea 
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            placeholder={`Share something in ${community.name}...`}
            className="post-textarea"
            rows={3}
          />
          <div className="post-actions">
            <label className="image-upload-label">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <ImageIcon size={24} />
            </label>
            {selectedImage && (
              <div className="selected-image-preview">
                <FileIcon size={16} />
                <span>{selectedImage.name}</span>
                <button 
                  type="button" 
                  onClick={removeSelectedImage} 
                  className="remove-image-btn"
                >
                  ✕
                </button>
              </div>
            )}
            <button 
              type="submit" 
              className="post-submit-btn" 
              disabled={loading}
            >
              {loading ? 'Posting...' : <SendIcon size={20} />}
            </button>
          </div>
        </form>
      </div>
      
      <div className="posts-section">
        {posts.length === 0 ? (
          <div className="no-posts">
            <p>No posts yet. Be the first to post in {community.name}!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <div className="post-author-avatar">
                  {post.users?.name ? post.users.name.charAt(0) : 'U'}
                </div>
                <div className="post-author-info">
                  <span className="post-author-name">
                    {post.users?.name || 'Anonymous User'}
                  </span>
                  <span className="post-timestamp">
                    {new Date(post.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="post-content">
                <p>{post.text}</p>
                {post.image_url && (
                  <img 
                    src={post.image_url} 
                    alt="Post" 
                    className="post-image" 
                    onClick={() => window.open(post.image_url, '_blank')}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CommunityPage;