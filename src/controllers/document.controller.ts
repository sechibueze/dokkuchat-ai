async function getDocument(req: Request, res: Response) {
  const doc = await prisma.document.findUnique({
    where: { id: req.params.id },
  });

  if (!doc) {
    throw new NotFoundError('Document not found');
  }

  // Resource ownership check
  if (doc.userId !== req.user!.id) {
    // Admins can see everything
    const permissions = await getUserPermissions(req.user!.id);
    if (!permissions.has('users:manage')) {
      throw new NotFoundError('Document not found');
    }
  }

  res.json({ success: true, data: doc });
}
