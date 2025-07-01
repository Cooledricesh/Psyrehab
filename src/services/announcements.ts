import { supabase } from '../lib/supabase';
import type { 
  Announcement, 
  CreateAnnouncementData, 
  UpdateAnnouncementData,
  AnnouncementFilters
} from '../types/announcement';

export const announcementService = {
  /**
   * Get all announcements with optional filtering
   */
  async getAnnouncements(filters?: AnnouncementFilters): Promise<Announcement[]> {
    let query = supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.dateRange) {
      if (filters.dateRange.start) {
        query = query.gte('start_date', filters.dateRange.start);
      }
      if (filters.dateRange.end) {
        query = query.lte('end_date', filters.dateRange.end);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch announcements: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Get a single announcement by ID
   */
  async getAnnouncementById(id: string): Promise<Announcement | null> {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        administrators!announcements_created_by_fkey(
          full_name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch announcement: ${error.message}`);
    }

    return {
      ...data,
      createdByName: data.administrators?.full_name || 'Unknown'
    };
  },

  /**
   * Create a new announcement
   */
  async createAnnouncement(announcementData: CreateAnnouncementData): Promise<Announcement> {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        ...announcementData,
        created_by: userData.user.id
      })
      .select(`
        *,
        administrators!announcements_created_by_fkey(
          full_name
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create announcement: ${error.message}`);
    }

    return {
      ...data,
      createdByName: data.administrators?.full_name || 'Unknown'
    };
  },

  /**
   * Update an existing announcement
   */
  async updateAnnouncement(id: string, updates: UpdateAnnouncementData): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        administrators!announcements_created_by_fkey(
          full_name
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update announcement: ${error.message}`);
    }

    return {
      ...data,
      createdByName: data.administrators?.full_name || 'Unknown'
    };
  },

  /**
   * Delete an announcement
   */
  async deleteAnnouncement(id: string): Promise<void> {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete announcement: ${error.message}`);
    }
  },

  /**
   * Get announcement statistics
   */
  async getAnnouncementStats(): Promise<{
    total: number;
    active: number;
    totalViews: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    const { data, error } = await supabase
      .from('announcements')
      .select('type, priority, status, views_count');

    if (error) {
      throw new Error(`Failed to fetch announcement stats: ${error.message}`);
    }

    const total = data.length;
    const active = data.filter(a => a.status === 'active').length;
    const totalViews = data.reduce((sum, a) => sum + (a.views_count || 0), 0);
    
    const byType = data.reduce((acc, announcement) => {
      acc[announcement.type] = (acc[announcement.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = data.reduce((acc, announcement) => {
      acc[announcement.priority] = (acc[announcement.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      active,
      totalViews,
      byType,
      byPriority
    };
  },

  /**
   * Increment views count for an announcement
   */
  async incrementViews(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_announcement_views', {
      announcement_id: id
    });

    if (error) {
      throw new Error(`Failed to increment views: ${error.message}`);
    }
  },

  /**
   * Get active announcements for display (non-expired)
   */
  async getActiveAnnouncements(): Promise<Announcement[]> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('status', 'active')
      .lte('start_date', now)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch active announcements: ${error.message}`);
    }

    return data || [];
  }
}; 