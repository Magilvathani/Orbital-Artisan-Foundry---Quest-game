
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { GameData, Quest, ActiveProcess } from './types';
import { generateQuest } from './services/geminiService';
import { CashIcon, MaterialIcon, PowerIcon, ResearchIcon, RocketIcon } from './components/icons';

const INITIAL_GAME_DATA: GameData = {
  cash: 50000,
  materials: 1000,
  power: 500,
  researchPoints: 0,
  day: 1,
};

// Component for displaying a resource
const ResourceDisplay: React.FC<{ icon: React.ReactNode; value: number | string; label: string }> = ({ icon, value, label }) => (
    <div className="flex items-center space-x-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700">
        {icon}
        <div className="flex flex-col text-right">
            <span className="text-lg font-bold text-cyan-300">{value}</span>
            <span className="text-xs text-slate-400">{label}</span>
        </div>
    </div>
);

// Header component
const Header: React.FC<{ gameData: GameData }> = ({ gameData }) => (
    <header className="fixed top-0 left-0 right-0 bg-slate-900/30 backdrop-blur-md p-4 z-10 border-b border-slate-700">
        <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold text-cyan-400 tracking-wider">Orbital Artisan Foundry</h1>
            <div className="flex items-center space-x-4">
                <ResourceDisplay icon={<CashIcon className="h-8 w-8 text-green-400"/>} value={`$${gameData.cash.toLocaleString()}`} label="Credits"/>
                <ResourceDisplay icon={<MaterialIcon className="h-8 w-8 text-orange-400"/>} value={`${gameData.materials.toLocaleString()} kg`} label="Materials"/>
                <ResourceDisplay icon={<PowerIcon className="h-8 w-8 text-yellow-400"/>} value={`${gameData.power} kW`} label="Power"/>
                <ResourceDisplay icon={<ResearchIcon className="h-8 w-8 text-purple-400"/>} value={gameData.researchPoints.toLocaleString()} label="Research"/>
                 <div className="flex items-center space-x-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700">
                    <div className="flex flex-col text-right">
                        <span className="text-lg font-bold text-cyan-300">{gameData.day}</span>
                        <span className="text-xs text-slate-400">Day</span>
                    </div>
                </div>
            </div>
        </div>
    </header>
);

// Card component for quests
const QuestCard: React.FC<{ quest: Quest; onAccept: (quest: Quest) => void; disabled: boolean }> = ({ quest, onAccept, disabled }) => (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4 shadow-lg flex flex-col justify-between h-full hover:border-cyan-400 transition-all duration-300">
        <div>
            <h3 className="text-lg font-bold text-cyan-300">{quest.title}</h3>
            <p className="text-sm text-slate-400 mb-2">Client: {quest.client}</p>
            <p className="text-sm text-slate-300 mb-4">{quest.description}</p>
            <div className="text-xs space-y-1 mb-4">
                <p><strong className="font-semibold text-orange-300">Materials:</strong> {quest.requirements.materials} kg</p>
                <p><strong className="font-semibold text-yellow-300">Time:</strong> {quest.requirements.time} days</p>
            </div>
        </div>
        <div className="mt-auto">
            <div className="text-sm space-y-1 mb-4">
                <p><strong className="font-semibold text-green-300">Reward:</strong> ${quest.reward.cash.toLocaleString()}</p>
                <p><strong className="font-semibold text-purple-300">Research:</strong> {quest.reward.research} RP</p>
            </div>
            <button
                onClick={() => onAccept(quest)}
                disabled={disabled}
                className="w-full bg-cyan-600 text-white font-bold py-2 px-4 rounded hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200"
            >
                Accept Contract
            </button>
        </div>
    </div>
);

