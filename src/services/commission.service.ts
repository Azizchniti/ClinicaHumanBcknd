import supabase from '../integration/supabase.client';
import { Commission } from '../types/commission.types';

export const CommissionService = {
  async getAllCommissions(): Promise<Commission[]> {
    const { data, error } = await supabase.from('commissions').select('*');
    if (error) throw error;
    return data as Commission[];
  },

  async getCommissionById(id: string): Promise<Commission | null> {
    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Commission | null;
  },

  async createCommission(commissionData: Partial<Commission>): Promise<Commission> {
    const { data, error } = await supabase
      .from('commissions')
      .insert([commissionData])
      .single();
    if (error) throw error;
    return data as Commission;
  },
  

async updateCommission(
  MemberId: string,
  commissionData: Partial<Commission> & { month?: number; year?: number }
): Promise<Commission | Commission[]> {
  const query = supabase.from('commissions').update(commissionData);

  // If updating a specific commission by ID
  if (!commissionData.month || !commissionData.year) {
    const { data, error } = await query.eq('id', MemberId).single();
    if (error) throw error;
    return data as Commission;
  }

  // If updating all commissions for a member in a specific month/year
  const { data, error } = await query
    .eq('member_id', MemberId)
    .eq('month', commissionData.month)
    .eq('year', commissionData.year);

  if (error) throw error;
  if (!data) throw new Error('No commissions found for the given member/month/year');
  return data as Commission[];
},

  async deleteCommission(id: string): Promise<void> {
    const { error } = await supabase.from('commissions').delete().eq('id', id);
    if (error) throw error;
  }

  ,
  async  updateAllCommissionsForMember(memberId: string, is_paid: boolean) {
  const { data, error } = await supabase
    .from('commissions')
    .update({
      is_paid,
      payment_date: is_paid ? new Date().toISOString() : null,
    })
    .eq('member_id', memberId);

  if (error) throw error;
  return data;
},
async getMonthlyCommissions(memberId: string): Promise<{ year: number; month: number; total_commission: number }[]> {
  const { data, error } = await supabase.rpc('get_member_monthly_commissions', {
    member_id_input: memberId,
  });

  if (error) throw error;
  return data;
}

};
