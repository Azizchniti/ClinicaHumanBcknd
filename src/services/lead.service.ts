
import supabase from '../integration/supabase.client';
import { Lead } from '../types/lead.types';

export const LeadService = {
  async getAllLeads(): Promise<Lead[]> {
    const { data, error } = await supabase.from('leads').select('*');
    if (error) throw error;
    return data as Lead[];
  },

  async getLeadById(id: string): Promise<Lead | null> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Lead | null;
  },

  async createLead(leadData: Partial<Lead>): Promise<Lead> {
    const { data, error } = await supabase.from('leads').insert([leadData]).single();
    if (error) throw error;
    return data as Lead;
  },

async updateLead(id: string, leadData: Partial<Lead>): Promise<Lead> {
  // Step 1: Get current lead
  const { data: existingLead, error: fetchError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existingLead) throw new Error('Lead not found');

  const wasClosed = existingLead.status === 'closed';
  const isNowClosed = leadData.status === 'closed';

  // Step 2: Update the lead
  const { data, error } = await supabase
    .from('leads')
    .update(leadData)
    .eq('id', id)
    .single();

  if (error) throw error;

  // Step 3: If status changed to "closed", create commission(s) and update member total_sales
  if (!wasClosed && isNowClosed) {
    const saleValue = leadData.sale_value ?? existingLead.sale_value ?? 0;

    // Fetch the member (to check upline and get current total_sales)
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, upline_id, total_sales')
      .eq('id', existingLead.member_id)
      .maybeSingle();

    if (memberError) {
      console.error('Failed to fetch member:', memberError.message);
      throw memberError;
    }
    if (!member) {
      throw new Error('Member not found');
    }

    // Update member's total_sales by adding the saleValue
    const newTotalValue = (member.total_sales ?? 0) + saleValue;

    const { error: updateMemberError } = await supabase
      .from('members')
      .update({ total_sales: newTotalValue })
      .eq('id', member.id);

    if (updateMemberError) {
      console.error('Failed to update member total_sales:', updateMemberError.message);
      // Optional: throw or handle error
    }

    // Prepare commissions: member gets 3%
    const commissionsToInsert = [{
      member_id: member.id,
      lead_id: id,
      sale_value: saleValue,
      commission_percentage: 0.03,
      commission_value: saleValue * 0.03,
      sale_date: new Date().toISOString(),
      payment_date: null,
      is_paid: false
    }];

    // If member has upline, upline gets 1.5%
    if (member.upline_id) {
      commissionsToInsert.push({
        member_id: member.upline_id,
        lead_id: id,
        sale_value: saleValue,
        commission_percentage: 0.015,
        commission_value: saleValue * 0.015,
        sale_date: new Date().toISOString(),
        payment_date: null,
        is_paid: false
      });
    }

    // Insert commission(s)
    const { error: commissionError } = await supabase
      .from('commissions')
      .insert(commissionsToInsert);

    if (commissionError) {
      console.error('Failed to create commission(s):', commissionError.message);
      // Optional: throw or handle error
    }
  }

  return data as Lead;
}

,
  async deleteLead(id: string) {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
  },
};
