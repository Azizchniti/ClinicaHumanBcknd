import { Handler, Request, Response } from 'express';
import { CommissionService } from '../services/commission.service';

export const CommissionController = {
  async getAll(req: Request, res: Response) {
    try {
      const commissions = await CommissionService.getAllCommissions();
      res.status(200).json(commissions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch commissions', error });
    }
  },

  getById: (async (req, res) => {
    try {
      const id = req.params.id as string;
      const commission = await CommissionService.getCommissionById(id);
      if (!commission) return res.status(404).json({ message: 'Commission not found' });
      res.status(200).json(commission);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch commission', error });
    }
 }) as Handler,

  async create(req: Request, res: Response) {
    try {
      const commission = await CommissionService.createCommission(req.body);
      res.status(201).json(commission);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create commission', error });
    }
  },

async update(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { month, year } = req.body;

    const commission = await CommissionService.updateCommission(id, req.body);

    // Decide response based on whether it's a bulk update or single
    if (month && year) {
      res.status(200).json({ message: 'Commissions updated', commissions: commission });
    } else {
      res.status(200).json({ message: 'Commission updated', commission });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to update commission(s)', error });
  }
}
,

  async delete(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await CommissionService.deleteCommission(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete commission', error });
    }
  },
  async updateAllForMember(req: Request, res: Response) {
  try {
    const { memberId } = req.params;
    const { is_paid } = req.body;

    const updated = await CommissionService.updateAllCommissionsForMember(memberId, is_paid);

    res.status(200).json({
      message: `Updated  commissions for member ${memberId}`,
      updated,
    });
  } catch (error) {
    console.error('Error updating commissions:', error);
    res.status(500).json({ message: 'Failed to update commissions', error });
  }
},

async  getMonthlyCommissionsController  (req: Request, res: Response)  {
  try {
    const memberId = req.params.memberId;
    const data = await CommissionService.getMonthlyCommissions(memberId);
    res.status(200).json(data);
  } catch (error: any) {
    console.error("Error fetching monthly commissions:", error.message);
    res.status(500).json({ error: error.message });
  }
}


  
};
