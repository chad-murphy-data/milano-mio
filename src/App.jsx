import { useState } from 'react';
import LoginScreen from './screens/LoginScreen.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import BriefingScreen from './screens/BriefingScreen.jsx';
import ConversationScreen from './screens/ConversationScreen.jsx';
import DebriefScreen from './screens/DebriefScreen.jsx';
import VocabularyDashboard from './screens/VocabularyDashboard.jsx';
import CLEntryScreen from './screens/ConversazioneLibera/EntryScreen.jsx';
import CLDebriefScreen from './screens/ConversazioneLibera/DebriefScreen.jsx';
import ItalianTutor from './components/ItalianTutor.jsx';
import { getScenario } from './data/scenarios.js';
import * as lucaData from './data/conversazioneLibera/luca.js';
import * as giuliaData from './data/conversazioneLibera/giulia.js';
import { loadStore, saveSession, loadCharacter, saveCharacter } from './hooks/useLocalStorage.js';
import { getRetryWordsForLocation, getDueWords } from './utils/vocabularyEngine.js';
import { pickTopic, updateCharacterData } from './utils/characterMemory.js';
import { getSavedPassword } from './utils/claudeApi.js';

const CL_CHARACTERS = {
  luca: lucaData,
  giulia: giuliaData
};

export default function App() {
  const [authed, setAuthed] = useState(() => Boolean(getSavedPassword()));
  const [route, setRoute] = useState({ screen: 'home', params: {} });

  const go = (screen, params = {}) => setRoute({ screen, params });
  const goHome = () => go('home');

  // ---------------------------------------------------------------------------
  // Story mode handlers
  // ---------------------------------------------------------------------------

  const handleStartStory = (scenarioId, difficulty) => {
    const store = loadStore();
    const retryWords = getRetryWordsForLocation(store.vocabulary, scenarioId);
    go('briefing', { scenarioId, difficulty, retryWords });
  };

  const handleAndiamo = () => {
    go('conversation', route.params);
  };

  const handleStoryEnd = ({ debrief, transcript }) => {
    const { scenarioId, difficulty } = route.params;
    const scenario = getScenario(scenarioId);
    const characterSays =
      debrief?.[scenario?.characterSaysKey] || debrief?.marco_says || '';

    const session = {
      id: crypto.randomUUID?.() || String(Date.now()),
      date: new Date().toISOString(),
      location: scenarioId,
      difficulty,
      learned: debrief?.learned || [],
      retry: debrief?.retry || [],
      character_says: characterSays,
      transitionTo: debrief?.transitionTo || null,
      transcript
    };
    saveSession(session);
    go('debrief', { scenarioId, debrief: { ...debrief, character_says: characterSays }, transcript });
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

    go('clConversation', {
      characterId,
      difficulty,
      topic,
      systemPrompt,
      characterData,
      charModule
    });
  };

  const handleCLEnd = ({ debrief, transcript, characterMemory, lifelineUsed }) => {
    const { characterId, difficulty, topic } = route.params;
    const characterData = loadCharacter(characterId);

    // Save character memory
    if (characterMemory) {
      const updated = updateCharacterData(characterData, characterMemory);
      saveCharacter(characterId, updated);
    }

    // Save session
    const charModule = CL_CHARACTERS[characterId];
    const characterSays =
      debrief?.[`${characterId}_says`] || debrief?.character_says || '';

    const session = {
      id: crypto.randomUUID?.() || String(Date.now()),
      date: new Date().toISOString(),
      location: `cl_${characterId}`,
      difficulty,
      learned: debrief?.learned || [],
      retry: debrief?.retry || [],
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
    go('home');
  };

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
      {screen === 'home' && (
        <HomeScreen
          onStartStory={handleStartStory}
          onStartCL={handleStartCL}
          onOpenVocab={() => go('vocabDashboard')}
          store={store}
        />
      )}

      {screen === 'briefing' && scenario && (
        <BriefingScreen
          scenario={scenario}
          difficulty={params.difficulty}
          retryWords={params.retryWords}
          onContinue={handleAndiamo}
          onBack={goHome}
        />
      )}

      {screen === 'conversation' && scenario && (
        <ConversationScreen
          scenario={scenario}
          difficulty={params.difficulty}
          retryWords={params.retryWords}
          onEnd={handleStoryEnd}
          onAuthLost={handleAuthLost}
        />
      )}

      {screen === 'debrief' && (
        <DebriefScreen
          debrief={params.debrief}
          scenario={scenario}
          vocabulary={store.vocabulary}
          onHome={goHome}
        />
      )}

      {screen === 'vocabDashboard' && (
        <VocabularyDashboard
          vocabulary={store.vocabulary}
          onBack={goHome}
        />
      )}

      {screen === 'clEntry' && (
        <CLEntryScreen
          character={CL_CHARACTERS[params.characterId]?.character}
          characterData={loadCharacter(params.characterId)}
          onStart={handleCLAndiamo}
          onBack={goHome}
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
          onEnd={({ debrief, transcript, characterMemory }) =>
            handleCLEnd({ debrief, transcript, characterMemory, lifelineUsed: false })
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
          onHome={goHome}
        />
      )}

      <ItalianTutor onAuthLost={handleAuthLost} />
    </div>
  );
}
