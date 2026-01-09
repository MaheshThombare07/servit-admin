export default function AdminSkeleton() {
  return (
    <div className="admin-list">
      <h3>Existing Admins</h3>
      <div className="admin-grid">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="admin-card skeleton">
            <div className="admin-header">
              <div className="admin-info">
                <div className="skeleton-line name"></div>
                <div className="skeleton-line email"></div>
                <div className="skeleton-line mobile"></div>
              </div>
              <div className="admin-badge">
                <div className="skeleton-badge role"></div>
                <div className="skeleton-badge status"></div>
              </div>
            </div>
            
            <div className="admin-access">
              <div className="skeleton-line access-title"></div>
              <div className="skeleton-tags">
                <div className="skeleton-tag"></div>
                <div className="skeleton-tag"></div>
                <div className="skeleton-tag"></div>
              </div>
            </div>

            <div className="admin-actions">
              <div className="skeleton-button"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
