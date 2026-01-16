import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiMail, FiClock, FiUser, FiMapPin, FiTool, FiCheckCircle, FiFileText, FiX, FiCheck, FiEdit } from 'react-icons/fi'
import { BsLightningChargeFill } from 'react-icons/bs'
import { getPartner, verifyPartner, rejectPartner } from '../api'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import './PartnerDetail.css'

export default function PartnerDetail() {
    const { partnerId } = useParams()
    const navigate = useNavigate()
    const [partner, setPartner] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [rejectForm, setRejectForm] = useState({ rejectionReason: '', remark: '' })
    const [actionLoading, setActionLoading] = useState(false)
    const [zoomedImage, setZoomedImage] = useState(null)

    useEffect(() => {
        loadPartner()
    }, [partnerId])

    async function loadPartner() {
        setLoading(true)
        try {
            const data = await getPartner(partnerId)
            setPartner(data)
        } catch (error) {
            console.error('Error loading partner:', error)
            alert('Failed to load partner details')
            navigate('/partners')
        } finally {
            setLoading(false)
        }
    }

    async function handleVerify() {
        if (!confirm('Are you sure you want to verify this partner?')) return

        setActionLoading(true)
        try {
            await verifyPartner(partnerId)
            alert('Partner verified successfully!')
            navigate('/partners')
        } catch (error) {
            alert('Error verifying partner: ' + (error.response?.data?.error || error.message))
        } finally {
            setActionLoading(false)
        }
    }

    async function handleReject() {
        if (!rejectForm.rejectionReason.trim()) {
            alert('Please provide a rejection reason')
            return
        }

        setActionLoading(true)
        try {
            await rejectPartner(partnerId, rejectForm.rejectionReason, rejectForm.remark)
            setShowRejectModal(false)
            alert('Partner rejected successfully!')
            navigate('/partners')
        } catch (error) {
            alert('Error rejecting partner: ' + (error.response?.data?.error || error.message))
        } finally {
            setActionLoading(false)
        }
    }

    function formatDate(timestamp) {
        if (!timestamp) return 'N/A'
        if (timestamp && typeof timestamp === 'object' && timestamp._seconds) {
            return new Date(timestamp._seconds * 1000).toLocaleString()
        }
        if (typeof timestamp === 'number') {
            return new Date(timestamp).toLocaleString()
        }
        return 'N/A'
    }

    if (loading) {
        return (
            <div className="partner-detail-page">
                <div className="loading-state">
                    <LoadingSpinner size="large" />
                    <p>Loading partner details...</p>
                </div>
            </div>
        )
    }

    if (!partner) {
        return (
            <div className="partner-detail-page">
                <div className="empty-state">
                    <h3>Partner Not Found</h3>
                    <button className="btn" onClick={() => navigate('/partners')}>
                        Back to Partners
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="partner-detail-page">
            {/* Header with Back Button */}
            <div className="detail-page-header">
                <button className="back-btn" onClick={() => navigate('/partners')}>
                    <FiArrowLeft /> Back to Partners
                </button>
                <h1>Partner Verification</h1>
            </div>

            {/* Large Profile Header */}
            <div className="profile-header-section">
                <div className="profile-header-left">
                    <div className="profile-avatar-large">
                        {partner?.profilePhotoUrl ? (
                            <img
                                src={partner.profilePhotoUrl}
                                alt={partner.personalDetails?.fullName || 'Partner'}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    const placeholder = e.target.nextElementSibling;
                                    if (placeholder) placeholder.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div
                            className="avatar-placeholder-large"
                            style={{ display: partner?.profilePhotoUrl ? 'none' : 'flex' }}
                        >
                            {(partner.personalDetails?.fullName || partner.fullName || 'P')[0]?.toUpperCase() || 'P'}
                        </div>
                        <div className="online-indicator"></div>
                    </div>
                    <div className="profile-header-info">
                        <h1 className="profile-name">{partner.personalDetails?.fullName || partner.fullName || 'N/A'}</h1>
                        <div className="profile-meta">
                            {partner.services && partner.services.length > 0 && (
                                <>
                                    <span className="profile-service"><BsLightningChargeFill /> {partner.services[0]}</span>
                                    <span className="profile-divider">•</span>
                                </>
                            )}
                            <span className="profile-id">ID: SP-{partner.id?.substring(0, 4).toUpperCase() || 'N/A'}</span>
                        </div>
                        <div className={`profile-status-badge ${partner.status || 'pending_verification'}`}>
                            {partner.status === 'pending_verification' ? '● Pending Review' :
                                partner.status === 'verified' ? '● Verified' :
                                    partner.status === 'rejected' ? '● Rejected' : '● Pending Review'}
                        </div>
                    </div>
                </div>
                <div className="profile-header-actions">
                    <button className="btn-header outline">
                        <FiMail /> Message
                    </button>
                    <button className="btn-header outline">
                        <FiClock /> History
                    </button>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="detail-grid">
                {/* Left Column */}
                <div className="detail-column-left">
                    {/* Personal Information */}
                    <div className="detail-card">
                        <h3><FiUser /> Personal Information</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>FULL NAME</label>
                                <div>{partner.personalDetails?.fullName || partner.fullName || 'N/A'}</div>
                            </div>
                            <div className="info-item">
                                <label>GENDER</label>
                                <div>{partner.personalDetails?.gender || 'Male'}</div>
                            </div>
                            <div className="info-item">
                                <label>EMAIL ADDRESS</label>
                                <div className="email-value">
                                    {partner.email || 'N/A'}
                                    {partner.email && <span className="verified-icon">✓</span>}
                                </div>
                            </div>
                            <div className="info-item">
                                <label>PHONE NUMBER</label>
                                <div>{partner.personalDetails?.mobileNo || partner.personalDetails?.phoneNumber || 'N/A'}</div>
                            </div>
                            <div className="info-item">
                                <label>PINCODE</label>
                                <div>{partner?.pincode || 'N/A'}</div>
                            </div>
                            <div className="info-item">
                                <label>REGISTERED AT</label>
                                <div>{formatDate(partner.createdAt)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Service Expertise */}
                    <div className="detail-card">
                        <h3><FiTool /> Service Expertise</h3>
                        {partner.services && partner.services.length > 0 ? (
                            <>
                                {partner.services.map((service, index) => (
                                    <div key={service} className="service-expertise-item">
                                        <div className="service-label">SELECTED SERVICE</div>
                                        <div className="service-badge-large">
                                            <BsLightningChargeFill /> {service}
                                        </div>

                                        {partner.subServices?.[service] && partner.subServices[service].length > 0 && (
                                            <>
                                                <div className="sub-services-label">SUB-SERVICES</div>
                                                <div className="sub-services-pills">
                                                    {partner.subServices[service].map(subService => (
                                                        <span key={subService} className="sub-service-pill">
                                                            {subService}
                                                        </span>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div className="empty-text">No services added</div>
                        )}
                    </div>

                    {/* Documents */}
                    <div className="detail-card">
                        <h3><FiFileText /> Documents</h3>
                        <p className="card-subtitle">Review submitted Aadhaar verification documents.</p>
                        <div className="documents-grid">
                            {(() => {
                                const getField = (obj, ...paths) => {
                                    for (const path of paths) {
                                        const value = path.split('.').reduce((o, p) => o?.[p], obj);
                                        if (value && typeof value === 'string' && value.trim() !== '') {
                                            return value;
                                        }
                                    }
                                    return null;
                                };

                                const aadhaarFront = getField(partner, 'aadhaarFrontUrl', 'aadhaarFront', 'documents.aadhaarFrontUrl');
                                const aadhaarBack = getField(partner, 'aadhaarBackUrl', 'aadhaarBack', 'documents.aadhaarBackUrl');

                                if (!aadhaarFront && !aadhaarBack) {
                                    return <div className="empty-text">No documents uploaded</div>;
                                }

                                return (
                                    <>
                                        {aadhaarFront && (
                                            <div className="document-card">
                                                <div className="document-label">Aadhaar Front</div>
                                                <div
                                                    className="document-image-wrapper"
                                                    onClick={() => setZoomedImage(aadhaarFront)}
                                                >
                                                    <img src={aadhaarFront} alt="Aadhaar Front" className="document-image" />
                                                    <div className="zoom-overlay">Click to zoom</div>
                                                </div>
                                            </div>
                                        )}
                                        {aadhaarBack && (
                                            <div className="document-card">
                                                <div className="document-label">Aadhaar Back</div>
                                                <div
                                                    className="document-image-wrapper"
                                                    onClick={() => setZoomedImage(aadhaarBack)}
                                                >
                                                    <img src={aadhaarBack} alt="Aadhaar Back" className="document-image" />
                                                    <div className="zoom-overlay">Click to zoom</div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Validation Decision */}
                    {partner.status === 'pending_verification' && (
                        <div className="detail-card">
                            <h3><FiEdit /> Validation Decision</h3>
                            <p className="card-subtitle">Internal Notes / Rejection Reason</p>
                            <textarea
                                className="validation-textarea"
                                placeholder="Enter notes here (required for rejection)..."
                                value={rejectForm.rejectionReason}
                                onChange={(e) => setRejectForm(f => ({ ...f, rejectionReason: e.target.value }))}
                                rows="4"
                            />
                            <div className="validation-actions">
                                <button
                                    className="btn-action reject"
                                    onClick={() => setShowRejectModal(true)}
                                    disabled={actionLoading}
                                >
                                    <FiX /> Reject Profile
                                </button>
                                <button
                                    className="btn-action request"
                                    disabled={actionLoading}
                                >
                                    <FiEdit /> Request Changes
                                </button>
                                <button
                                    className="btn-action approve"
                                    onClick={handleVerify}
                                    disabled={actionLoading}
                                >
                                    <FiCheck /> Approve Profile
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div className="detail-column-right">
                    {/* Location Information */}
                    <div className="detail-card">
                        <h3><FiMapPin /> Location Information</h3>
                        <div className="info-grid">
                            <div className="info-item full-width">
                                <label>ADDRESS</label>
                                <div>{partner.address || partner.locationDetails?.address || 'N/A'}</div>
                            </div>
                            <div className="info-item">
                                <label>CITY</label>
                                <div>{partner.city || partner.locationDetails?.city || 'N/A'}</div>
                            </div>
                            <div className="info-item">
                                <label>STATE</label>
                                <div>{partner.state || partner.locationDetails?.state || 'N/A'}</div>
                            </div>
                            <div className="info-item">
                                <label>PINCODE</label>
                                <div>{partner?.pincode || 'N/A'}</div>
                            </div>
                            <div className="info-item">
                                <label>SERVICE RADIUS</label>
                                <div className="radius-value">{partner.serviceRadius || '25'} KM</div>
                            </div>
                        </div>
                    </div>

                    {/* Verification Status */}
                    <div className="detail-card">
                        <h3><FiCheckCircle /> Verification Status</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Current Status</label>
                                <div className={`status-badge-large ${partner.status || 'pending_verification'}`}>
                                    {partner.status === 'pending_verification' ? 'Pending' :
                                        partner.status === 'verified' ? 'Verified' :
                                            partner.status === 'rejected' ? 'Rejected' : 'Pending'}
                                </div>
                            </div>
                            {partner.verificationDetails?.verified && (
                                <>
                                    <div className="info-item">
                                        <label>Verified At</label>
                                        <div>{formatDate(partner.verificationDetails?.verifiedAt) || '--/--/----'}</div>
                                    </div>
                                    <div className="info-item">
                                        <label>Verified By</label>
                                        <div>{partner.verificationDetails?.verifiedBy || '--'}</div>
                                    </div>
                                </>
                            )}
                            {partner.verificationDetails?.rejected && (
                                <div className="info-item full-width">
                                    <label>Rejection Reason</label>
                                    <div>{partner.verificationDetails?.rejectionReason || 'N/A'}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Zoom Modal */}
            {zoomedImage && (
                <div className="modal-overlay" onClick={() => setZoomedImage(null)}>
                    <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setZoomedImage(null)}>✕</button>
                        <img src={zoomedImage} alt="Zoomed document" className="zoomed-image" />
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Reject Partner</h2>
                            <button className="modal-close" onClick={() => setShowRejectModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to reject this partner? This action cannot be undone.</p>
                            <button
                                className="btn danger"
                                onClick={handleReject}
                                disabled={actionLoading || !rejectForm.rejectionReason.trim()}
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
