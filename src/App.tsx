import { useEffect, useState, type FormEvent } from 'react';
import './App.css';
import { generateCoachAdviceForUsers, getStoredGeminiApiKey, setStoredGeminiApiKey } from './services/gemini';
import { decodeAthleteFromSource, loadWorkouts, saveWorkout, stripAthleteFromSource, type SharedWorkout } from './services/supabase';

type UserKey = 'Ettore' | 'Papà' | 'Zio';

type WorkoutEntry = {
  id: string;
  user: UserKey;
  name: string;
  date: string;
  distanceKm: number;
  elevationM: number;
  source: string;
};

const users: UserKey[] = ['Ettore', 'Papà', 'Zio'];

const emptyCoachAdvice = users.reduce(
  (acc, user) => ({ ...acc, [user]: 'Sto preparando il consiglio...' }),
  {} as Record<UserKey, string>,
);

const createEmptyGroupTotals = (): Record<UserKey, { km: number; uscite: number }> => ({
  Ettore: { km: 0, uscite: 0 },
  'Papà': { km: 0, uscite: 0 },
  Zio: { km: 0, uscite: 0 },
});

function App() {
  const [coachAdvice, setCoachAdvice] = useState<Record<UserKey, string>>(emptyCoachAdvice);
  const [activities, setActivities] = useState<WorkoutEntry[]>([]);
  const [groupTotals, setGroupTotals] = useState<Record<UserKey, { km: number; uscite: number }>>(createEmptyGroupTotals());
  const [weeklyKm, setWeeklyKm] = useState(0);
  const [weeklyUscite, setWeeklyUscite] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState('');
  const [formName, setFormName] = useState('Lungo serale');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formKm, setFormKm] = useState('35');
  const [formElevation, setFormElevation] = useState('400');
  const [formUser, setFormUser] = useState<UserKey>('Ettore');
  const [formStatus, setFormStatus] = useState('');

  const refreshCoachAdvice = async (mapped: WorkoutEntry[], key = geminiApiKey) => {
    const adviceEntries = users.map((user) => ({
      user,
      workouts: mapped
        .filter((item) => item.user === user)
        .map((item) => ({
          name: item.name,
          date: item.date,
          distanceKm: item.distanceKm,
          elevationM: item.elevationM,
        })),
    }));

    const aiAdvice = await generateCoachAdviceForUsers(adviceEntries, key);
    setCoachAdvice({ ...emptyCoachAdvice, ...aiAdvice } as Record<UserKey, string>);
  };

  useEffect(() => {
    const loadData = async () => {
      const savedKey = getStoredGeminiApiKey() ?? '';
      setGeminiApiKey(savedKey);
      setApiKeyInput(savedKey);

      setIsLoading(true);
      try {
        const sharedWorkouts = await loadWorkouts();
        const mapped = (sharedWorkouts ?? []).map((item: SharedWorkout) => ({
          id: item.id,
          user: decodeAthleteFromSource(item.source),
          name: item.name,
          date: item.date,
          distanceKm: item.distance_km,
          elevationM: item.elevation_m,
          source: stripAthleteFromSource(item.source),
        }));

        const totalKm = mapped.reduce((sum, item) => sum + item.distanceKm, 0);
        const totalUscite = mapped.length;
        const totals = createEmptyGroupTotals();
        mapped.forEach((item) => {
          totals[item.user].km += item.distanceKm;
          totals[item.user].uscite += 1;
        });

        setActivities(mapped);
        setGroupTotals(totals);
        setWeeklyKm(Number(totalKm.toFixed(1)));
        setWeeklyUscite(totalUscite);

        await refreshCoachAdvice(mapped, savedKey);
      } catch {
        setActivities([]);
        setGroupTotals(createEmptyGroupTotals());
        setWeeklyKm(0);
        setWeeklyUscite(0);
        setCoachAdvice(emptyCoachAdvice);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [geminiApiKey]);

  const handleSaveApiKey = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedKey = apiKeyInput.trim();
    setStoredGeminiApiKey(trimmedKey);
    setGeminiApiKey(trimmedKey);
    setApiKeyStatus(trimmedKey ? 'Chiave Gemini salvata nel browser.' : 'Chiave rimossa.');
  };

  const handleSubmitWorkout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormStatus('Salvataggio in corso...');

    try {
      await saveWorkout({
        athlete: formUser,
        name: formName,
        date: formDate,
        distance_km: Number(formKm),
        elevation_m: Number(formElevation),
        source: 'Inserito manualmente',
      });

      setFormStatus('Allenamento salvato.');
      setFormName('Lungo serale');
      setFormKm('35');
      setFormElevation('400');
      setFormDate(new Date().toISOString().slice(0, 10));

      const refreshed = await loadWorkouts();
      const mapped = (refreshed ?? []).map((item: SharedWorkout) => ({
        id: item.id,
        user: decodeAthleteFromSource(item.source),
        name: item.name,
        date: item.date,
        distanceKm: item.distance_km,
        elevationM: item.elevation_m,
        source: stripAthleteFromSource(item.source),
      }));

      const totals = createEmptyGroupTotals();
      mapped.forEach((item) => {
        totals[item.user].km += item.distanceKm;
        totals[item.user].uscite += 1;
      });

      const totalKm = mapped.reduce((sum, item) => sum + item.distanceKm, 0);
      setActivities(mapped);
      setGroupTotals(totals);
      setWeeklyKm(Number(totalKm.toFixed(1)));
      setWeeklyUscite(mapped.length);

      await refreshCoachAdvice(mapped, geminiApiKey);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossibile salvare. Riprova.'
      setFormStatus(`Impossibile salvare: ${message}`);
    }
  };

  return (
    <main className="app-shell">
      <header className="hero-card">
        <div>
          <p className="eyebrow">Eroica prep • gruppo condiviso</p>
          <h1>Jarvis</h1>
          <p className="hero-copy">Diario condiviso per tre atleti, con AI coach e dati inseriti direttamente da tutti.</p>
        </div>
        <div className="hero-meta">
          <strong>{weeklyKm} km</strong>
          <small>{weeklyUscite} uscite</small>
        </div>
      </header>

      <section className="coach-card">
        <div className="coach-head">
          <h2>AI Coach</h2>
          <span className="connect-link muted">Gemini</span>
        </div>
        <form className="api-key-form" onSubmit={handleSaveApiKey}>
          <input
            type="password"
            value={apiKeyInput}
            onChange={(event) => setApiKeyInput(event.target.value)}
            placeholder="Chiave Gemini API"
          />
          <button type="submit">Salva chiave</button>
        </form>
        <p className="api-key-status">{apiKeyStatus || 'Le chiavi vengono salvate solo nel browser di questo dispositivo.'}</p>

        <div className="coach-table">
          <div className="coach-row coach-row-header">
            <span>Atleta</span>
            <span>Dati</span>
            <span>Consiglio</span>
          </div>
          {users.map((user) => (
            <div key={user} className="coach-row">
              <strong>{user}</strong>
              <span>{groupTotals[user].uscite} uscite • {groupTotals[user].km.toFixed(1)} km</span>
              <span>{isLoading ? 'Sto preparando il consiglio...' : coachAdvice[user]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section-card">
        <div className="section-head">
          <h2>Diario personale</h2>
          <span className="muted">Inserimento condiviso</span>
        </div>

        <form className="workout-form" onSubmit={handleSubmitWorkout}>
          <input value={formName} onChange={(event) => setFormName(event.target.value)} placeholder="Nome allenamento" />
          <input type="date" value={formDate} onChange={(event) => setFormDate(event.target.value)} />
          <input type="number" step="0.1" value={formKm} onChange={(event) => setFormKm(event.target.value)} placeholder="Km" />
          <input type="number" value={formElevation} onChange={(event) => setFormElevation(event.target.value)} placeholder="Dislivello" />
          <select value={formUser} onChange={(event) => setFormUser(event.target.value as UserKey)}>
            {users.map((user) => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
          <button type="submit">Salva</button>
        </form>
        <p className="form-status">{formStatus}</p>
        <p className="muted small-copy">Nella versione web gli allenamenti vanno inseriti manualmente e vengono condivisi con il gruppo.</p>

        <ul className="activity-list">
          {activities.length === 0 ? (
            <li className="empty-state">Nessun allenamento ancora inserito.</li>
          ) : (
            activities.map((item) => (
              <li key={item.id} className="activity-item">
                <div>
                  <strong>{item.name}</strong>
                  <p>{new Date(item.date).toLocaleDateString('it-IT')} • {item.distanceKm.toFixed(1)} km • {item.elevationM} m</p>
                </div>
                <span className="activity-source">{item.user} • {item.source}</span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="section-card">
        <div className="section-head">
          <h2>Il gruppo</h2>
          <span className="muted">Totali settimanali</span>
        </div>
        <div className="group-list">
          {users.map((user) => (
            <article key={user} className="group-card">
              <div>
                <h3>{user}</h3>
                <p>{groupTotals[user].uscite} uscite • {groupTotals[user].km.toFixed(1)} km</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
