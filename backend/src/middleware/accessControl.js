import { db } from '../lib/firebase.js';

export function checkAccess(requiredAccess) {
  return async (req, res, next) => {
    try {
      const { admin } = req;
      
      // Super admins have access to everything
      if (admin.role === 'super_admin') {
        return next();
      }

      // Check if sub-admin has the required access
      if (admin.role === 'sub_admin') {
        const adminAccess = admin.access || [];
        
        if (adminAccess.includes(requiredAccess)) {
          return next();
        }
        
        return res.status(403).json({ 
          ok: false, 
          error: `Access denied. Required permission: ${requiredAccess}` 
        });
      }

      return res.status(403).json({ 
        ok: false, 
        error: 'Access denied. Invalid role.' 
      });
    } catch (error) {
      console.error('[access control]', error);
      return res.status(500).json({ 
        ok: false, 
        error: 'Internal server error' 
      });
    }
  };
}

export function enhanceAdminWithAccess(adminDoc) {
  const admin = adminDoc.data();
  return {
    ...admin,
    id: adminDoc.id,
    password: undefined // Never send password to client
  };
}
