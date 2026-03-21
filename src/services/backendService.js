export const saveSessionToBackend = async (sessionData) => {
  try {
    const response = await fetch('/api/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sessionData)
    });

    if (!response.ok) {
      const body = await response.json();
      throw new Error(body.error || 'Backend save failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to save session to backend', error);
    throw error;
  }
};