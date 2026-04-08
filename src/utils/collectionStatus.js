export function getSheetProgressState(sheet)
{
  const monsters = Array.isArray(sheet?.monsters) ? sheet.monsters : [];
  const total = monsters.reduce((sum, monster) => sum + Number(monster.required || 0), 0);
  const done = monsters.reduce((sum, monster) => sum + Number(monster.zapped || 0), 0);
  const tracked = monsters.reduce(
    (sum, monster) => sum + Number(monster.zapped || 0) + Number(monster.breeding || 0),
    0
  );

  return {
    done,
    total,
    tracked,
    percent: total ? Math.round((done / total) * 100) : 0,
    trackedPercent: total ? Math.round((tracked / total) * 100) : 0,
    complete: Boolean(sheet?.isCollected) || (total > 0 && done >= total),
  };
}

export function isSheetComplete(sheet)
{
  return getSheetProgressState(sheet).complete;
}

export function normalizeCollectionEntryStatus(status)
{
  if (status === "complete")
  {
    return "complete";
  }

  if (
    status === "active"
    || status === "in_progress"
    || status === "partial"
    || status === "partially_complete"
  )
  {
    return "in_progress";
  }

  return "not_started";
}

export function applyCollectionEntryStatus(entry, nextStatus)
{
  const normalizedStatus = normalizeCollectionEntryStatus(nextStatus);

  if (normalizedStatus === "complete")
  {
    return {
      ...entry,
      collected: true,
      status: "complete",
    };
  }

  if (normalizedStatus === "in_progress")
  {
    return {
      ...entry,
      collected: false,
      status: "in_progress",
    };
  }

  return {
    ...entry,
    collected: false,
    status: "not_started",
  };
}

export function getCollectionEntryStatus(entry, instances = [])
{
  if (entry?.collected)
  {
    return "complete";
  }

  if (instances.some((sheet) => isSheetComplete(sheet)))
  {
    return "complete";
  }

  if (instances.some((sheet) => sheet?.isActive))
  {
    return "active";
  }

  if (normalizeCollectionEntryStatus(entry?.status) === "in_progress")
  {
    return "in_progress";
  }

  if (instances.some((sheet) =>
  {
    const progress = getSheetProgressState(sheet);

    return progress.done > 0 || progress.tracked > 0;
  }))
  {
    return "in_progress";
  }

  return "not_started";
}
