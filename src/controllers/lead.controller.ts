import { Handler } from 'express';
import { LeadService } from '../services/lead.service';

export const LeadController = {
  getAll: (async (req, res) => {
    try {
      const leads = await LeadService.getAllLeads();
      res.json(leads);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }) as Handler,

  getById: (async (req, res) => {
    try {
      const { id } = req.params;
      const lead = await LeadService.getLeadById(id);
      if (!lead) return res.status(404).json({ error: 'Lead not found' });
      res.json(lead);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }) as Handler,

  create: (async (req, res) => {
    try {
      const lead = await LeadService.createLead(req.body);
      res.status(201).json(lead);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }) as Handler,

  update: (async (req, res) => {
    try {
      const { id } = req.params;
      const lead = await LeadService.updateLead(id, req.body);
      res.json(lead);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }) as Handler,

  delete: (async (req, res) => {
    try {
      const { id } = req.params;
      await LeadService.deleteLead(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }) as Handler,
};
