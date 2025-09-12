
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Gamepad2, RotateCcw } from 'lucide-react';
import Link from 'next/link';

// --- Constants ---
const SHIP_SIZE = 30;
const SHIP_THRUST = 0.01;
const SHIP_TURN_SPEED = 0.05;
const FRICTION = 0.99;
const BULLET_SPEED = 5;
const BULLET_LIFESPAN = 60; // frames
const ASTEROID_SPEED = 1.5;
const ASTEROID_SIZES = [15, 30, 60]; // small, medium, large
const ASTEROID_VERTICES = 12;
const ASTEROID_JAG = 0.4;
const INITIAL_ASTEROID_COUNT = 3;
const MAX_ASTEROIDS = 10;
const POINTS_ASTEROID_LARGE = 20;
const POINTS_ASTEROID_MEDIUM = 50;
const POINTS_ASTEROID_SMALL = 100;
const SHIP_INVINCIBILITY_DURATION = 180; // frames (3 seconds)
const SHIP_BLINK_DURATION = 15; // frames

// --- Interfaces ---
interface GameObject {
    x: number;
    y: number;
    xv: number;
    yv: number;
    radius: number;
}

interface Ship extends GameObject {
    angle: number;
    rotation: number;
    isThrusting: boolean;
    blinkTime: number;
    isInvincible: boolean;
}

interface Bullet extends GameObject {
    lifespan: number;
}

interface Asteroid extends GameObject {
    angle: number;
    vert: number;
    offs: number[];
}

