import { supabase } from '../supabase/client';

/* ─── Types & Interfaces ─────────────────────────────────────────────────── */

export interface PoolPackage {
  id: string;
  name: string;
  description?: string;
  duration_value: number;
  duration_unit: 'hours' | 'days';
  min_amount: number;
  max_amount?: number | null;
  roi_percentage: number;
  risk_level: 'low' | 'medium' | 'high';
  recommended?: boolean;
  is_active: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PoolApplication {
  id: string;
  user_id: string;
  package_id: string;
  amount: number;
  payment_method?: string;
  transaction_reference?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_amount?: number;
  expected_return?: number;
  custom_maturity_date?: string;
  rejection_reason?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  // Embedded / joined fields
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  package_name?: string;
  package?: PoolPackage;
}

export interface PoolInvestment {
  id: string;
  user_id: string;
  application_id?: string;
  package_id: string;
  invested_amount: number;
  expected_return: number;
  total_payout: number;
  start_date: string;
  maturity_date: string;
  original_maturity_date?: string;
  status: 'active' | 'matured' | 'withdrawal_pending' | 'withdrawn' | 'cancelled';
  extension_count?: number;
  last_extended_at?: string;
  extension_reason?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at?: string;
  // Embedded / joined fields
  user_name?: string;
  user_email?: string;
  package_name?: string;
  roi_pct?: number;
  package?: PoolPackage;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  investment_id: string;
  amount: number;
  payment_method: string;
  wallet_address: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'declined';
  processed_by?: string;
  processed_at?: string;
  transaction_hash?: string;
  failure_reason?: string;
  created_at: string;
  updated_at?: string;
  // Joined fields
  user_name?: string;
  user_email?: string;
  package_name?: string;
}

export interface VipRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  rejection_reason?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

/* ─── Default Packages (Clean Slate for Admin) ──────────────────────────── */
export const DEFAULT_PACKAGES: PoolPackage[] = [];

/* ─── Service Methods ────────────────────────────────────────────────────── */

export const poolTradingService = {
  /* ══════════════════════════════════════════════════════════════════════════
     PACKAGES
  ══════════════════════════════════════════════════════════════════════════ */

  /**
   * Fetch all packages (Admin view: active & inactive)
   */
  async getPackages(): Promise<PoolPackage[]> {
    try {
      const { data, error } = await supabase
        .from('pool_trading_packages')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Error fetching packages from DB:', error.message);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        duration_value: Number(p.duration_value),
        duration_unit: p.duration_unit as 'hours' | 'days',
        min_amount: Number(p.min_amount),
        max_amount: p.max_amount !== null && p.max_amount !== undefined ? Number(p.max_amount) : undefined,
        roi_percentage: Number(p.roi_percentage),
        risk_level: (p.risk_level || 'medium') as 'low' | 'medium' | 'high',
        recommended: Boolean(p.recommended),
        is_active: Boolean(p.is_active),
        sort_order: Number(p.sort_order || 0),
        created_at: p.created_at,
        updated_at: p.updated_at,
      }));
    } catch (err) {
      console.error('getPackages error:', err);
      return DEFAULT_PACKAGES;
    }
  },

  /**
   * Fetch only active packages (Student view)
   */
  async getActivePackages(): Promise<PoolPackage[]> {
    const all = await this.getPackages();
    return all.filter(p => p.is_active);
  },

  /**
   * Create a new package (Admin)
   */
  async createPackage(pkg: Omit<PoolPackage, 'id' | 'created_at' | 'updated_at'>): Promise<PoolPackage> {
    const newRecord = {
      name: pkg.name,
      description: pkg.description || '',
      duration_value: pkg.duration_value,
      duration_unit: pkg.duration_unit,
      min_amount: pkg.min_amount,
      max_amount: pkg.max_amount ?? null,
      roi_percentage: pkg.roi_percentage,
      risk_level: pkg.risk_level,
      recommended: pkg.recommended || false,
      is_active: pkg.is_active !== undefined ? pkg.is_active : true,
      sort_order: pkg.sort_order || 0,
    };

    const { data, error } = await supabase
      .from('pool_trading_packages')
      .insert(newRecord)
      .select()
      .single();

    if (error) {
      console.error('Failed to create package:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      duration_value: Number(data.duration_value),
      duration_unit: data.duration_unit,
      min_amount: Number(data.min_amount),
      max_amount: data.max_amount ? Number(data.max_amount) : undefined,
      roi_percentage: Number(data.roi_percentage),
      risk_level: data.risk_level,
      recommended: Boolean(data.recommended),
      is_active: Boolean(data.is_active),
      sort_order: Number(data.sort_order || 0),
    };
  },

  /**
   * Update existing package (Admin)
   */
  async updatePackage(id: string, updates: Partial<PoolPackage>): Promise<PoolPackage> {
    const payload: any = { ...updates, updated_at: new Date().toISOString() };
    delete payload.id;

    const { data, error } = await supabase
      .from('pool_trading_packages')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update package:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      duration_value: Number(data.duration_value),
      duration_unit: data.duration_unit,
      min_amount: Number(data.min_amount),
      max_amount: data.max_amount ? Number(data.max_amount) : undefined,
      roi_percentage: Number(data.roi_percentage),
      risk_level: data.risk_level,
      recommended: Boolean(data.recommended),
      is_active: Boolean(data.is_active),
      sort_order: Number(data.sort_order || 0),
    };
  },

  /**
   * Toggle package active status (Admin)
   */
  async togglePackageActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('pool_trading_packages')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Delete package (Admin)
   */
  async deletePackage(id: string): Promise<void> {
    const { error } = await supabase
      .from('pool_trading_packages')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Real-time subscription to packages table
   */
  subscribePackages(callback: (payload: any) => void) {
    const channel = supabase
      .channel('public:pool_trading_packages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pool_trading_packages' },
        (payload) => callback(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /* ══════════════════════════════════════════════════════════════════════════
     APPLICATIONS
  ══════════════════════════════════════════════════════════════════════════ */

  /**
   * Fetch all applications (Admin)
   */
  async getApplications(): Promise<PoolApplication[]> {
    try {
      // First fetch applications
      const { data: apps, error: appErr } = await supabase
        .from('pool_trading_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (appErr) throw appErr;
      if (!apps || apps.length === 0) return [];

      // Fetch related profiles and packages in batch
      const userIds = Array.from(new Set(apps.map(a => a.user_id).filter(Boolean)));
      const packageIds = Array.from(new Set(apps.map(a => a.package_id).filter(Boolean)));

      let profilesMap: Record<string, { full_name?: string; email?: string; phone?: string }> = {};
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        if (profs) {
          profs.forEach(p => {
            profilesMap[p.id] = { full_name: p.full_name, email: p.email };
          });
        }
      }

      let packagesMap: Record<string, PoolPackage> = {};
      if (packageIds.length > 0) {
        const { data: pkgs } = await supabase
          .from('pool_trading_packages')
          .select('*')
          .in('id', packageIds);

        if (pkgs) {
          pkgs.forEach(p => {
            packagesMap[p.id] = {
              id: p.id,
              name: p.name,
              duration_value: Number(p.duration_value),
              duration_unit: p.duration_unit,
              min_amount: Number(p.min_amount),
              roi_percentage: Number(p.roi_percentage),
              risk_level: p.risk_level,
              is_active: Boolean(p.is_active),
            };
          });
        }
      }

      return apps.map(a => {
        const prof = profilesMap[a.user_id] || {};
        const pkg = packagesMap[a.package_id];
        return {
          id: a.id,
          user_id: a.user_id,
          package_id: a.package_id,
          amount: Number(a.amount || a.approved_amount || 0),
          payment_method: a.payment_method || 'Crypto',
          transaction_reference: a.transaction_reference || '',
          notes: a.notes || '',
          status: a.status as 'pending' | 'approved' | 'rejected',
          approved_amount: a.approved_amount ? Number(a.approved_amount) : undefined,
          expected_return: a.expected_return ? Number(a.expected_return) : undefined,
          custom_maturity_date: a.custom_maturity_date,
          rejection_reason: a.rejection_reason,
          created_at: a.created_at,
          reviewed_at: a.reviewed_at,
          reviewed_by: a.reviewed_by,
          user_name: prof.full_name || 'Anonymous Trader',
          user_email: prof.email || 'student@platform.com',
          package_name: pkg?.name || 'Pool Plan',
          package: pkg,
        };
      });
    } catch (err) {
      console.error('getApplications error:', err);
      return [];
    }
  },

  /**
   * Fetch applications for a specific user (Student)
   */
  async getUserApplications(userId: string): Promise<PoolApplication[]> {
    try {
      const { data: apps, error } = await supabase
        .from('pool_trading_applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!apps) return [];

      const packageIds = Array.from(new Set(apps.map(a => a.package_id).filter(Boolean)));
      let packagesMap: Record<string, PoolPackage> = {};
      if (packageIds.length > 0) {
        const { data: pkgs } = await supabase
          .from('pool_trading_packages')
          .select('*')
          .in('id', packageIds);

        if (pkgs) {
          pkgs.forEach(p => {
            packagesMap[p.id] = {
              id: p.id,
              name: p.name,
              duration_value: Number(p.duration_value),
              duration_unit: p.duration_unit,
              min_amount: Number(p.min_amount),
              roi_percentage: Number(p.roi_percentage),
              risk_level: p.risk_level,
              is_active: Boolean(p.is_active),
            };
          });
        }
      }

      return apps.map(a => ({
        id: a.id,
        user_id: a.user_id,
        package_id: a.package_id,
        amount: Number(a.amount || 0),
        payment_method: a.payment_method || 'Crypto',
        transaction_reference: a.transaction_reference || '',
        notes: a.notes || '',
        status: a.status as 'pending' | 'approved' | 'rejected',
        approved_amount: a.approved_amount ? Number(a.approved_amount) : undefined,
        expected_return: a.expected_return ? Number(a.expected_return) : undefined,
        custom_maturity_date: a.custom_maturity_date,
        rejection_reason: a.rejection_reason,
        created_at: a.created_at,
        package_name: packagesMap[a.package_id]?.name || 'Pool Plan',
        package: packagesMap[a.package_id],
      }));
    } catch (err) {
      console.error('getUserApplications error:', err);
      return [];
    }
  },

  /**
   * Submit a new pool trading application (Student)
   */
  async submitApplication(params: {
    userId: string;
    packageId: string;
    amount: number;
    paymentMethod?: string;
    transactionReference?: string;
    notes?: string;
  }): Promise<PoolApplication> {
    const record = {
      user_id: params.userId,
      package_id: params.packageId,
      amount: params.amount,
      payment_method: params.paymentMethod || 'Crypto',
      transaction_reference: params.transactionReference || '',
      notes: params.notes || '',
      status: 'pending',
    };

    const { data, error } = await supabase
      .from('pool_trading_applications')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error('Failed to submit pool application:', error);
      throw error;
    }

    return {
      id: data.id,
      user_id: data.user_id,
      package_id: data.package_id,
      amount: Number(data.amount),
      payment_method: data.payment_method,
      transaction_reference: data.transaction_reference,
      notes: data.notes,
      status: data.status,
      created_at: data.created_at,
    };
  },

  /**
   * Approve application & create active investment (Admin)
   */
  async approveApplication(params: {
    applicationId: string;
    userId: string;
    packageId: string;
    amount: number;
    durationValue: number;
    durationUnit: 'hours' | 'days';
    roiPercentage: number;
    customMaturityDate?: string;
    adminId?: string;
  }): Promise<PoolInvestment> {
    const startDate = new Date();
    let maturityDate: Date;

    if (params.customMaturityDate) {
      maturityDate = new Date(params.customMaturityDate);
    } else {
      maturityDate = new Date(startDate.getTime());
      if (params.durationUnit === 'hours') {
        maturityDate.setHours(maturityDate.getHours() + params.durationValue);
      } else {
        maturityDate.setDate(maturityDate.getDate() + params.durationValue);
      }
    }

    const expectedReturn = (params.amount * params.roiPercentage) / 100;
    const totalPayout = params.amount + expectedReturn;

    // 1. Create active investment record
    const investmentRecord = {
      user_id: params.userId,
      application_id: params.applicationId,
      package_id: params.packageId,
      invested_amount: params.amount,
      expected_return: expectedReturn,
      total_payout: totalPayout,
      start_date: startDate.toISOString(),
      maturity_date: maturityDate.toISOString(),
      original_maturity_date: maturityDate.toISOString(),
      status: 'active',
    };

    const { data: inv, error: invErr } = await supabase
      .from('pool_trading_investments')
      .insert(investmentRecord)
      .select()
      .single();

    if (invErr) {
      console.error('Failed to create investment record:', invErr);
      throw invErr;
    }

    // 2. Mark application as approved
    const { error: appErr } = await supabase
      .from('pool_trading_applications')
      .update({
        status: 'approved',
        approved_amount: params.amount,
        expected_return: expectedReturn,
        custom_maturity_date: maturityDate.toISOString(),
        reviewed_at: new Date().toISOString(),
        reviewed_by: params.adminId || null,
      })
      .eq('id', params.applicationId);

    if (appErr) {
      console.warn('Warning: updated investment but failed to mark app as approved:', appErr);
    }

    return {
      id: inv.id,
      user_id: inv.user_id,
      application_id: inv.application_id,
      package_id: inv.package_id,
      invested_amount: Number(inv.invested_amount),
      expected_return: Number(inv.expected_return),
      total_payout: Number(inv.total_payout || totalPayout),
      start_date: inv.start_date,
      maturity_date: inv.maturity_date,
      status: 'active',
      created_at: inv.created_at,
    };
  },

  /**
   * Reject an application with reason (Admin)
   */
  async rejectApplication(applicationId: string, reason: string, adminId?: string): Promise<void> {
    const { error } = await supabase
      .from('pool_trading_applications')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId || null,
      })
      .eq('id', applicationId);

    if (error) {
      console.error('Failed to reject application:', error);
      throw error;
    }
  },

  /**
   * Real-time subscription to applications
   */
  subscribeApplications(callback: (payload: any) => void) {
    const channel = supabase
      .channel('public:pool_trading_applications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pool_trading_applications' },
        (payload) => callback(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /* ══════════════════════════════════════════════════════════════════════════
     INVESTMENTS
  ══════════════════════════════════════════════════════════════════════════ */

  /**
   * Fetch all investments (Admin)
   */
  async getInvestments(): Promise<PoolInvestment[]> {
    try {
      const { data: invs, error } = await supabase
        .from('pool_trading_investments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!invs || invs.length === 0) return [];

      const userIds = Array.from(new Set(invs.map(i => i.user_id).filter(Boolean)));
      const packageIds = Array.from(new Set(invs.map(i => i.package_id).filter(Boolean)));

      let profilesMap: Record<string, { full_name?: string; email?: string }> = {};
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        if (profs) {
          profs.forEach(p => {
            profilesMap[p.id] = { full_name: p.full_name, email: p.email };
          });
        }
      }

      let packagesMap: Record<string, PoolPackage> = {};
      if (packageIds.length > 0) {
        const { data: pkgs } = await supabase
          .from('pool_trading_packages')
          .select('*')
          .in('id', packageIds);

        if (pkgs) {
          pkgs.forEach(p => {
            packagesMap[p.id] = {
              id: p.id,
              name: p.name,
              duration_value: Number(p.duration_value),
              duration_unit: p.duration_unit,
              min_amount: Number(p.min_amount),
              roi_percentage: Number(p.roi_percentage),
              risk_level: p.risk_level,
              is_active: Boolean(p.is_active),
            };
          });
        }
      }

      return invs.map(i => {
        const prof = profilesMap[i.user_id] || {};
        const pkg = packagesMap[i.package_id];
        const invested = Number(i.invested_amount);
        const expected = Number(i.expected_return);
        const total = Number(i.total_payout || invested + expected);
        const roi = invested > 0 ? (expected / invested) * 100 : 0;

        return {
          id: i.id,
          user_id: i.user_id,
          application_id: i.application_id,
          package_id: i.package_id,
          invested_amount: invested,
          expected_return: expected,
          total_payout: total,
          start_date: i.start_date,
          maturity_date: i.maturity_date,
          original_maturity_date: i.original_maturity_date,
          status: i.status as any,
          extension_count: i.extension_count || 0,
          created_at: i.created_at,
          updated_at: i.updated_at,
          user_name: prof.full_name || 'Trader',
          user_email: prof.email || 'student@platform.com',
          package_name: pkg?.name || 'Pool Plan',
          roi_pct: Math.round(roi),
          package: pkg,
        };
      });
    } catch (err) {
      console.error('getInvestments error:', err);
      return [];
    }
  },

  /**
   * Fetch active & historical investments for a user (Student)
   */
  async getUserInvestments(userId: string): Promise<PoolInvestment[]> {
    try {
      const { data: invs, error } = await supabase
        .from('pool_trading_investments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!invs) return [];

      const packageIds = Array.from(new Set(invs.map(i => i.package_id).filter(Boolean)));
      let packagesMap: Record<string, PoolPackage> = {};
      if (packageIds.length > 0) {
        const { data: pkgs } = await supabase
          .from('pool_trading_packages')
          .select('*')
          .in('id', packageIds);

        if (pkgs) {
          pkgs.forEach(p => {
            packagesMap[p.id] = {
              id: p.id,
              name: p.name,
              duration_value: Number(p.duration_value),
              duration_unit: p.duration_unit,
              min_amount: Number(p.min_amount),
              roi_percentage: Number(p.roi_percentage),
              risk_level: p.risk_level,
              is_active: Boolean(p.is_active),
            };
          });
        }
      }

      return invs.map(i => {
        const pkg = packagesMap[i.package_id];
        const invested = Number(i.invested_amount);
        const expected = Number(i.expected_return);
        const total = Number(i.total_payout || invested + expected);

        return {
          id: i.id,
          user_id: i.user_id,
          application_id: i.application_id,
          package_id: i.package_id,
          invested_amount: invested,
          expected_return: expected,
          total_payout: total,
          start_date: i.start_date,
          maturity_date: i.maturity_date,
          status: i.status as any,
          created_at: i.created_at,
          package_name: pkg?.name || 'Pool Plan',
          roi_pct: invested > 0 ? (expected / invested) * 100 : 0,
          package: pkg,
        };
      });
    } catch (err) {
      console.error('getUserInvestments error:', err);
      return [];
    }
  },

  /**
   * Extend maturity date of an investment (Admin)
   */
  async extendInvestment(investmentId: string, additionalDays: number, reason?: string): Promise<void> {
    const { data: inv, error: fetchErr } = await supabase
      .from('pool_trading_investments')
      .select('maturity_date, extension_count')
      .eq('id', investmentId)
      .single();

    if (fetchErr) throw fetchErr;

    const currentMaturity = new Date(inv.maturity_date);
    currentMaturity.setDate(currentMaturity.getDate() + additionalDays);

    const { error } = await supabase
      .from('pool_trading_investments')
      .update({
        maturity_date: currentMaturity.toISOString(),
        extension_count: (inv.extension_count || 0) + 1,
        last_extended_at: new Date().toISOString(),
        extension_reason: reason || `Extended by ${additionalDays} days`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', investmentId);

    if (error) throw error;
  },

  /**
   * Update investment status (Admin or workflow)
   */
  async updateInvestmentStatus(
    investmentId: string,
    status: 'active' | 'matured' | 'withdrawal_pending' | 'withdrawn' | 'cancelled',
    reason?: string
  ): Promise<void> {
    const payload: any = { status, updated_at: new Date().toISOString() };
    if (status === 'cancelled') {
      payload.cancellation_reason = reason;
      payload.cancelled_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('pool_trading_investments')
      .update(payload)
      .eq('id', investmentId);

    if (error) throw error;
  },

  /**
   * Real-time subscription to investments
   */
  subscribeInvestments(callback: (payload: any) => void) {
    const channel = supabase
      .channel('public:pool_trading_investments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pool_trading_investments' },
        (payload) => callback(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /* ══════════════════════════════════════════════════════════════════════════
     WITHDRAWALS
  ══════════════════════════════════════════════════════════════════════════ */

  /**
   * Submit withdrawal request (Student)
   */
  async submitWithdrawalRequest(params: {
    userId: string;
    investmentId: string;
    amount: number;
    paymentMethod: string;
    walletAddress: string;
  }): Promise<WithdrawalRequest> {
    const record = {
      user_id: params.userId,
      investment_id: params.investmentId,
      amount: params.amount,
      payment_method: params.paymentMethod,
      wallet_address: params.walletAddress,
      status: 'pending',
    };

    const { data, error } = await supabase
      .from('withdrawal_requests')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error('Failed to submit withdrawal request:', error);
      throw error;
    }

    // Update investment status to withdrawal_pending
    await this.updateInvestmentStatus(params.investmentId, 'withdrawal_pending');

    return {
      id: data.id,
      user_id: data.user_id,
      investment_id: data.investment_id,
      amount: Number(data.amount),
      payment_method: data.payment_method,
      wallet_address: data.wallet_address,
      status: data.status,
      created_at: data.created_at,
    };
  },

  /**
   * Fetch all withdrawal requests (Admin)
   */
  async getWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    try {
      const { data: wds, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!wds || wds.length === 0) return [];

      const userIds = Array.from(new Set(wds.map(w => w.user_id).filter(Boolean)));
      let profilesMap: Record<string, { full_name?: string; email?: string }> = {};

      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        if (profs) {
          profs.forEach(p => {
            profilesMap[p.id] = { full_name: p.full_name, email: p.email };
          });
        }
      }

      return wds.map(w => ({
        id: w.id,
        user_id: w.user_id,
        investment_id: w.investment_id,
        amount: Number(w.amount),
        payment_method: w.payment_method,
        wallet_address: w.wallet_address,
        status: w.status,
        processed_by: w.processed_by,
        processed_at: w.processed_at,
        transaction_hash: w.transaction_hash,
        failure_reason: w.failure_reason,
        created_at: w.created_at,
        updated_at: w.updated_at,
        user_name: profilesMap[w.user_id]?.full_name || 'Trader',
        user_email: profilesMap[w.user_id]?.email || 'student@platform.com',
      }));
    } catch (err) {
      console.error('getWithdrawalRequests error:', err);
      return [];
    }
  },

  /**
   * Process withdrawal request (Admin: approve / complete / decline)
   */
  async processWithdrawalRequest(params: {
    requestId: string;
    investmentId: string;
    status: 'completed' | 'failed' | 'declined';
    transactionHash?: string;
    failureReason?: string;
    adminId?: string;
  }): Promise<void> {
    const payload: any = {
      status: params.status,
      processed_at: new Date().toISOString(),
      processed_by: params.adminId || null,
      updated_at: new Date().toISOString(),
    };

    if (params.transactionHash) payload.transaction_hash = params.transactionHash;
    if (params.failureReason) payload.failure_reason = params.failureReason;

    const { error } = await supabase
      .from('withdrawal_requests')
      .update(payload)
      .eq('id', params.requestId);

    if (error) throw error;

    // Update investment status accordingly
    if (params.status === 'completed') {
      await this.updateInvestmentStatus(params.investmentId, 'withdrawn');
    } else if (params.status === 'declined' || params.status === 'failed') {
      await this.updateInvestmentStatus(params.investmentId, 'matured');
    }
  },

  /**
   * Real-time subscription to withdrawals
   */
  subscribeWithdrawals(callback: (payload: any) => void) {
    const channel = supabase
      .channel('public:withdrawal_requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'withdrawal_requests' },
        (payload) => callback(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /* ══════════════════════════════════════════════════════════════════════════
     VIP REQUESTS
  ══════════════════════════════════════════════════════════════════════════ */

  /**
   * Submit VIP syndicate request (Student)
   */
  async submitVipRequest(userId: string, notes?: string): Promise<VipRequest> {
    const { data, error } = await supabase
      .from('vip_requests')
      .insert({ user_id: userId, notes: notes || '', status: 'pending' })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      user_id: data.user_id,
      status: data.status,
      notes: data.notes,
      created_at: data.created_at,
    };
  },

  /**
   * Fetch VIP requests (Admin)
   */
  async getVipRequests(): Promise<VipRequest[]> {
    try {
      const { data: vips, error } = await supabase
        .from('vip_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!vips) return [];

      const userIds = Array.from(new Set(vips.map(v => v.user_id).filter(Boolean)));
      let profilesMap: Record<string, { full_name?: string; email?: string }> = {};

      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        if (profs) {
          profs.forEach(p => {
            profilesMap[p.id] = { full_name: p.full_name, email: p.email };
          });
        }
      }

      return vips.map(v => ({
        id: v.id,
        user_id: v.user_id,
        status: v.status,
        notes: v.notes,
        rejection_reason: v.rejection_reason,
        reviewed_at: v.reviewed_at,
        created_at: v.created_at,
        user_name: profilesMap[v.user_id]?.full_name || 'VIP Applicant',
        user_email: profilesMap[v.user_id]?.email || 'student@platform.com',
      }));
    } catch (err) {
      console.error('getVipRequests error:', err);
      return [];
    }
  },

  /**
   * Review VIP request (Admin)
   */
  async reviewVipRequest(requestId: string, userId: string, status: 'approved' | 'rejected', reason?: string, adminId?: string): Promise<void> {
    const { error } = await supabase
      .from('vip_requests')
      .update({
        status,
        rejection_reason: reason || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId || null,
      })
      .eq('id', requestId);

    if (error) throw error;

    if (status === 'approved') {
      await supabase
        .from('profiles')
        .update({
          vip_status: 'active',
          vip_granted_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }
  }
};
