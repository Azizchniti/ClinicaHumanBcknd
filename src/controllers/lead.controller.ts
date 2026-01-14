import { Handler, Request, Response } from 'express';
import { LeadService } from '../services/lead.service';

interface IdParam {
  id: string;
}

export const LeadController = {
  getAll: (async (_req: Request, res: Response) => {
    const leads = await LeadService.getAllLeads();
    res.json(leads);
  }) as Handler,

  getById: (async (req: Request<IdParam>, res: Response) => {
    const { id } = req.params;
    const lead = await LeadService.getLeadById(id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  }) as unknown as Handler,

  create: (async (req: Request, res: Response) => {
    const lead = await LeadService.createLead(req.body);
    res.status(201).json(lead);
  }) as Handler,

  update: (async (req: Request<IdParam>, res: Response) => {
    const { id } = req.params;
    const lead = await LeadService.updateLead(id, req.body);
    res.json(lead);
  }) as unknown as Handler,

  delete: (async (req: Request<IdParam>, res: Response) => {
    const { id } = req.params;
    await LeadService.deleteLead(id);
    res.status(204).send();
  }) as unknown as Handler,
};
