import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Crown, Skull, Timer, ChevronRight } from 'lucide-react';
import { getHighScores, saveScore } from './lib/mongodb';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };
type ScoreRecord = { score: number; date: string; duration: number };

function App() {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [highScores, setHighScores] = useState<ScoreRecord[]>([]);
  const gridSize = 20;

  useEffect(() => {
    loadHighScores();
  }, []);

  const loadHighScores = async () => {
    const scores = await getHighScores();
    setHighScores(
      scores.map(record => ({
        score: record.score,
        date: new Date(record.createdAt).toLocaleDateString(),
        duration: record.duration
      }))
    );
  };

  const handleSaveScore = async (scoreData: ScoreRecord) => {
    await saveScore(scoreData);
    await loadHighScores();
  };

  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize),
    };
    if (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      return generateFood();
    }
    return newFood;
  }, [snake]);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!gameStarted) {
      setGameStarted(true);
      setStartTime(Date.now());
    }
    
    switch (event.key) {
      case 'ArrowUp':
        if (direction !== 'DOWN') setDirection('UP');
        break;
      case 'ArrowDown':
        if (direction !== 'UP') setDirection('DOWN');
        break;
      case 'ArrowLeft':
        if (direction !== 'RIGHT') setDirection('LEFT');
        break;
      case 'ArrowRight':
        if (direction !== 'LEFT') setDirection('RIGHT');
        break;
    }
  }, [direction, gameStarted]);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood());
    setDirection('RIGHT');
    setGameOver(false);
    setScore(0);
    setGameStarted(false);
    setStartTime(0);
    setCurrentTime(0);
  };

  useEffect(() => {
    if (gameStarted && !gameOver) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameStarted, gameOver]);

  const elapsedTime = useMemo(() => {
    if (!startTime) return 0;
    return Math.floor((currentTime - startTime) / 1000);
  }, [currentTime, startTime]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const moveSnake = () => {
      setSnake(currentSnake => {
        const head = currentSnake[0];
        const newHead = { ...head };

        switch (direction) {
          case 'UP':
            newHead.y -= 1;
            break;
          case 'DOWN':
            newHead.y += 1;
            break;
          case 'LEFT':
            newHead.x -= 1;
            break;
          case 'RIGHT':
            newHead.x += 1;
            break;
        }

        if (
          newHead.x < 0 ||
          newHead.x >= gridSize ||
          newHead.y < 0 ||
          newHead.y >= gridSize ||
          currentSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
        ) {
          setGameOver(true);
          const newScore: ScoreRecord = {
            score,
            date: new Date().toLocaleDateString(),
            duration: elapsedTime
          };
          handleSaveScore(newScore);
          return currentSnake;
        }

        const newSnake = [newHead, ...currentSnake];

        if (newHead.x === food.x && newHead.y === food.y) {
          setFood(generateFood());
          setScore(s => s + 10);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, 100);
    return () => clearInterval(gameInterval);
  }, [direction, food, gameOver, gameStarted, generateFood, score, elapsedTime]);

  const gameGrid = useMemo(() => (
    Array.from({ length: gridSize * gridSize }).map((_, index) => {
      const x = index % gridSize;
      const y = Math.floor(index / gridSize);
      const isSnake = snake.some(segment => segment.x === x && segment.y === y);
      const isFood = food.x === x && food.y === y;
      const isHead = snake[0].x === x && snake[0].y === y;

      return (
        <div
          key={index}
          className={`w-5 h-5 rounded-sm transition-colors duration-100 ${
            isHead
              ? 'bg-green-400'
              : isSnake
              ? 'bg-green-500'
              : isFood
              ? 'bg-red-500'
              : 'bg-gray-800'
          }`}
        />
      );
    })
  ), [snake, food]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
      <div className="flex gap-8">
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center gap-2 bg-gray-800 p-4 rounded-lg">
            <Trophy className="text-yellow-400 w-6 h-6" />
            <span className="text-2xl font-bold text-white">Puntuación: {score}</span>
            <span className="ml-4 text-gray-400 flex items-center">
              <Timer className="w-4 h-4 mr-1" />
              {elapsedTime}s
            </span>
          </div>
          
          <div 
            className="grid bg-gray-800 border-2 border-gray-700 rounded-lg overflow-hidden shadow-lg"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 20px)`,
              gap: '1px',
            }}
          >
            {gameGrid}
          </div>

          {gameOver && (
            <div className="mt-4 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
              <p className="text-red-500 text-xl font-bold mb-2">¡Juego Terminado!</p>
              <button
                onClick={resetGame}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Jugar de Nuevo
              </button>
            </div>
          )}

          {!gameStarted && !gameOver && (
            <div className="mt-4 bg-green-500/10 p-4 rounded-lg border border-green-500/20">
              <p className="text-green-500 font-bold mb-2">
                Presiona cualquier flecha para comenzar
              </p>
            </div>
          )}

          <div className="mt-4 text-gray-400 text-sm bg-gray-800/50 p-3 rounded-lg">
            <p className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4" />
              Usa las flechas del teclado para controlar la serpiente
            </p>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-64">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Crown className="text-yellow-400" />
            Mejores Puntuaciones
          </h2>
          <div className="space-y-3">
            {highScores.map((record, index) => (
              <div
                key={index}
                className="bg-gray-700/50 p-3 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 font-bold">#{index + 1}</span>
                  <span className="text-white">{record.score}</span>
                </div>
                <div className="text-gray-400 text-sm">
                  <div>{record.date}</div>
                  <div className="text-right">{record.duration}s</div>
                </div>
              </div>
            ))}
            {highScores.length === 0 && (
              <div className="text-gray-500 text-center py-4 flex items-center justify-center gap-2">
                <Skull className="w-4 h-4" />
                Sin registros aún
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;