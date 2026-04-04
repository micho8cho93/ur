type MatchRoutePathOptions = {
  id: string;
  offline?: boolean;
  botDifficulty?: string | null;
  tutorial?: string | null;
  modeId?: string | null;
  privateMatch?: boolean;
  privateHost?: boolean;
  privateCode?: string | null;
  tournamentRunId?: string | null;
  tournamentId?: string | null;
  tournamentName?: string | null;
  tournamentRound?: string | number | null;
};

const appendQueryParam = (entries: string[], key: string, value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return;
  }

  entries.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
};

export const buildMatchRoutePath = ({
  id,
  offline,
  botDifficulty,
  tutorial,
  modeId,
  privateMatch,
  privateHost,
  privateCode,
  tournamentRunId,
  tournamentId,
  tournamentName,
  tournamentRound,
}: MatchRoutePathOptions): string => {
  const queryEntries: string[] = [];

  if (offline) {
    appendQueryParam(queryEntries, 'offline', '1');
  }
  appendQueryParam(queryEntries, 'botDifficulty', botDifficulty);
  appendQueryParam(queryEntries, 'tutorial', tutorial);
  appendQueryParam(queryEntries, 'modeId', modeId);

  if (privateMatch) {
    appendQueryParam(queryEntries, 'privateMatch', '1');
  }
  if (privateHost) {
    appendQueryParam(queryEntries, 'privateHost', '1');
  }
  appendQueryParam(queryEntries, 'privateCode', privateCode);
  appendQueryParam(queryEntries, 'tournamentRunId', tournamentRunId);
  appendQueryParam(queryEntries, 'tournamentId', tournamentId);
  appendQueryParam(queryEntries, 'tournamentName', tournamentName);
  appendQueryParam(queryEntries, 'tournamentRound', tournamentRound);

  const matchPath = `/match/${encodeURIComponent(id)}`;
  return queryEntries.length > 0 ? `${matchPath}?${queryEntries.join('&')}` : matchPath;
};