// --- Main Game Component ---
export default function AsteroidsPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [level, setLevel] = useState(1);

    const shipRef = useRef<Ship | null>(null);
    const asteroidsRef = useRef<Asteroid[]>([]);
    const bulletsRef = useRef<Bullet[]>([]);
    const keysRef = useRef<{ [key: string]: boolean }>({});
    const animationFrameId = useRef<number>();

    const createAsteroid = useCallback((x?: number, y?: number, sizeIndex?: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const sizeIdx = sizeIndex !== undefined ? sizeIndex : ASTEROID_SIZES.length - 1;
        const radius = ASTEROID_SIZES[sizeIdx];
        
        let newX = x, newY = y;
        if (newX === undefined || newY === undefined) {
            do {
                newX = Math.floor(Math.random() * canvas.width);
                newY = Math.floor(Math.random() * canvas.height);
            } while (shipRef.current && distBetweenPoints(shipRef.current.x, shipRef.current.y, newX, newY) < radius * 2 + SHIP_SIZE);
        }

        const angle = Math.random() * Math.PI * 2;
        const xv = Math.random() * ASTEROID_SPEED * (Math.random() < 0.5 ? 1 : -1);
        const yv = Math.random() * ASTEROID_SPEED * (Math.random() < 0.5 ? 1 : -1);

        // create the jagged edges
        const offs: number[] = [];
        for (let i = 0; i < ASTEROID_VERTICES; i++) {
            offs.push(Math.random() * ASTEROID_JAG * 2 + 1 - ASTEROID_JAG);
        }

        return { x: newX, y: newY, xv, yv, radius, angle, vert: ASTEROID_VERTICES, offs };
    }, []);

    const startGame = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setScore(0);
        setLives(3);
        setLevel(1);

        shipRef.current = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: SHIP_SIZE / 2,
            angle: 90 / 180 * Math.PI, // 90 degrees in radians
            rotation: 0,
            xv: 0,
            yv: 0,
            isThrusting: false,
            blinkTime: SHIP_INVINCIBILITY_DURATION,
            isInvincible: true,
        };

        asteroidsRef.current = [];
        for (let i = 0; i < INITIAL_ASTEROID_COUNT + level - 1; i++) {
            const newAsteroid = createAsteroid();
            if (newAsteroid) asteroidsRef.current.push(newAsteroid);
        }

        bulletsRef.current = [];
        setGameState("playing");
    }, [level, createAsteroid]);

    const gameOver = () => {
        if (shipRef.current) shipRef.current.isThrusting = false;
        setGameState("gameover");
    };

    const distBetweenPoints = (x1: number, y1: number, x2: number, y2: number) => {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    };

    // --- Game Loop ---
    const gameLoop = useCallback(() => {
        if (gameState !== "playing" || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        
        const canvas = canvasRef.current;
        const ship = shipRef.current;

        // Update ship from keys
        if (ship) {
            ship.rotation = (keysRef.current['ArrowRight'] ? -SHIP_TURN_SPEED : 0) + (keysRef.current['ArrowLeft'] ? SHIP_TURN_SPEED : 0);
            ship.isThrusting = !!keysRef.current['ArrowUp'];
        }

        // --- Drawing ---
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // --- Ship Logic ---
        if (ship) {
            // Thrust
            if (ship.isThrusting) {
                ship.xv += SHIP_THRUST * Math.cos(ship.angle);
                ship.yv -= SHIP_THRUST * Math.sin(ship.angle);
            }

            // Rotation
            ship.angle += ship.rotation;

            // Friction
            ship.xv *= FRICTION;
            ship.yv *= FRICTION;

            // Move ship
            ship.x += ship.xv;
            ship.y += ship.yv;

            // Handle screen wrapping
            if (ship.x < 0 - ship.radius) ship.x = canvas.width + ship.radius;
            else if (ship.x > canvas.width + ship.radius) ship.x = 0 - ship.radius;
            if (ship.y < 0 - ship.radius) ship.y = canvas.height + ship.radius;
            else if (ship.y > canvas.height + ship.radius) ship.y = 0 - ship.radius;

            // Invincibility blink
            if (ship.isInvincible) {
                ship.blinkTime--;
                if (ship.blinkTime <= 0) {
                    ship.isInvincible = false;
                }
            }

            // Draw ship (or blink)
            const isBlinking = ship.isInvincible && ship.blinkTime % (SHIP_BLINK_DURATION * 2) < SHIP_BLINK_DURATION;
            if (!isBlinking) {
                ctx.strokeStyle = 'white';
                ctx.lineWidth = SHIP_SIZE / 20;
                ctx.beginPath();
                ctx.moveTo( // nose of the ship
                    ship.x + 4 / 3 * ship.radius * Math.cos(ship.angle),
                    ship.y - 4 / 3 * ship.radius * Math.sin(ship.angle)
                );
                ctx.lineTo( // rear left
                    ship.x - ship.radius * (2 / 3 * Math.cos(ship.angle) + Math.sin(ship.angle)),
                    ship.y + ship.radius * (2 / 3 * Math.sin(ship.angle) - Math.cos(ship.angle))
                );
                ctx.lineTo( // rear right
                    ship.x - ship.radius * (2 / 3 * Math.cos(ship.angle) - Math.sin(ship.angle)),
                    ship.y + ship.radius * (2 / 3 * Math.sin(ship.angle) + Math.cos(ship.angle))
                );
                ctx.closePath();
                ctx.stroke();

                // Draw thruster
                if (ship.isThrusting) {
                    ctx.fillStyle = "red";
                    ctx.strokeStyle = "yellow";
                    ctx.lineWidth = SHIP_SIZE / 10;
                    ctx.beginPath();
                    ctx.moveTo( // rear center
                        ship.x - ship.radius * (2 / 3 * Math.cos(ship.angle) + 0.5 * Math.sin(ship.angle)),
                        ship.y + ship.radius * (2 / 3 * Math.sin(ship.angle) - 0.5 * Math.cos(ship.angle))
                    );
                    ctx.lineTo( // flame
                         ship.x - ship.radius * (6 / 3 * Math.cos(ship.angle)),
                         ship.y + ship.radius * (6 / 3 * Math.sin(ship.angle))
                    );
                     ctx.lineTo( // rear center
                        ship.x - ship.radius * (2 / 3 * Math.cos(ship.angle) - 0.5 * Math.sin(ship.angle)),
                        ship.y + ship.radius * (2 / 3 * Math.sin(ship.angle) + 0.5 * Math.cos(ship.angle))
                    );
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
            }
        }

        // --- Bullets Logic ---
        bulletsRef.current.forEach((bullet, i) => {
            bullet.x += bullet.xv;
            bullet.y += bullet.yv;

            // Handle screen wrapping for bullets
            if (bullet.x < 0) bullet.x = canvas.width;
            else if (bullet.x > canvas.width) bullet.x = 0;
            if (bullet.y < 0) bullet.y = canvas.height;
            else if (bullet.y > canvas.height) bullet.y = 0;

            bullet.lifespan--;
            if (bullet.lifespan <= 0) {
                bulletsRef.current.splice(i, 1);
            }

            // Draw bullet
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, SHIP_SIZE / 15, 0, Math.PI * 2);
            ctx.fill();
        });

        // --- Asteroids Logic ---
        asteroidsRef.current.forEach((roid, i) => {
            roid.x += roid.xv;
            roid.y += roid.yv;

            // Handle screen wrapping
            if (roid.x < 0 - roid.radius) roid.x = canvas.width + roid.radius;
            else if (roid.x > canvas.width + roid.radius) roid.x = 0 - roid.radius;
            if (roid.y < 0 - roid.radius) roid.y = canvas.height + roid.radius;
            else if (roid.y > canvas.height + roid.radius) roid.y = 0 - roid.radius;

            // Draw asteroid
            ctx.strokeStyle = 'slateGray';
            ctx.lineWidth = SHIP_SIZE / 20;
            ctx.beginPath();
            ctx.moveTo(
                roid.x + roid.radius * roid.offs[0] * Math.cos(roid.angle),
                roid.y + roid.radius * roid.offs[0] * Math.sin(roid.angle)
            );
            for (let j = 1; j < roid.vert; j++) {
                ctx.lineTo(
                    roid.x + roid.radius * roid.offs[j] * Math.cos(roid.angle + j * Math.PI * 2 / roid.vert),
                    roid.y + roid.radius * roid.offs[j] * Math.sin(roid.angle + j * Math.PI * 2 / roid.vert)
                );
            }
            ctx.closePath();
            ctx.stroke();
        });
        
        // --- Collision Detection ---
        if (ship && !ship.isInvincible) {
            asteroidsRef.current.forEach((roid, i) => {
                if (distBetweenPoints(ship.x, ship.y, roid.x, roid.y) < ship.radius + roid.radius) {
                    // Ship collision
                    ship.x = canvas.width / 2;
                    ship.y = canvas.height / 2;
                    ship.xv = 0;
                    ship.yv = 0;
                    ship.isInvincible = true;
                    ship.blinkTime = SHIP_INVINCIBILITY_DURATION;
                    setLives(l => {
                        const newLives = l - 1;
                        if (newLives <= 0) {
                            gameOver();
                        }
                        return newLives;
                    });

                    // break asteroid
                    destroyAsteroid(i);
                }
            });
        }

        bulletsRef.current.forEach((bullet, i) => {
            asteroidsRef.current.forEach((roid, j) => {
                if (distBetweenPoints(bullet.x, bullet.y, roid.x, roid.y) < roid.radius) {
                    destroyAsteroid(j);
                    bulletsRef.current.splice(i, 1);
                }
            });
        });

        // Check for level clear
        if (asteroidsRef.current.length === 0) {
            setLevel(l => l + 1);
            for (let i = 0; i < INITIAL_ASTEROID_COUNT + level; i++) {
                const newAsteroid = createAsteroid();
                if (newAsteroid) asteroidsRef.current.push(newAsteroid);
            }
            if (ship){
                ship.isInvincible = true;
                ship.blinkTime = SHIP_INVINCIBILITY_DURATION;
            }
        }


        animationFrameId.current = requestAnimationFrame(gameLoop);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState, createAsteroid, level]);

    const destroyAsteroid = (index: number) => {
        const roid = asteroidsRef.current[index];
        if (!roid) return;

        let scoreToAdd = 0;
        // split asteroid
        if (roid.radius === ASTEROID_SIZES[2]) { // Large
            scoreToAdd = POINTS_ASTEROID_LARGE;
            const newRoid1 = createAsteroid(roid.x, roid.y, 1);
            const newRoid2 = createAsteroid(roid.x, roid.y, 1);
            if (newRoid1) asteroidsRef.current.push(newRoid1);
            if (newRoid2) asteroidsRef.current.push(newRoid2);
        } else if (roid.radius === ASTEROID_SIZES[1]) { // Medium
            scoreToAdd = POINTS_ASTEROID_MEDIUM;
            const newRoid1 = createAsteroid(roid.x, roid.y, 0);
            const newRoid2 = createAsteroid(roid.x, roid.y, 0);
            if (newRoid1) asteroidsRef.current.push(newRoid1);
            if (newRoid2) asteroidsRef.current.push(newRoid2);
        } else {
             scoreToAdd = POINTS_ASTEROID_SMALL;
        }

        setScore(s => s + scoreToAdd);
        asteroidsRef.current.splice(index, 1);
    };

    // --- Keyboard Handlers ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                if (gameState === 'playing' || gameState === 'gameover') {
                    setGameState("start");
                }
                return;
            }

            keysRef.current[e.key] = true;
            if (e.key === ' ') { // Shoot
                e.preventDefault();
                const ship = shipRef.current;
                if (ship && gameState === 'playing') {
                    bulletsRef.current.push({
                        x: ship.x + 4 / 3 * ship.radius * Math.cos(ship.angle),
                        y: ship.y - 4 / 3 * ship.radius * Math.sin(ship.angle),
                        xv: BULLET_SPEED * Math.cos(ship.angle) + ship.xv,
                        yv: -BULLET_SPEED * Math.sin(ship.angle) + ship.yv,
                        radius: SHIP_SIZE / 15,
                        lifespan: BULLET_LIFESPAN,
                    });
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            keysRef.current[e.key] = false;
        };
        
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameState]);

    // --- Start/Stop Game Loop ---
    useEffect(() => {
        if (gameState === "playing") {
            animationFrameId.current = requestAnimationFrame(gameLoop);
        } else {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        }
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [gameState, gameLoop]);
    
    // --- Canvas Resize ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            // Set a fixed size for the canvas
            canvas.width = 800;
            canvas.height = 600;
        }
    }, []);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 font-mono">
            <h1 className="text-4xl font-bold mb-2 text-primary">Asteroids</h1>
            <div className="flex justify-between w-full max-w-4xl text-lg mb-2">
                <div>Score: <span className="text-accent font-semibold">{score}</span></div>
                <div>Level: <span className="text-accent font-semibold">{level}</span></div>
                <div>Lives: <span className="text-accent font-semibold">{lives}</span></div>
            </div>

            <div className="relative w-full max-w-4xl aspect-[4/3] bg-black border-2 border-primary shadow-lg shadow-primary/30">
                <canvas ref={canvasRef} className="w-full h-full" />
                
                {gameState === "start" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                        <h2 className="text-5xl font-bold mb-4">ASTEROIDS</h2>
                        <Button variant="brand" onClick={startGame} className="text-xl py-6 px-8">
                            <Gamepad2 className="mr-3 h-6 w-6" /> Start Game
                        </Button>
                        <div className="mt-8 text-slate-400">
                            <p>Controls:</p>
                            <p><span className="font-semibold text-accent">Arrow Keys</span> to turn and thrust</p>
                            <p><span className="font-semibold text-accent">Spacebar</span> to shoot</p>
                             <p><span className="font-semibold text-accent">Esc</span> to return to this screen</p>
                        </div>
                    </div>
                )}
                
                {gameState === "gameover" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                        <h2 className="text-5xl font-bold text-red-500 mb-4">GAME OVER</h2>
                        <p className="text-2xl mb-6">Final Score: {score}</p>
                        <Button variant="brand" onClick={startGame}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Play Again
                        </Button>
                    </div>
                )}
            </div>
            
            <div className="mt-4 text-center text-slate-500 text-sm">
                <Link href="/" className="hover:text-primary underline">
                    &larr; Back to App Showcase
                </Link>
                <p className="mt-2">&copy; {new Date().getFullYear()} Not-Atari Inc.</p>
            </div>
        </div>
    );
}

    

    