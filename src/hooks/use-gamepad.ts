import { Button } from '@nx.js/constants';
import { type DependencyList, useCallback, useEffect } from 'react';
import type { ButtonName } from '../types';
type Direction = Extract<ButtonName, 'Up' | 'Down' | 'Left' | 'Right'>;
interface CallbackConfig {
	callback: () => void;
	repeat: boolean;
	initialDelay: number;
	repeatDelay: number;
	lastTriggerTime: number;
	hasMetRepeatDelay: boolean;
}

const defaultInitialDelay = 500;
const defaultRepeatDelay = 100;

class GamepadLoop {
	running = false;
	callbacks = new Map<CallbackConfig, ButtonName>();
	stickCallbacks = new Map<CallbackConfig, Direction>();
	stickDirection = {
		Up: false,
		Down: false,
		Left: false,
		Right: false,
	} as Record<Direction, boolean>;
	buttonState: boolean[] = [];
	lastFrameTime = 0;

	constructor() {
		navigator.virtualKeyboard.addEventListener(
			'geometrychange',
			this.#onVirtualKeyboardGeometryChange,
		);
	}

	queueLoop() {
		if (this.running) return;
		if (navigator.virtualKeyboard.boundingRect.height > 0) return;
		this.running = true;
		this.lastFrameTime = performance.now();
		queueMicrotask(this.loop);
	}

	#onVirtualKeyboardGeometryChange = () => {
		if (navigator.virtualKeyboard.boundingRect.height > 0) {
			this.running = false;
		} else {
			this.queueLoop();
		}
	};

	#handleCallback(
		config: CallbackConfig,
		wasPressed: boolean,
		isPressed: boolean,
		currentTime: number,
	) {
		const timeSinceLastTrigger = currentTime - config.lastTriggerTime;

		if (!wasPressed && isPressed) {
			// First press - trigger immediately
			config.callback();
			config.hasMetRepeatDelay = false; // Reset to wait for initial delay
			config.lastTriggerTime = currentTime;
		} else if (isPressed && config.repeat) {
			// For repeats, check if we've waited long enough
			const delay = config.hasMetRepeatDelay
				? config.repeatDelay
				: config.initialDelay;
			if (timeSinceLastTrigger >= delay) {
				config.callback();
				config.lastTriggerTime = currentTime;
				config.hasMetRepeatDelay = true; // Mark that we've waited for initial delay
			}
		} else if (!isPressed) {
			config.hasMetRepeatDelay = false;
			config.lastTriggerTime = 0;
		}
	}

	loop = () => {
		if (
			(this.callbacks.size === 0 && this.stickCallbacks.size === 0) ||
			!this.running
		)
			return;

		const [gp] = navigator.getGamepads();
		if (!gp) return;

		const currentTime = performance.now();

		// Handle button callbacks
		for (const [config, button] of this.callbacks) {
			const buttonNum = Button[button];
			const wasPressed = this.buttonState[buttonNum];
			const isPressed = gp.buttons[buttonNum]?.pressed;

			if (!wasPressed && isPressed) {
				this.buttonState[buttonNum] = true;
			} else if (wasPressed && !isPressed) {
				this.buttonState[buttonNum] = false;
			}

			this.#handleCallback(config, wasPressed, isPressed, currentTime);
		}

		const currentStickDirection = this.#getCurrentStickDirection(gp);

		// Handle stick callbacks
		for (const [config, direction] of this.stickCallbacks) {
			const wasPressed = this.stickDirection[direction];
			const isPressed = currentStickDirection[direction];
			this.#handleCallback(config, wasPressed, isPressed, currentTime);
		}

		this.stickDirection = currentStickDirection;
		requestAnimationFrame(this.loop);
	};

	add(
		cb: () => void,
		button: ButtonName,
		repeat = false,
		initialDelay = defaultInitialDelay,
		repeatDelay = defaultRepeatDelay,
	) {
		const config: CallbackConfig = {
			callback: cb,
			repeat,
			initialDelay,
			repeatDelay,
			lastTriggerTime: 0,
			hasMetRepeatDelay: false,
		};
		this.callbacks.set(config, button);
		this.queueLoop();
	}

	// Only checking left stick at the moment... TODO: add right stick
	addStick(
		cb: () => void,
		direction: Direction,
		repeat = false,
		initialDelay = defaultInitialDelay,
		repeatDelay = defaultRepeatDelay,
	) {
		const config: CallbackConfig = {
			callback: cb,
			repeat,
			initialDelay,
			repeatDelay,
			lastTriggerTime: 0,
			hasMetRepeatDelay: false,
		};
		this.stickCallbacks.set(config, direction);
		this.queueLoop();
	}

	delete(cb: () => void) {
		for (const [config] of this.callbacks) {
			if (config.callback === cb) {
				this.callbacks.delete(config);
				break;
			}
		}
		for (const [config] of this.stickCallbacks) {
			if (config.callback === cb) {
				this.stickCallbacks.delete(config);
				break;
			}
		}
		if (this.callbacks.size === 0 && this.stickCallbacks.size === 0) {
			this.running = false;
		}
	}

	#getCurrentStickDirection(gp: Gamepad) {
		const deadzone = 0.2; // Add deadzone to prevent accidental triggers
		const threshold = 0.7; // threshold for the stick to be considered pressed

		const [hAxis, vAxis] = gp.axes;

		const currentStickDirection = {
			Up: false,
			Down: false,
			Left: false,
			Right: false,
		} as Record<Direction, boolean>;

		// Only set one direction based on which axis has the largest magnitude
		if (Math.abs(hAxis) > deadzone || Math.abs(vAxis) > deadzone) {
			if (Math.abs(hAxis) > Math.abs(vAxis)) {
				const direction = hAxis > 0 ? 'Right' : 'Left';
				const wasPressed = this.stickDirection[direction];
				if (!wasPressed && Math.abs(hAxis) > threshold) {
					currentStickDirection[direction] = true;
				} else if (wasPressed && Math.abs(hAxis) < deadzone) {
					currentStickDirection[direction] = false;
				} else {
					currentStickDirection[direction] = wasPressed;
				}
			} else {
				const direction = vAxis > 0 ? 'Down' : 'Up';
				const wasPressed = this.stickDirection[direction];
				if (!wasPressed && Math.abs(vAxis) > threshold) {
					currentStickDirection[direction] = true;
				} else if (wasPressed && Math.abs(vAxis) < deadzone) {
					currentStickDirection[direction] = false;
				} else {
					currentStickDirection[direction] = wasPressed;
				}
			}
		}
		return currentStickDirection;
	}
}

