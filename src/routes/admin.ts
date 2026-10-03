import { Router } from 'express';
import { db } from '../config/database';
import { requirePermission } from '../middlewares/authorize.middleware';
import * as userRepository from '../repositories/user.repository';
import { authenticate } from '../middlewares/auth.middleware';
import { appEvents } from '../libs/event.lib';
import { NotFoundError } from '../libs/errors.lib';
import { ADMIN_EVENTS } from '../events/admin.event';
const router = Router();

router.use(authenticate);
router.use(requirePermission('roles:manage'));

// List all roles with their permissions
router.get('/roles', async (req, res) => {
  const roles = await db.role.findMany({
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
  });

  res.json({
    status: true,
    data: roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isDefault: role.isDefault,
      userCount: role._count.users,
      permissions: role.permissions.map((rp) => rp.permission.name),
    })),
  });
});

// Assign a role to a user
router.post('/users/:userId/roles', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role_name: roleName } = req.body;

    const user = await userRepository.getUserById(userId);
    if (!user) throw new NotFoundError('User not found');

    const role = await db.role.findUnique({ where: { name: roleName } });
    if (!role) throw new NotFoundError(`Role '${roleName}' not found`);

    await db.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {},
      create: {
        userId,
        roleId: role.id,
        assignedBy: req.user!.sub,
      },
    });

    // Audit event
    appEvents.emit(ADMIN_EVENTS.ROLE_ASSIGNED, {
      userId: userId,
      roleName,
      assignedBy: req.user!.sub,
    });

    res.json({
      success: true,
      data: { message: `Role '${roleName}' assigned to user` },
    });
  } catch (error) {
    next(error);
  }
});

// Revoke a role from a user
router.delete('/users/:userId/roles/:roleName', async (req, res, next) => {
  try {
    const { userId, roleName } = req.params;

    const role = await db.role.findUnique({
      where: { name: roleName },
    });
    if (!role) throw new NotFoundError('Role not found');

    await db.userRole.deleteMany({
      where: { userId, roleId: role.id },
    });

    appEvents.emit(ADMIN_EVENTS.ROLE_REVOKED, {
      userId: userId,
      roleName,
      revokedBy: req.user!.sub,
    });

    res.json({
      status: true,
      data: { message: `Role '${roleName}' revoked` },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
