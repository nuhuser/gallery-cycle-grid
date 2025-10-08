// Audit logging utilities for security monitoring

import { supabase } from '@/integrations/supabase/client';

interface AuditLogEntry {
  action: string;
  resource_type: string;
  resource_id?: string;
  user_id: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export const logAdminAction = async (
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, any>
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Audit log: No authenticated user found');
      return;
    }

    // Log to console for immediate monitoring
    console.log('Admin Action:', {
      user: user.email,
      action,
      resource: `${resourceType}:${resourceId || 'N/A'}`,
      timestamp: new Date().toISOString(),
      details,
    });

    // Use the secure server-side function to insert audit logs
    // This prevents users from inserting fake logs or manipulating user_id
    const { data, error: rpcError } = await supabase.rpc('insert_audit_log', {
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_details: details,
      p_ip_address: await getClientIP(),
      p_user_agent: navigator.userAgent,
    });

    if (rpcError) {
      console.error('Failed to insert audit log:', rpcError);
      // Fallback to localStorage if database insert fails
      const auditLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      auditLogs.push({
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        user_id: user.id,
        details,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
      
      // Keep only the last 100 entries to prevent storage bloat
      if (auditLogs.length > 100) {
        auditLogs.splice(0, auditLogs.length - 100);
      }
      
      localStorage.setItem('audit_logs', JSON.stringify(auditLogs));
    }

  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't throw error to avoid breaking the main functionality
  }
};

const getClientIP = async (): Promise<string> => {
  try {
    // In a real application, you might get this from the server
    // For now, we'll use a fallback
    return 'client-side';
  } catch {
    return 'unknown';
  }
};

// Predefined action types for consistency
export const AUDIT_ACTIONS = {
  PROJECT_CREATE: 'project.create',
  PROJECT_UPDATE: 'project.update',
  PROJECT_DELETE: 'project.delete',
  PROJECT_PUBLISH: 'project.publish',
  PROJECT_UNPUBLISH: 'project.unpublish',
  FILE_UPLOAD: 'file.upload',
  FILE_DELETE: 'file.delete',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  ADMIN_ACCESS: 'admin.access',
} as const;