const gamepadLoop = new GamepadLoop();

export function useGamepadButton(
	button: ButtonName,
	callback: () => void,
	deps: DependencyList,
	focused = true,
	repeat?: boolean,
	initialDelay?: number,
	repeatDelay?: number,
) {
	const cb = useCallback(callback, deps);

	useEffect(() => {
		if (!focused) {
			gamepadLoop.delete(cb);
			return;
		}
		gamepadLoop.add(cb, button, repeat, initialDelay, repeatDelay);
		return () => {
			gamepadLoop.delete(cb);
		};
	}, [focused, cb, button, repeat, initialDelay, repeatDelay]);
}

export function useJoystick(
	direction: Direction,
	callback: () => void,
	deps: DependencyList,
	focused = true,
	repeat?: boolean,
	initialDelay?: number,
	repeatDelay?: number,
) {
	const cb = useCallback(callback, deps);

	useEffect(() => {
		if (!focused) {
			gamepadLoop.delete(cb);
			return;
		}
		gamepadLoop.addStick(cb, direction, repeat, initialDelay, repeatDelay);
		return () => {
			gamepadLoop.delete(cb);
		};
	}, [focused, cb, direction, repeat, initialDelay, repeatDelay]);
}

/**
 * Listen for both dpad and stick directions together
 */
export function useDirection(
	direction: Direction,
	callback: () => void,
	deps: DependencyList,
	focused = true,
	repeat?: boolean,
	initialDelay?: number,
	repeatDelay?: number,
) {
	const cb = useCallback(callback, deps);

	useEffect(() => {
		if (!focused) {
			gamepadLoop.delete(cb);
			return;
		}

		// Add both callbacks with their respective configs
		gamepadLoop.add(cb, direction, repeat, initialDelay, repeatDelay);
		gamepadLoop.addStick(cb, direction, repeat, initialDelay, repeatDelay);

		return () => {
			gamepadLoop.delete(cb);
		};
	}, [focused, cb, direction, repeat, initialDelay, repeatDelay]);
}
