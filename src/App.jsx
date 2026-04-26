import { useState } from 'react';
import LoginScreen from './screens/LoginScreen.jsx';
import TitleScreen from './screens/TitleScreen.jsx';
import UserScreen from './screens/UserScreen.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import MapScreen from './screens/MapScreen.jsx';
import BriefingScreen from './screens/BriefingScreen.jsx';
import ConversationScreen from './screens/ConversationScreen.jsx';
import LiveConversationScreen from './screens/LiveConversationScreen.jsx';
import IntermezzoScreen from './screens/IntermezzoScreen.jsx';
import DebriefScreen from './screens/DebriefScreen.jsx';
import VocabularyDashboard from './screens/VocabularyDashboard.jsx';
import CLEntryScreen from './screens/ConversazioneLibera/EntryScreen.jsx';
import CLDebriefScreen from './screens/ConversazioneLibera/DebriefScreen.jsx';
import ItalianTutor from './components/ItalianTutor.jsx';
import useAudioManager from './hooks/useAudioManager.js';
import { getScenario } from './data/scenarios.js';
import * as lucaData from './data/conversazioneLibera/luca.js';
import * as giuliaData from './data/conversazioneLibera/giulia.js';
import {
  loadStore,
  saveSession,
  loadCharacter,
  saveCharacter,
  loadCompanion,
  saveCompanion,
  loadLastLocation,
  saveLastLocation,
  loadCurrentUser,
  saveCurrentUser,
} from './hooks/useLocalStorage.js';
import { getRetryWordsForLocation, getDueWords, getActiveQueue, LESSON_THRESHOLD } from './utils/vocabularyEngine.js';
import { pickTopic, updateCharacterData } from './utils/characterMemory.js';
import { getSavedPassword } from './utils/claudeApi.js';

const CL_CHARACTERS = {
  luca: lucaData,
  giulia: giuliaData
};

const TITLE_SEEN_KEY = 'milano-mio-title-seen';

