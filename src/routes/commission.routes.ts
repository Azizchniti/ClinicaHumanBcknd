import { Router } from 'express';
import { CommissionController } from '../controllers/commission.controller';

const router = Router();

// ✅ Static route FIRST
router.get('/ping', (req, res) => {
  res.send('pong');
});

// Then dynamic and other routes
router.get('/', CommissionController.getAll);
router.get('/monthly/:memberId', CommissionController.getMonthlyCommissionsController);
router.get('/:id', CommissionController.getById);
router.post('/', CommissionController.create);
router.put('/:id', CommissionController.update);
router.put('/member/:memberId', CommissionController.updateAllForMember);
router.delete('/:id', CommissionController.delete);

export default router;
