// In-memory DB adapter for local development and CI where native bindings may fail
const memory = {
  participants: new Map(),
  sessions: [],
  metrics: [],
};

export const upsertParticipant = ({ participantId, fullName, email, authenticatedAt }) => {
  if (!participantId) return null;
  const existing = memory.participants.get(participantId) || { participantId };
  const record = {
    participantId,
    fullName: fullName || existing.fullName || null,
    email: email || existing.email || null,
    last_auth_at: authenticatedAt || new Date().toISOString(),
    created_at: existing.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  memory.participants.set(participantId, record);
  return record;
};

export const getParticipantById = (participantId) => {
  return memory.participants.get(participantId) || null;
};

export const saveSession = (payload) => {
  const id = memory.sessions.length + 1;
  const participant = payload?.participant || null;
  const rec = {
    id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    payload: JSON.stringify(payload),
    participant_id: participant?.participantId || null,
    participant_email: participant?.email || null,
  };
  memory.sessions.push(rec);

  const games = Object.entries(payload || {}).filter(([k]) => /^game\d+$/i.test(k));
  games.forEach(([gameId, gameData]) => {
    memory.metrics.push({ session_id: id, game_id: gameId, score: gameData?.score || 0, errors: gameData?.errors || 0, metrics: JSON.stringify(gameData) });
  });

  return id;
};

export const getSession = (id) => {
  const s = memory.sessions.find((x) => x.id === Number(id));
  if (!s) return null;
  return { ...s, payload: JSON.parse(s.payload), metrics: memory.metrics.filter(m => m.session_id === s.id) };
};

export const getAllSessions = () => {
  return memory.sessions.map(s => ({ ...s, payload: JSON.parse(s.payload) }));
};

export const checkDb = async () => true;

export default {
  upsertParticipant,
  getParticipantById,
  saveSession,
  getSession,
  getAllSessions,
  checkDb,
};
