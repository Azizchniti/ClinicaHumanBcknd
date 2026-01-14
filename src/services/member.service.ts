import supabase from '../integration/supabaseAdmin';
import { Member } from '../types/member.types'; // Optional: if you have a Member type

export const MemberService = {
  // Get all members (basic info)
  async getAllMembers() {
    const { data, error } = await supabase
      .from('members')
      .select(`
        id,
        cpf,
        phone,
        grade,
        total_sales,
        total_contacts,
        total_commission,
        first_name,
        last_name,
        upline_id
      `);

    if (error) throw error;
    return data;
  },

  // Get single member by id (full details)
  async getMemberById(id: string) {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Update member details (allow selected fields only)
  async updateMember(id: string, updatedData: Partial<Omit<Member, 'id'>>) {
    const { data, error } = await supabase
      .from('members')
      .update(updatedData)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Optionally: Delete member
  async deleteMember(id: string) {
    const { error } = await supabase.from('members').delete().eq('id', id);

    if (error) throw error;
    return { message: 'Member deleted successfully' };
  },

   // Get a member and their squad (up to 12 members invited)
  async getMemberSquad(memberId: string): Promise<Member[]> {
    // Get the leader
    const { data: leader, error: leaderError } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .maybeSingle();

    if (leaderError) throw leaderError;
    if (!leader) throw new Error('Member not found');

    // Get associates with upline_id = memberId
    const { data: associates, error: associateError } = await supabase
      .from('members')
      .select('*')
      .eq('upline_id', memberId)
      .limit(12);

    if (associateError) throw associateError;

    return [leader, ...(associates ?? [])];
  },

  // Get squad metrics (aggregated stats of member + invited members)
  async getSquadMetrics(memberId: string) {
    const squad = await this.getMemberSquad(memberId);

    const metrics = {
      memberCount: squad.length,
      totalSales: squad.reduce((acc, m) => acc + (m.total_sales || 0), 0),
      totalContacts: squad.reduce((acc, m) => acc + (m.total_contacts || 0), 0),
      totalCommission: squad.reduce((acc, m) => acc + (m.total_commission || 0), 0),
    };

    return metrics;
  },

  // Get top members (by total sales)
  async getTopMembers(limit = 10): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('total_commission', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },
  // Get top squads ranked by combined commission (leader + associates)
async getTopSquads(limit = 10) {
  // Step 1: Get all leaders (members with no upline)
  const { data: leaders, error: leadersError } = await supabase
    .from('members')
    .select('*')
    .is('upline_id', null);

  if (leadersError) throw leadersError;

  const squadData = [];

  for (const leader of leaders) {
    // Step 2: Get associates of each leader
    const { data: associates, error: assocError } = await supabase
      .from('members')
      .select('*')
      .eq('upline_id', leader.id);

    if (assocError) throw assocError;

    // Step 3: Calculate total commission of the squad
    const totalCommission =
      (leader.total_commission || 0) +
      (associates?.reduce((acc, m) => acc + (m.total_commission || 0), 0) || 0);

    squadData.push({
      leader,
      associates,
      totalCommission,
    });
  }

  // Step 4: Sort by total commission descending
  squadData.sort((a, b) => b.totalCommission - a.totalCommission);

  // Step 5: Return top squads
  return squadData.slice(0, limit);
},// Get members by status
async getMembersByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('status', status);

  if (error) throw error;
  return data;
},

// Approve a pending member
async approveMember(id: string) {
  const { data, error } = await supabase
    .from('members')
    .update({ status: 'approved' })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
},

// Reject a pending member
async rejectMember(id: string) {
  const { data, error } = await supabase
    .from('members')
    .update({ status: 'rejected' })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
},
// Mark tutorial as seen
async markTutorialAsSeen(id: string) {
  const { data, error } = await supabase
    .from('members')
    .update({ has_seen_tutorial: true })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}




};
