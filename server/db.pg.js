const notConfiguredError = () => new Error(
  'Postgres adapter scaffold loaded, but it is not configured yet. Set up pg and implement the connection details before using DB_CLIENT=pg.'
);

const fail = () => {
  throw notConfiguredError();
};

export const upsertParticipant = fail;
export const getParticipantById = fail;
export const saveSession = fail;
export const getSession = fail;
export const getAllSessions = fail;
export const checkDb = fail;
