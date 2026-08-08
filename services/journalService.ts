import { supabase } from '../supabase/client';
import { TradeEntry } from '../types';
import { notificationService } from './notificationService';

export const journalService = {
  // Fetch all journal entries for a user
  async getJournalEntries(userId: string): Promise<TradeEntry[]> {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId) // Changed back to user_id for journal entries
        .order('date', { ascending: false });

      if (error) throw error;

      return data.map(entry => ({
        id: entry.id,
        pair: entry.pair,
        type: entry.type,
        entryPrice: entry.entry_price,
        stopLoss: entry.stop_loss,
        takeProfit: entry.take_profit,
        status: entry.status,
        validationResult: entry.validation_result,
        notes: entry.notes,
        date: entry.date,
        emotions: entry.emotions,
        pnl: entry.pnl,
        exitPrice: entry.exit_price,
        screenshotUrl: entry.screenshot_url,
        strategy: entry.strategy,
        timeFrame: entry.time_frame,
        marketCondition: entry.market_condition,
        confidenceLevel: entry.confidence_level,
        riskAmount: entry.risk_amount,
        positionSize: entry.position_size,
        tradeDuration: entry.trade_duration,
        tags: entry.tags,
        adminNotes: entry.admin_notes,
        adminReviewStatus: entry.admin_review_status,
        reviewTimestamp: entry.review_timestamp,
        mentorId: entry.mentor_id,
        sessionId: entry.session_id,
        tradeSource: entry.trade_source
      }));
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      throw error;
    }
  },

  // Create a new journal entry
  async createJournalEntry(entry: Omit<TradeEntry, 'id'>, userId: string): Promise<TradeEntry | null> {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: userId, // Changed back to user_id for journal entries
          pair: entry.pair,
          type: entry.type,
          entry_price: entry.entryPrice,
          stop_loss: entry.stopLoss,
          take_profit: entry.takeProfit,
          exit_price: entry.exitPrice,
          status: entry.status,
          validation_result: entry.validationResult || 'none',
          notes: entry.notes,
          date: entry.date,
          emotions: entry.emotions,
          pnl: entry.pnl,
          screenshot_url: entry.screenshotUrl,
          strategy: entry.strategy,
          time_frame: entry.timeFrame,
          market_condition: entry.marketCondition,
          confidence_level: entry.confidenceLevel,
          risk_amount: entry.riskAmount,
          position_size: entry.positionSize,
          trade_duration: entry.tradeDuration,
          tags: entry.tags,
          admin_notes: entry.adminNotes,
          admin_review_status: entry.adminReviewStatus,
          review_timestamp: entry.reviewTimestamp,
          mentor_id: entry.mentorId,
          session_id: entry.sessionId,
          trade_source: entry.tradeSource
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        pair: data.pair,
        type: data.type,
        entryPrice: data.entry_price,
        stopLoss: data.stop_loss,
        takeProfit: data.take_profit,
        exitPrice: data.exit_price,
        status: data.status,
        validationResult: data.validation_result,
        notes: data.notes,
        date: data.date,
        emotions: data.emotions,
        pnl: data.pnl,
        screenshotUrl: data.screenshot_url,
        strategy: data.strategy,
        timeFrame: data.time_frame,
        marketCondition: data.market_condition,
        confidenceLevel: data.confidence_level,
        riskAmount: data.risk_amount,
        positionSize: data.position_size,
        tradeDuration: data.trade_duration,
        tags: data.tags,
        adminNotes: data.admin_notes,
        adminReviewStatus: data.admin_review_status,
        reviewTimestamp: data.review_timestamp,
        mentorId: data.mentor_id,
        sessionId: data.session_id,
        tradeSource: data.trade_source
      };
    } catch (error) {
      console.error('Error creating journal entry:', error);
      return null;
    }
  },

  // Update a journal entry
  async updateJournalEntry(id: string, updates: Partial<TradeEntry>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .update({
          pair: updates.pair,
          type: updates.type,
          entry_price: updates.entryPrice,
          stop_loss: updates.stopLoss,
          take_profit: updates.takeProfit,
          exit_price: updates.exitPrice,
          status: updates.status,
          validation_result: updates.validationResult || 'none',
          notes: updates.notes,
          date: updates.date,
          emotions: updates.emotions,
          pnl: updates.pnl,
          screenshot_url: updates.screenshotUrl,
          strategy: updates.strategy,
          time_frame: updates.timeFrame,
          market_condition: updates.marketCondition,
          confidence_level: updates.confidenceLevel,
          risk_amount: updates.riskAmount,
          position_size: updates.positionSize,
          trade_duration: updates.tradeDuration,
          tags: updates.tags,
          admin_notes: updates.adminNotes,
          admin_review_status: updates.adminReviewStatus,
          review_timestamp: updates.reviewTimestamp,
          mentor_id: updates.mentorId,
          session_id: updates.sessionId,
          trade_source: updates.tradeSource
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating journal entry:', error);
      return false;
    }
  },

  // Delete a journal entry
  async deleteJournalEntry(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      return false;
    }
  },

  // Admin functions for collaboration
  
  // Get all journal entries for admin view
  async getAllJournalEntriesForAdmin(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_all_trades_for_admin_enhanced');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching all journal entries for admin:', error);
      throw error;
    }
  },

  // Get flagged trades for admin review
  async getFlaggedTradesForReview(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_flagged_trades_for_review');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching flagged trades for review:', error);
      throw error;
    }
  },

  // Get mentor assigned trades
  async getMentorAssignedTrades(mentorId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_mentor_assigned_trades', { mentor_uuid: mentorId });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching mentor assigned trades:', error);
      throw error;
    }
  },

  // Get detailed stats for a student
  async getStudentDetailedStats(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('get_student_detailed_stats', { user_id: userId });
      
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error fetching student detailed stats:', error);
      throw error;
    }
  },

  // Update admin review status
  async updateAdminReviewStatus(entryId: string, status: 'pending' | 'reviewed' | 'flagged', adminNotes?: string, adminName?: string): Promise<boolean> {
    try {
      // First get the trade entry to get the user_id
      const { data: tradeData, error: fetchError } = await supabase
        .from('journal_entries')
        .select('user_id')
        .eq('id', entryId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const updates: any = {
        admin_review_status: status,
        review_timestamp: new Date().toISOString()
      };
      
      if (adminNotes) {
        updates.admin_notes = adminNotes;
      }
      
      const { error } = await supabase
        .from('journal_entries')
        .update(updates)
        .eq('id', entryId);
      
      if (error) throw error;
      
      // Create notification for the student
      if (adminName) {
        await notificationService.createTradeFeedbackNotification(
          entryId, 
          tradeData.user_id, 
          adminName, 
          adminNotes || `Your trade has been ${status}`
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error updating admin review status:', error);
      return false;
    }
  },

  // Assign mentor to a trade
  async assignMentorToTrade(entryId: string, mentorId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .update({ mentor_id: mentorId })
        .eq('id', entryId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error assigning mentor to trade:', error);
      return false;
    }
  }
};