export default function App() {
  const [authed, setAuthed] = useState(() => Boolean(getSavedPassword()));
  const [currentUser, setCurrentUser] = useState(() => loadCurrentUser());
  const [companion, setCompanion] = useState(() => loadCompanion());
  // Title shown once per tab-session: reloading inside a session skips it,
  // but a fresh tab (or closing + reopening) surfaces it again so the
  // opening still feels like a deliberate moment.
  const [titleSeen, setTitleSeen] = useState(() => {
    try { return sessionStorage.getItem(TITLE_SEEN_KEY) === '1'; } catch { return false; }
  });

  // Routing: if no user has been picked yet, show the user picker first.
  // Otherwise always land on the dog picker on page load — it offers a
  // "Continua →" link to skip straight to the map if a companion is saved.
  const [route, setRoute] = useState({
    screen: currentUser ? 'home' : 'userPicker',
    params: {},
  });

  // Full-screen fade overlay used to crossfade the map into the briefing
  // screen (so the handoff isn't an abrupt cut). MapScreen triggers it.
  const [fading, setFading] = useState(false);

  // Music follows the route — title song on the picker screens, map bed
  // on the map, scenario ambience during briefings, silence during the
  // conversation itself. Config lives in src/audio/scenes.js.
  //
  // Enabled from the start so the first click on TitleScreen can unlock
  // audio playback; the scene map handles silence for routes that don't
  // have a music cue (e.g. conversation, vocabDashboard).
  useAudioManager(route.screen, { enabled: true });

  const go = (screen, params = {}) => setRoute({ screen, params });
  // "Home" from anywhere in a session means back to the map — the dog
  // picker is only for first-visit or an explicit "cambia compagno" click.
  const goMap = () => go('map');

  // Fade the screen to black, run `action`, then fade back in. Used for
  // briefing → conversation handoffs so the transition feels continuous
  // with the earlier map → briefing crossfade. 350ms slightly > the CSS
  // transition (0.3s) so the overlay is fully opaque before we swap.
  const fadeThen = (action) => {
    setFading(true);
    setTimeout(() => {
      action();
      setTimeout(() => setFading(false), 50);
    }, 350);
  };

  // ---------------------------------------------------------------------------
  // User (Chad / Charlie / Guest)
  // ---------------------------------------------------------------------------

  const handlePickUser = (userId) => {
    saveCurrentUser(userId);
    setCurrentUser(userId);
    // Companion is stored in the user-scoped store, so switching users
    // means re-reading the new user's companion (or null, if they haven't
    // picked one yet — the dog picker will force a selection in that case).
    setCompanion(loadCompanion());
    go('home');
  };

  const handleChangeUser = () => {
    go('userPicker');
  };

  // ---------------------------------------------------------------------------
  // Companion
  // ---------------------------------------------------------------------------

  const handlePickCompanion = (dogId) => {
    saveCompanion(dogId);
    setCompanion(dogId);
    go('map');
  };

  const handleChangeCompanion = () => {
    go('home');
  };

  // ---------------------------------------------------------------------------
  // Story mode handlers
  // ---------------------------------------------------------------------------

  const handleStartStory = (scenarioId, difficulty) => {
    const store = loadStore();
    const retryWords = getRetryWordsForLocation(store.vocabulary, scenarioId);
    // Gabriella's session content is built from the player's full active
    // vocabulary queue (not location-specific retry words). Compute it
    // here and pass through; her scenario file branches between casual
    // and review modes based on queue size.
    const gabriellaWords = scenarioId === 'gabriellaApartment'
      ? getActiveQueue(store.vocabulary)
      : null;
    // Park the Vespa here even before the conversation — if the user bails at
    // the briefing screen and comes back, the scooter should be where they
    // just drove it, not snap back to the previous pin.
    saveLastLocation(scenarioId);
    go('briefing', { scenarioId, difficulty, retryWords, gabriellaWords });
    // Briefing has mounted behind the opaque overlay; fade it back out.
    setTimeout(() => setFading(false), 50);
  };

  const handleAndiamo = () => {
    fadeThen(() => go('conversation', route.params));
  };

  // Multi-scenario chain support — for scenarios that auto-hand off to a
  // sister scenario mid-evening (e.g. bartoliniLive → bartoliniSommelierLive
  // when Elena the sommelier arrives). Each phase generates its own debrief
  // against its own transcript; we accumulate learned/retry across phases
  // and use the LAST phase's character_says + the chain root scenarioId for
  // the saved session.
  const mergeChainPhase = (accumulator, scenario, debrief, transcript, flaggedContext = [], greenTapContext = []) => {
    const characterSays =
      debrief?.[scenario?.characterSaysKey] || debrief?.marco_says || '';
    return {
      chainRootId: accumulator?.chainRootId || scenario.id,
      learned: [...(accumulator?.learned || []), ...(debrief?.learned || [])],
      retry: [...(accumulator?.retry || []), ...(debrief?.retry || [])],
      // Carry rich flag-time context through chained phases so words
      // flagged in (say) bartoliniLive still record their original
      // sentence/speaker when the final debrief is saved.
      flaggedContext: [...(accumulator?.flaggedContext || []), ...flaggedContext],
      greenTapContext: [...(accumulator?.greenTapContext || []), ...greenTapContext],
      // Show the last (closing) character's voice in the final debrief.
      lastCharacterSays: characterSays,
      lastCharacterSaysKey: scenario?.characterSaysKey,
      transcript: [...(accumulator?.transcript || []), ...transcript]
    };
  };

  const handleStoryEnd = ({ debrief, transcript, flaggedContext = [], greenTapContext = [] }) => {
    const { scenarioId, difficulty, chainAccumulator } = route.params;
    const scenario = getScenario(scenarioId);
    const merged = mergeChainPhase(chainAccumulator, scenario, debrief, transcript, flaggedContext, greenTapContext);

    // If this phase chains to another, hand off to the intermezzo instead
    // of running the debrief. The accumulator carries learned/retry forward
    // so the final debrief covers the whole evening.
    const chainTo = scenario?.live?.chainTo;
    if (chainTo) {
      const nextScenario = getScenario(chainTo);
      go('intermezzo', {
        toScenarioId: chainTo,
        toScenario: nextScenario,
        intermezzoText: scenario.live.intermezzoText || '',
        difficulty,
        retryWords: route.params.retryWords,
        chainAccumulator: merged
      });
      return;
    }

    // Final phase — build the session against the accumulated chain (or just
    // this single scenario if no chain was used).
    const finalLocation = merged.chainRootId;
    const finalScenario = getScenario(finalLocation);
    const session = {
      id: crypto.randomUUID?.() || String(Date.now()),
      date: new Date().toISOString(),
      location: finalLocation,
      difficulty,
      learned: merged.learned,
      retry: merged.retry,
      // Flag-time context (sentence + speaker per flagged word) — persists
      // through saveSession into the v3 vocab schema, where Gabriella reads
      // it when generating review prompts.
      flaggedContext: merged.flaggedContext,
      greenTapContext: merged.greenTapContext,
      character_says: merged.lastCharacterSays,
      transitionTo: debrief?.transitionTo || null,
      transcript: merged.transcript
    };
    saveSession(session);
    saveLastLocation(finalLocation);

    // Build a debrief shape DebriefScreen expects — the closing character's
    // voice key gets the final character_says, plus a generic key for fallback.
    const finalDebrief = {
      ...debrief,
      learned: merged.learned,
      retry: merged.retry,
      character_says: merged.lastCharacterSays,
      [merged.lastCharacterSaysKey]: merged.lastCharacterSays
    };
    go('debrief', {
      scenarioId: finalLocation,
      difficulty,
      debrief: finalDebrief,
      transcript: merged.transcript
    });
  };

  const handleIntermezzoContinue = () => {
    const { toScenarioId, difficulty, retryWords, chainAccumulator } = route.params;
    fadeThen(() => go('conversation', {
      scenarioId: toScenarioId,
      difficulty,
      retryWords,
      chainAccumulator
    }));
  };

  // ---------------------------------------------------------------------------
  // Conversazione Libera handlers
  // ---------------------------------------------------------------------------

  const handleStartCL = (characterId) => {
    go('clEntry', { characterId });
  };

  const handleCLAndiamo = (difficulty) => {
    const { characterId } = route.params;
    const charModule = CL_CHARACTERS[characterId];
    const characterData = loadCharacter(characterId);
    const store = loadStore();
    const retryWords = getDueWords(store.vocabulary).slice(0, 3).map((w) => w.word);
    const topic = pickTopic(characterData.coveredTopics || [], charModule.topicBank);
    const systemPrompt = charModule.buildSystemPrompt(difficulty, retryWords, characterData, topic);

    fadeThen(() => go('clConversation', {
      characterId,
      difficulty,
      topic,
      systemPrompt,
      characterData,
      charModule
    }));
  };

  const handleCLEnd = ({ debrief, transcript, characterMemory, lifelineUsed, flaggedContext = [], greenTapContext = [] }) => {
    const { characterId, difficulty, topic } = route.params;
    const characterData = loadCharacter(characterId);

    // Save character memory
    if (characterMemory) {
      const updated = updateCharacterData(characterData, characterMemory);
      saveCharacter(characterId, updated);
    }

    // Save session
    const characterSays =
      debrief?.[`${characterId}_says`] || debrief?.character_says || '';

    const session = {
      id: crypto.randomUUID?.() || String(Date.now()),
      date: new Date().toISOString(),
      location: `cl_${characterId}`,
      difficulty,
      learned: debrief?.learned || [],
      retry: debrief?.retry || [],
      flaggedContext,
      greenTapContext,
      character_says: characterSays,
      transcript
    };
    saveSession(session);

    go('clDebrief', {
      characterId,
      debrief: { ...debrief, character_says: characterSays },
      transcript,
      lifelineUsed,
      topic
    });
  };

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------

  const handleAuthLost = () => {
    setAuthed(false);
    goMap();
  };

  const handleTitleEnter = () => {
    try { sessionStorage.setItem(TITLE_SEEN_KEY, '1'); } catch {}
    setTitleSeen(true);
  };

  if (!titleSeen) {
    return <TitleScreen onEnter={handleTitleEnter} />;
  }

  if (!authed) {
    return <LoginScreen onUnlock={() => setAuthed(true)} />;
  }

  // ---------------------------------------------------------------------------
  // Routing
  // ---------------------------------------------------------------------------

  const { screen, params } = route;
  const scenario = params.scenarioId ? getScenario(params.scenarioId) : null;
  const store = loadStore();

  return (
    <div className="app">
      {screen === 'userPicker' && (
        <UserScreen
          currentUser={currentUser}
          onPickUser={handlePickUser}
          onCancel={currentUser ? () => go(companion ? 'map' : 'home') : null}
        />
      )}

      {screen === 'home' && (
        <HomeScreen
          onPickCompanion={handlePickCompanion}
          existingCompanion={companion}
          onContinue={companion ? () => go('map') : null}
          onChangeUser={handleChangeUser}
        />
      )}

      {screen === 'map' && (
        <MapScreen
          companion={companion}
          currentUser={currentUser}
          lastLocation={loadLastLocation()}
          onStartStory={handleStartStory}
          onStartCL={handleStartCL}
          onOpenVocab={() => go('vocabDashboard')}
          onChangeCompanion={handleChangeCompanion}
          onChangeUser={handleChangeUser}
          onBeforeStart={() => setFading(true)}
          store={store}
        />
      )}

      {screen === 'briefing' && scenario && (
        <BriefingScreen
          scenario={scenario}
          difficulty={params.difficulty}
          retryWords={params.retryWords}
          onContinue={handleAndiamo}
          onBack={goMap}
        />
      )}

      {screen === 'conversation' && scenario && (
        <LiveConversationScreen
          scenario={scenario}
          difficulty={params.difficulty}
          retryWords={params.retryWords}
          gabriellaWords={params.gabriellaWords}
          onEnd={handleStoryEnd}
          onAuthLost={handleAuthLost}
        />
      )}

      {screen === 'intermezzo' && params.toScenario && (
        <IntermezzoScreen
          toScenario={params.toScenario}
          intermezzoText={params.intermezzoText}
          onContinue={handleIntermezzoContinue}
        />
      )}

      {screen === 'debrief' && (
        <DebriefScreen
          debrief={params.debrief}
          scenario={scenario}
          vocabulary={store.vocabulary}
          activeQueueSize={getActiveQueue(store.vocabulary).length}
          lessonThreshold={LESSON_THRESHOLD}
          onVisitGabriella={() => handleStartStory('gabriellaApartment', params.difficulty || 'normale')}
          onHome={goMap}
        />
      )}

      {screen === 'vocabDashboard' && (
        <VocabularyDashboard
          vocabulary={store.vocabulary}
          onBack={goMap}
        />
      )}

      {screen === 'clEntry' && (
        <CLEntryScreen
          character={CL_CHARACTERS[params.characterId]?.character}
          characterData={loadCharacter(params.characterId)}
          onStart={handleCLAndiamo}
          onBack={goMap}
        />
      )}

      {screen === 'clConversation' && (
        <ConversationScreen
          scenario={{
            id: `cl_${params.characterId}`,
            title: `Conversazione — ${CL_CHARACTERS[params.characterId]?.character.name}`,
            characterName: CL_CHARACTERS[params.characterId]?.character.name,
            characterSaysKey: `${params.characterId}_says`,
            stageDirection: '[You sit down at the bar. The conversation starts naturally.]',
            whisperHints: [],
            buildSystemPrompt: () => params.systemPrompt
          }}
          difficulty={params.difficulty}
          retryWords={[]}
          onEnd={({ debrief, transcript, characterMemory, flaggedContext, greenTapContext }) =>
            handleCLEnd({ debrief, transcript, characterMemory, flaggedContext, greenTapContext, lifelineUsed: false })
          }
          onAuthLost={handleAuthLost}
          isCL
          lifeline={{
            words: getDueWords(store.vocabulary).slice(0, 3).map((w) => w.word)
          }}
        />
      )}

      {screen === 'clDebrief' && (
        <CLDebriefScreen
          debrief={params.debrief}
          character={CL_CHARACTERS[params.characterId]?.character}
          lifelineUsed={params.lifelineUsed}
          topic={params.topic}
          onHome={goMap}
        />
      )}

      <ItalianTutor onAuthLost={handleAuthLost} />

      <div
        className={`fade-overlay ${fading ? 'active' : ''}`}
        aria-hidden="true"
      />
    </div>
  );
}
