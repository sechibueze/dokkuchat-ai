import { db } from '../config/database';
import * as Cache from '../libs/cache.lib';
import { logger } from '../config/logger';

export async function getUserPermissionsFromDB(
  userId: string,
): Promise<Set<string>> {
  const userRoles = await db.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  const permissions = new Set<string>();
  for (const ur of userRoles) {
    for (const rp of ur.role.permissions) {
      permissions.add(rp.permission.name);
    }
  }
  return permissions;
}
// export async function getUserPermissions(userId: string): Promise<Set<string>> {
//   const cacheKey = `permissions:${userId}`;

//   // Check cache
//   const cached = await Cache.cacheGet<string[]>(cacheKey);
//   if (cached) {
//     logger.info(`Cache hit for permissions of user ${userId}`);
//     return new Set(cached);
//   }

//   const userRoles = await db.userRole.findMany({
//     where: { userId },
//     include: {
//       role: {
//         include: {
//           permissions: {
//             include: { permission: true },
//           },
//         },
//       },
//     },
//   });

//   const permissions = new Set<string>();
//   for (const ur of userRoles) {
//     for (const rp of ur.role.permissions) {
//       permissions.add(rp.permission.name);
//     }
//   }
//   // await Cache.cacheSet(cacheKey, [...permissions], Cache.CACHE_TTL.PERMISSIONS);

//   return permissions;
// }

export async function getUserPermissions(userId: string): Promise<Set<string>> {
  const permissions = await Cache.cacheGetOrSet(
    `permissions:${userId}`,
    Cache.CACHE_TTL.PERMISSIONS,
    async () => {
      const permissions = await getUserPermissionsFromDB(userId);
      return [...permissions]; // Return as array for serialization
    },
  );

  return new Set(permissions);
}
