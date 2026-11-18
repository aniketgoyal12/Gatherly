import { Router } from 'express';
import {
  createTask,
  getTasks,
  updateTaskStatus,
} from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { createTaskSchema, updateTaskStatusSchema } from '../validators/taskValidator.js';

const router = Router();

router.post('/', protect, requireRoles('organizer', 'super_admin'), validate(createTaskSchema), createTask);
router.get('/', protect, getTasks);
router.patch('/:id/status', protect, validate(updateTaskStatusSchema), updateTaskStatus);

export default router;