// Main App component
export default function App() {
    const [gameData, setGameData] = useState<GameData>(INITIAL_GAME_DATA);
    const [quests, setQuests] = useState<Quest[]>([]);
    const [activeProcess, setActiveProcess] = useState<ActiveProcess | null>(null);
    const [gameLog, setGameLog] = useState<string[]>(["Welcome to the Orbital Artisan Foundry! Generate new quests to begin."]);
    const [isGeneratingQuests, setIsGeneratingQuests] = useState(false);

    const gameDataRef = useRef(gameData);
    const activeProcessRef = useRef(activeProcess);

    useEffect(() => {
        gameDataRef.current = gameData;
    }, [gameData]);

    useEffect(() => {
        activeProcessRef.current = activeProcess;
    }, [activeProcess]);

    const addLog = useCallback((message: string) => {
        const timestamp = `[Day ${gameDataRef.current.day}]`;
        setGameLog(prev => [`${timestamp} ${message}`, ...prev.slice(0, 9)]);
    }, []);

    const fetchNewQuests = useCallback(async () => {
        setIsGeneratingQuests(true);
        addLog("Contacting clients for new high-value contracts...");
        const newQuestsPromises = [generateQuest(1), generateQuest(1), generateQuest(1)];
        const newQuests = await Promise.all(newQuestsPromises);
        setQuests(newQuests);
        setIsGeneratingQuests(false);
        addLog("New contracts received and available on the quest board.");
    }, [addLog]);
    
    useEffect(() => {
      fetchNewQuests();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Main Game Loop
    useEffect(() => {
        const interval = setInterval(() => {
            setGameData(prev => ({ ...prev, day: prev.day + 1 }));

            if (activeProcessRef.current) {
                const currentProcess = activeProcessRef.current;
                const newDaysRemaining = currentProcess.daysRemaining - 1;

                if (newDaysRemaining <= 0) {
                    // Process complete
                    setActiveProcess(null);
                    if (currentProcess.type === 'Manufacturing') {
                        addLog(`Manufacturing of '${currentProcess.quest.title}' complete! Ready for delivery.`);
                        // For simplicity, product is ready. A delivery step could be added here.
                         setGameData(prev => ({
                            ...prev,
                            cash: prev.cash + currentProcess.quest.reward.cash,
                            researchPoints: prev.researchPoints + currentProcess.quest.reward.research
                        }));
                        addLog(`Product delivered. Received +$${currentProcess.quest.reward.cash} and +${currentProcess.quest.reward.research} RP.`);
                    }
                } else {
                    // Process ongoing
                    const totalDuration = currentProcess.quest.requirements.time;
                    const progress = ((totalDuration - newDaysRemaining) / totalDuration) * 100;
                    setActiveProcess({ ...currentProcess, daysRemaining: newDaysRemaining, progress });
                }
            }

        }, 2000); // 1 day passes every 2 seconds

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [addLog]);

    const handleAcceptQuest = (quest: Quest) => {
        if (activeProcess) {
            addLog("Cannot start a new project while another is in progress.");
            return;
        }
        if (gameData.materials < quest.requirements.materials) {
            addLog("Insufficient materials to start this project.");
            return;
        }

        setGameData(prev => ({ ...prev, materials: prev.materials - quest.requirements.materials }));
        setActiveProcess({
            type: 'Manufacturing',
            quest: quest,
            progress: 0,
            daysRemaining: quest.requirements.time,
        });
        setQuests([]); // Clear quests once one is accepted
        addLog(`Manufacturing of '${quest.title}' has begun. ETA: ${quest.requirements.time} days.`);
    };

    return (
        <div 
            className="min-h-screen bg-cover bg-center bg-fixed"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2071&auto=format&fit=crop')" }}
        >
            <div className="min-h-screen bg-black/60 backdrop-blur-sm">
                <Header gameData={gameData} />
                <main className="container mx-auto pt-24 p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Left Column: Quest Board */}
                        <div className="lg:col-span-2">
                            <h2 className="text-xl font-semibold mb-4 text-cyan-200 border-b-2 border-cyan-500/30 pb-2">Contract Board</h2>
                            {quests.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {quests.map(q => (
                                    <QuestCard key={q.id} quest={q} onAccept={handleAcceptQuest} disabled={!!activeProcess || gameData.materials < q.requirements.materials} />
                                ))}
                                </div>
                            ) : (
                                <div className="text-center p-8 bg-slate-800/50 rounded-lg">
                                    <p className="text-slate-400">
                                        {activeProcess ? "A project is currently in progress." : "No contracts available. Generate new ones."}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Station Status & Actions */}
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-semibold mb-4 text-cyan-200 border-b-2 border-cyan-500/30 pb-2">Station Status</h2>
                                <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4 shadow-lg">
                                    {activeProcess ? (
                                        <div>
                                            <h4 className="font-bold text-cyan-300">{activeProcess.type}: {activeProcess.quest.title}</h4>
                                            <p className="text-sm text-slate-400">Time remaining: {activeProcess.daysRemaining} days</p>
                                            <div className="w-full bg-slate-700 rounded-full h-2.5 mt-2">
                                                <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${activeProcess.progress}%` }}></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-slate-400">All systems idle. Ready for new task.</p>
                                    )}
                                </div>
                            </div>
                            
                            <div>
                                 <h2 className="text-xl font-semibold mb-4 text-cyan-200 border-b-2 border-cyan-500/30 pb-2">Actions</h2>
                                <button
                                    onClick={fetchNewQuests}
                                    disabled={isGeneratingQuests || quests.length > 0 || !!activeProcess}
                                    className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white font-bold py-2 px-4 rounded hover:bg-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    {isGeneratingQuests ? 'Generating...' : 'Generate New Quests'}
                                </button>
                            </div>

                            <div>
                                <h2 className="text-xl font-semibold mb-4 text-cyan-200 border-b-2 border-cyan-500/30 pb-2">Operations Log</h2>
                                <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4 shadow-lg h-48 overflow-y-auto">
                                    <ul className="space-y-1 text-sm">
                                        {gameLog.map((msg, i) => (
                                            <li key={i} className="text-slate-300">{msg}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
