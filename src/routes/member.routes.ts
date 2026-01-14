import { Router } from 'express';
import { MemberController } from '../controllers/member.controller';

const router = Router();

router.get('/top', MemberController.getTopMembers);
router.get('/top-squads', MemberController.getTopSquads);
router.get('/status/:status', MemberController.getByStatus); // <-- new
router.put('/:id/approve', MemberController.approve);        // <-- new
router.put('/:id/reject', MemberController.reject);          // <-- new
router.put('/:id/tutorial-seen', MemberController.markTutorialSeen);
router.get('/:id/squad', MemberController.getSquad);
router.get('/:id/squad-metrics', MemberController.getSquadMetrics);
router.get('/:id', MemberController.getById);
router.get('/', MemberController.getAll);
router.put('/:id', MemberController.update);

router.delete('/:id', MemberController.delete);

export default router;
