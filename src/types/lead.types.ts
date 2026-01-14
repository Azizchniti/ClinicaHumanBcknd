export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  status: 'new' | 'contacted' | 'in-progress' | 'negotiating' | 'closed' | 'lost'; // assuming your `lead_status` ENUM
  member_id: string;
  sale_value: number;
  created_at: string;
  updated_at: string;
}
