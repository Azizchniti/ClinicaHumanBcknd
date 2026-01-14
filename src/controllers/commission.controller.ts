import { Handler, Request, Response } from 'express';
import { CommissionService } from '../services/commission.service';

interface IdParam {
  id: string;
}

interface MemberIdParam {
  memberId: string;
}

export const CommissionController = {
  async getAll(req: Request, res: Response) {
    try {
      const commissions = await CommissionService.getAllCommissions();
      res.status(200).json(commissions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch commissions', error });
    }
  },

  getById: (async (req: Request<IdParam>, res: Response) => {
    const { id } = req.params;
    const commission = await CommissionService.getCommissionById(id);
    if (!commission) return res.status(404).json({ message: 'Commission not found' });
    res.status(200).json(commission);
  }) as unknown as Handler,

  async create(req: Request, res: Response) {
    const commission = await CommissionService.createCommission(req.body);
    res.status(201).json(commission);
  },

  async update(req: Request<IdParam>, res: Response) {
    const { id } = req.params;
    const { month, year } = req.body;

    const commission = await CommissionService.updateCommission(id, req.body);

    if (month && year) {
      res.status(200).json({ message: 'Commissions updated', commissions: commission });
    } else {
      res.status(200).json({ message: 'Commission updated', commission });
    }
  },

  async delete(req: Request<IdParam>, res: Response) {
    const { id } = req.params;
    await CommissionService.deleteCommission(id);
    res.status(204).send();
  },

  async updateAllForMember(req: Request<MemberIdParam>, res: Response) {
    const { memberId } = req.params;
    const { is_paid } = req.body;

    const updated = await CommissionService.updateAllCommissionsForMember(memberId, is_paid);

    res.status(200).json({
      message: `Updated commissions for member ${memberId}`,
      updated,
    });
  },

  async getMonthlyCommissionsController(req: Request<MemberIdParam>, res: Response) {
    const { memberId } = req.params;
    const data = await CommissionService.getMonthlyCommissions(memberId);
    res.status(200).json(data);
  },
};
