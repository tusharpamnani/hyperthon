import React, { useState, useEffect, useCallback, useRef } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

// Toast notification component
const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500";

  return (
    <div
      className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm`}
    >
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-white hover:text-gray-200"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Based Tier System Component
const BasedTierSystem = ({
  basedScore,
  showTitle = true,
  size = "md",
  showBadge = false,
}: {
  basedScore: number;
  showTitle?: boolean;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
}) => {
  const getTier = (score: number) => {
    if (score >= 140)
      return {
        name: "Ultra Based",
        color: "text-purple-400",
        bg: "bg-purple-900",
      };
    if (score >= 120)
      return {
        name: "Extremely Based",
        color: "text-pink-400",
        bg: "bg-pink-900",
      };
    if (score >= 100)
      return { name: "Very Based", color: "text-blue-400", bg: "bg-blue-900" };
    if (score >= 80)
      return { name: "Based", color: "text-green-400", bg: "bg-green-900" };
    if (score >= 60)
      return {
        name: "Somewhat Based",
        color: "text-yellow-400",
        bg: "bg-yellow-900",
      };
    if (score >= 40)
      return { name: "Normie", color: "text-gray-400", bg: "bg-gray-900" };
    return { name: "Cringe", color: "text-red-400", bg: "bg-red-900" };
  };

  const tier = getTier(basedScore);
  const percentage = Math.min((basedScore / 150) * 100, 100);

  return (
    <div
      className={`${tier.bg} p-4 rounded-lg ${
        size === "lg" ? "text-center" : ""
      }`}
    >
      {showTitle && (
        <div
          className={`font-bold ${size === "lg" ? "text-2xl" : "text-lg"} ${
            tier.color
          } mb-2`}
        >
          {tier.name}
        </div>
      )}
      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${tier.color.replace(
            "text-",
            "bg-"
          )}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-sm text-gray-300">
        {percentage.toFixed(0)}% Based
      </div>
      {showBadge && (
        <div className="mt-4 p-2 border-2 border-dashed border-gray-400 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Share this result:</div>
          <div className="text-sm">
            🎯 I&apos;m {percentage.toFixed(0)}% Based on @BasedQuiz!
          </div>
        </div>
      )}
    </div>
  );
};

// Based Quiz questions focused on crypto, Base ecosystem, and onchain culture
const BASED_QUESTIONS = [
  {
    id: 1,
    question: "What is the Layer 2 solution that Base is built on?",
    correctAnswer: "Optimism",
    options: ["Arbitrum", "Optimism", "zkSync", "Polygon"],
    tag: "based",
  },
  {
    id: 2,
    question: "Which company launched Base?",
    correctAnswer: "Coinbase",
    options: ["Binance", "Coinbase", "Kraken", "FTX"],
    tag: "based",
  },
  {
    id: 3,
    question: "What does 'WAGMI' stand for in crypto culture?",
    correctAnswer: "We're All Gonna Make It",
    options: [
      "We're All Getting More Invested",
      "We're All Gonna Make It",
      "Web3 And Governance Matter Immensely",
      "Wallets And Governance Make Income",
    ],
    tag: "based",
  },
  {
    id: 4,
    question: "What is the term for holding crypto through market volatility?",
    correctAnswer: "Diamond Hands",
    options: ["Paper Hands", "Diamond Hands", "HODL", "Bagging"],
    tag: "based",
  },
  {
    id: 5,
    question:
      "What is the primary programming language for Ethereum smart contracts?",
    correctAnswer: "Solidity",
    options: ["Rust", "Solidity", "JavaScript", "Python"],
    tag: "based",
  },
  {
    id: 6,
    question: "What does 'gm' commonly mean in crypto Twitter/Discord?",
    correctAnswer: "good morning",
    options: ["good money", "great market", "good morning", "gaining momentum"],
    tag: "based",
  },
  {
    id: 7,
    question: "What is a 'rug pull' in crypto?",
    correctAnswer: "When developers abandon a project and take investor funds",
    options: [
      "A technical chart pattern",
      "When developers abandon a project and take investor funds",
      "A type of NFT",
      "A governance proposal",
    ],
    tag: "based",
  },
  {
    id: 8,
    question: "What is the gas fee on Ethereum?",
    correctAnswer: "The cost to perform transactions on the network",
    options: [
      "A subscription fee",
      "The cost to perform transactions on the network",
      "A token staking reward",
      "An NFT minting cost",
    ],
    tag: "based",
  },
  {
    id: 9,
    question:
      "What is the term for when a crypto project gives tokens to early users?",
    correctAnswer: "Airdrop",
    options: ["Staking", "Yield farming", "Airdrop", "Liquidity mining"],
    tag: "based",
  },
  {
    id: 10,
    question: "What is the main benefit of Base compared to Ethereum mainnet?",
    correctAnswer: "Lower transaction fees",
    options: [
      "Lower transaction fees",
      "More decentralization",
      "Faster block times",
      "Higher security",
    ],
    tag: "based",
  },
];

interface GameState {
  currentQuestion: (typeof BASED_QUESTIONS)[0] | null;
  timeLeft: number;
  isAnswering: boolean;
  hasCommitted: boolean;
  hasRevealed: boolean;
  isCorrect: boolean | null;
  playerAnswer: string;
  roundStartTime: number;
  roundId: number;
  answerTimes: number[];
  correctAnswers: number;
  streak: number;
  basedScore: number;
  showResults: boolean;
}

interface LeaderboardEntry {
  fid: number;
  username: string;
  basedScore: number;
  blitzTokens: number;
  streak: number;
  lastPlayed: string;
}

export function FarcasterBasedQuiz() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    currentQuestion: null,
    timeLeft: 60,
    isAnswering: false,
    hasCommitted: false,
    hasRevealed: false,
    isCorrect: null,
    playerAnswer: "",
    roundStartTime: 0,
    roundId: 0,
    answerTimes: [],
    correctAnswers: 0,
    streak: 0,
    basedScore: 0,
    showResults: false,
  });
  const [questionIndex, setQuestionIndex] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [showShareBadge, setShowShareBadge] = useState(false);
  const answerStartTimeRef = useRef<number>(0);
  const [playerStats, setPlayerStats] = useState({
    basedScore: 0,
    streak: 0,
    blitzTokens: 0,
  });
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  // ...existing code...
  // Farcaster SDK state
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isShareLoading, setIsShareLoading] = useState(false);
  // $BLITZ status state
  const [blitzStatus, setBlitzStatus] = useState<{
    balance?: string;
    lastReward?: string;
    lastTxHash?: string;
    isLoading: boolean;
    error?: string;
  }>({ isLoading: false });

  // Fetch $BLITZ status for connected user
  useEffect(() => {
    if (!user?.address) return;
    const fetchBlitzStatus = async () => {
      setBlitzStatus((prev) => ({ ...prev, isLoading: true }));
      try {
        const res = await fetch(`/api/blitz-rewards?address=${user.address}`);
        const data = await res.json();
        setBlitzStatus({
          balance: data.environment?.ownerBalance || "-",
          lastReward: data.message || "-",
          lastTxHash: data.transactionHash || "-",
          isLoading: false,
        });
      } catch (err) {
        setBlitzStatus({ isLoading: false, error: (err as Error).message });
      }
    };
    fetchBlitzStatus();
  }, [user?.address]);

  // Mint $BLITZ to user
  const mintBlitz = useCallback(async () => {
    if (!user?.address) return;
    setBlitzStatus((prev) => ({ ...prev, isLoading: true }));
    try {
      const res = await fetch(`/api/blitz-rewards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: user.address,
          quizId: 0,
          isCorrect: true,
          answer: "mint",
          salt: "mint",
          timeSpent: 1,
          socialShare: false,
        }),
      });
      const data = await res.json();
      setBlitzStatus({
        balance: data.ownerBalance || "-",
        lastReward: data.message || "-",
        lastTxHash: data.transactionHash || "-",
        isLoading: false,
      });
    } catch (err) {
      setBlitzStatus({ isLoading: false, error: (err as Error).message });
    }
  }, [user?.address]);

  // Initialize Farcaster SDK and user context
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        setIsSDKLoaded(true);
        const context = await sdk.context;
        if (context && context.user) {
          setUser(context.user);
          loadUserStats(context.user.fid);
        }
      } catch (error) {
        console.error("Failed to initialize Farcaster SDK:", error);
        showToast("Failed to connect to Farcaster", "error");
      }
    };
    initializeSDK();
  }, []);

  // Load user stats from localStorage (in a real app, this would be from your backend)
  const loadUserStats = (fid: number) => {
    const savedStats = localStorage.getItem(`basedquiz_stats_${fid}`);
    if (savedStats) {
      const stats = JSON.parse(savedStats);
      setPlayerStats(stats);
    }
  };

  // Save user stats
  const saveUserStats = React.useCallback(
    (stats: any) => {
      if (user?.fid) {
        localStorage.setItem(
          `basedquiz_stats_${user.fid}`,
          JSON.stringify(stats)
        );
      }
    },
    [user]
  );

  // Show toast notification
  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
  };

  // Calculate speed bonus based on answer time
  const calculateSpeedBonus = (answerTime: number) => {
    if (answerTime < 2000) return 5; // <2s: +5
    if (answerTime < 5000) return 3; // 2-5s: +3
    if (answerTime < 10000) return 1; // 5-10s: +1
    return 0; // >10s: 0
  };

  // Calculate streak bonus
  const calculateStreakBonus = (streak: number, isCorrect: boolean) => {
    const streakPoints = isCorrect ? streak * 2 : 0;
    const perfectBonus = streak === 10 && isCorrect ? 20 : 0;
    return streakPoints + perfectBonus;
  };

  // Calculate Based Score
  const calculateBasedScore = React.useCallback(() => {
    const { correctAnswers, answerTimes, streak } = gameState;
    const basePoints = correctAnswers * 10;
    const speedBonus = answerTimes.reduce((total, time) => {
      return total + calculateSpeedBonus(time);
    }, 0);
    const streakBonus = calculateStreakBonus(streak, streak > 0);
    return basePoints + speedBonus + streakBonus;
  }, [gameState]);

  // Start a new quiz
  const startNewQuiz = useCallback(async () => {
    setGameState({
      currentQuestion: BASED_QUESTIONS[0],
      timeLeft: 60,
      isAnswering: true,
      hasCommitted: false,
      hasRevealed: false,
      isCorrect: null,
      playerAnswer: "",
      roundStartTime: Date.now(),
      roundId: Math.floor(Math.random() * 1000000),
      answerTimes: [],
      correctAnswers: 0,
      streak: 0,
      basedScore: 0,
      showResults: false,
    });

    setQuestionIndex(0);
    setQuizComplete(false);
    setShowShareBadge(false);
    answerStartTimeRef.current = Date.now();

    showToast(`🎯 First question: ${BASED_QUESTIONS[0].question}`, "info");
  }, []);

  // Submit answer
  const submitAnswer = useCallback(
    async (answer: string) => {
      if (!gameState.currentQuestion) return;

      const answerTime = Date.now() - answerStartTimeRef.current;
      const isCorrect = answer === gameState.currentQuestion.correctAnswer;

      // Update game state
      setGameState((prev) => {
        const newStreak = isCorrect ? prev.streak + 1 : 0;
        const newCorrectAnswers = isCorrect
          ? prev.correctAnswers + 1
          : prev.correctAnswers;
        const newAnswerTimes = [...prev.answerTimes, answerTime];

        return {
          ...prev,
          playerAnswer: answer,
          hasCommitted: true,
          hasRevealed: true,
          isCorrect,
          streak: newStreak,
          correctAnswers: newCorrectAnswers,
          answerTimes: newAnswerTimes,
        };
      });

      // Show feedback
      showToast(
        isCorrect
          ? `✅ Correct! ${calculateSpeedBonus(answerTime)} speed bonus!`
          : `❌ Wrong! The correct answer is: ${gameState.currentQuestion.correctAnswer}`,
        isCorrect ? "success" : "error"
      );

      // Move to next question or end quiz
      const nextIndex = questionIndex + 1;
      if (nextIndex < BASED_QUESTIONS.length) {
        setTimeout(() => {
          setQuestionIndex(nextIndex);
          setGameState((prev) => ({
            ...prev,
            currentQuestion: BASED_QUESTIONS[nextIndex],
            hasCommitted: false,
            hasRevealed: false,
            isCorrect: null,
            playerAnswer: "",
          }));
          answerStartTimeRef.current = Date.now();
        }, 1500);
      } else {
        // End of quiz
        setTimeout(async () => {
          const finalBasedScore = calculateBasedScore();
          setGameState((prev) => ({
            ...prev,
            basedScore: finalBasedScore,
            showResults: true,
          }));
          setQuizComplete(true);

          // Update player stats
          const newStats = {
            basedScore: Math.max(playerStats.basedScore, finalBasedScore),
            streak: Math.max(playerStats.streak, gameState.streak),
            blitzTokens:
              playerStats.blitzTokens + Math.floor(finalBasedScore / 10),
          };
          setPlayerStats(newStats);
          saveUserStats(newStats);

          showToast(
            `Quiz complete! You earned ${Math.floor(
              finalBasedScore / 10
            )} $BLITZ!`,
            "success"
          );
        }, 1500);
      }
    },
    [gameState, questionIndex, playerStats, calculateBasedScore, saveUserStats]
  );

  // Share config
  const shareCast = async (percentage: number) => {
    try {
      setIsShareLoading(true);
      const resultText = `🎯 I&apos;m ${percentage.toFixed(
        0
      )}% Based on @BasedQuiz!`;
      // Use Farcaster MiniApp SDK to compose a cast
      if (sdk.actions && sdk.actions.composeCast) {
        await sdk.actions.composeCast({ text: resultText });
      } else if (sdk.actions && sdk.actions.openUrl) {
        await sdk.actions.openUrl(
          `https://warpcast.com/~/compose?text=${encodeURIComponent(
            resultText
          )}&embeds[]=https://your-app-url.com`
        );
      } else {
        console.log("Demo Mode - Would share:", resultText);
        alert("✅ Share prepared! (Demo mode)");
      }
    } catch (error) {
      console.error("Share Cast failed:", error);
      alert("❌ Failed to share");
    } finally {
      setIsShareLoading(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (gameState.isAnswering && !quizComplete) {
      timerRef.current = setInterval(() => {
        setGameState((prev) => {
          if (prev.timeLeft <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            const nextIndex = questionIndex + 1;
            if (nextIndex < BASED_QUESTIONS.length) {
              setQuestionIndex(nextIndex);
              return {
                ...prev,
                timeLeft: 60,
                currentQuestion: BASED_QUESTIONS[nextIndex],
                hasCommitted: false,
                hasRevealed: false,
                isCorrect: null,
                playerAnswer: "",
              };
            } else {
              const finalBasedScore = calculateBasedScore();
              setQuizComplete(true);
              const newStats = {
                basedScore: Math.max(playerStats.basedScore, finalBasedScore),
                streak: Math.max(playerStats.streak, prev.streak),
                blitzTokens:
                  playerStats.blitzTokens + Math.floor(finalBasedScore / 10),
              };
              setPlayerStats(newStats);
              saveUserStats(newStats);

              return {
                ...prev,
                timeLeft: 0,
                basedScore: finalBasedScore,
                showResults: true,
              };
            }
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [
    gameState.isAnswering,
    questionIndex,
    quizComplete,
    playerStats,
    calculateBasedScore,
    saveUserStats,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Render quiz results
  const renderQuizResults = () => {
    return (
      <div className="bg-gray-900 p-6 rounded-xl shadow-lg max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Quiz Complete!</h2>

        <div className="mb-6">
          <div className="text-4xl font-bold text-green-400 mb-2">
            {gameState.basedScore}
          </div>
          <div className="text-gray-300">Based Score</div>
        </div>

        <div className="mb-6">
          <BasedTierSystem
            basedScore={gameState.basedScore}
            showTitle={true}
            size="lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-2xl font-bold text-blue-400">
              {gameState.correctAnswers}/10
            </div>
            <div className="text-gray-400 text-sm">Correct Answers</div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-2xl font-bold text-purple-400">
              {Math.floor(gameState.basedScore / 10)}
            </div>
            <div className="text-gray-400 text-sm">$BLITZ Earned</div>
          </div>
        </div>

        {showShareBadge ? (
          <BasedTierSystem
            basedScore={gameState.basedScore}
            showTitle={false}
            showBadge={true}
          />
        ) : (
          <div className="flex gap-4">
            <button
              onClick={() =>
                shareCast(Math.min((gameState.basedScore / 150) * 100, 100))
              }
              disabled={isShareLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
            >
              Share to Farcaster
            </button>
            <button
              onClick={startNewQuiz}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
            >
              Play Again
            </button>
          </div>
        )}

        {showShareBadge && (
          <button
            onClick={startNewQuiz}
            className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
          >
            Play Again
          </button>
        )}
      </div>
    );
  };

  // Render quiz interface
  const renderQuizInterface = () => {
    const { currentQuestion, timeLeft, hasCommitted } = gameState;

    if (!currentQuestion) return null;

    const timerColor =
      timeLeft > 30
        ? "text-green-500"
        : timeLeft > 10
        ? "text-yellow-500"
        : "text-red-500";

    return (
      <div className="bg-gray-900 p-6 rounded-xl shadow-lg max-w-md mx-auto">
        {/* Question counter */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-gray-400 text-sm">
            Question {questionIndex + 1}/10
          </div>
          <div className={`${timerColor} font-bold text-xl`}>{timeLeft}s</div>
        </div>

        {/* Question */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-2">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Answer options */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => submitAnswer(option)}
              disabled={hasCommitted}
              className={`p-3 rounded-lg text-left transition ${
                hasCommitted && option === currentQuestion.correctAnswer
                  ? "bg-green-600 text-white"
                  : hasCommitted &&
                    option === gameState.playerAnswer &&
                    option !== currentQuestion.correctAnswer
                  ? "bg-red-600 text-white"
                  : "bg-gray-800 text-white hover:bg-gray-700"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Streak indicator */}
        {gameState.streak > 0 && (
          <div className="text-center mb-4">
            <span className="inline-block bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
              {gameState.streak} streak 🔥
            </span>
          </div>
        )}
      </div>
    );
  };

  // Render leaderboard
  const renderBasedboard = () => {
    const mockLeaderboard: LeaderboardEntry[] = [
      {
        fid: 12345,
        username: "basedanon",
        basedScore: 142,
        blitzTokens: 28,
        streak: 10,
        lastPlayed: "1h ago",
      },
      {
        fid: 67890,
        username: "cryptomaxi",
        basedScore: 118,
        blitzTokens: 23,
        streak: 8,
        lastPlayed: "3h ago",
      },
      {
        fid: 11111,
        username: "onchainonly",
        basedScore: 105,
        blitzTokens: 21,
        streak: 7,
        lastPlayed: "5h ago",
      },
    ];

    return (
      <div className="bg-gray-900 p-6 rounded-xl shadow-lg max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Basedboard</h2>
          <button
            onClick={() => setShowLeaderboard(false)}
            className="text-gray-400 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="overflow-hidden rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  $BLITZ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {mockLeaderboard.map((entry, index) => (
                <tr
                  key={entry.fid}
                  className={index === 0 ? "bg-purple-900 bg-opacity-30" : ""}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      @{entry.username}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-green-400 font-bold">
                      {entry.basedScore}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-purple-400">
                      {entry.blitzTokens}
                    </div>
                  </td>
                </tr>
              ))}
              {user && (
                <tr className="bg-blue-900 bg-opacity-30">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">You</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      @{user.username}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-green-400 font-bold">
                      {playerStats.basedScore}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-purple-400">
                      {playerStats.blitzTokens}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Loading state
  if (!isSDKLoaded) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-xl">Loading Based Quiz...</div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Based Quiz</h1>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="bg-gray-800 px-3 py-1 rounded-full text-sm">
                  <span className="text-purple-400 font-bold">
                    {playerStats.blitzTokens}
                  </span>{" "}
                  $BLITZ
                </div>
                <div className="text-sm text-gray-400">@{user.username}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">Connect via Farcaster</div>
            )}
          </div>
        </div>

        {/* Tagline */}
        <p className="text-gray-400 mt-2">
          Prove you&apos;re not cringe. Earn $BLITZ. Climb the Basedboard.
        </p>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto">
        {/* Toast notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* $BLITZ Status Panel */}
        {user && (
          <div className="bg-gray-900 rounded-lg p-4 mb-4">
            <div className="font-bold text-purple-400 mb-2">$BLITZ Status</div>
            {blitzStatus.isLoading ? (
              <div className="text-xs text-gray-400">Loading...</div>
            ) : blitzStatus.error ? (
              <div className="text-xs text-red-400">
                Error: {blitzStatus.error}
              </div>
            ) : (
              <>
                <div className="text-xs text-gray-300 mb-1">
                  Balance:{" "}
                  <span className="font-bold">{blitzStatus.balance}</span>
                </div>
                <div className="text-xs text-gray-300 mb-1">
                  Last Reward:{" "}
                  <span className="font-bold">{blitzStatus.lastReward}</span>
                </div>
                <div className="text-xs text-gray-300 mb-1">
                  Last Tx Hash:{" "}
                  <span className="font-bold">{blitzStatus.lastTxHash}</span>
                </div>
                <button
                  onClick={mintBlitz}
                  disabled={blitzStatus.isLoading}
                  className="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition"
                >
                  Mint $BLITZ
                </button>
              </>
            )}
          </div>
        )}

        {/* Game content */}
        {showLeaderboard ? (
          renderBasedboard()
        ) : gameState.showResults ? (
          renderQuizResults()
        ) : gameState.isAnswering ? (
          renderQuizInterface()
        ) : (
          <div className="bg-gray-900 p-6 rounded-xl shadow-lg max-w-md mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              How Based Are You?
            </h2>
            <p className="text-gray-300 mb-6">
              Test your crypto knowledge with 10 questions about Base, crypto
              fundamentals, and onchain culture.
            </p>

            {user ? (
              <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-sm font-bold">
                    {user.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="text-white">Welcome, @{user.username}!</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-green-400 font-bold">
                      {playerStats.basedScore}
                    </div>
                    <div className="text-gray-400">Best Score</div>
                  </div>
                  <div>
                    <div className="text-yellow-400 font-bold">
                      {playerStats.streak}
                    </div>
                    <div className="text-gray-400">Best Streak</div>
                  </div>
                  <div>
                    <div className="text-purple-400 font-bold">
                      {playerStats.blitzTokens}
                    </div>
                    <div className="text-gray-400">$BLITZ</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-yellow-900 bg-opacity-50 rounded-lg">
                <div className="text-yellow-300 text-sm">
                  ⚠️ Open this mini app in Farcaster to track your progress and
                  earn $BLITZ tokens!
                </div>
              </div>
            )}

            <button
              onClick={startNewQuiz}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition w-full mb-4"
            >
              Start Quiz
            </button>
            <button
              onClick={() => setShowLeaderboard(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition w-full"
            >
              View Basedboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
