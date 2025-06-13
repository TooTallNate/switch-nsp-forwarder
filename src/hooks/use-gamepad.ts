import { Button } from "@nx.js/constants";
import {
	type DependencyList,
	useCallback,
	useEffect,
	useState,
	useRef,
} from "react";
import type { ButtonName } from "../types";
type Direction = Extract<ButtonName, "Up" | "Down" | "Left" | "Right">;

class GamepadLoop {
	running = false;
	callbacks = new Map<() => void, ButtonName>();
	stickCallbacks = new Map<() => void, Direction>();
	stickDirection = {
		Up: false,
		Down: false,
		Left: false,
		Right: false,
	} as Record<Direction, boolean>;
	pressed: boolean[] = [];

	constructor() {
		navigator.virtualKeyboard.addEventListener(
			"geometrychange",
			this.#onVirtualKeyboardGeometryChange
		);
	}

	queueLoop() {
		if (this.running) return;
		if (navigator.virtualKeyboard.boundingRect.height > 0) return;
		this.running = true;
		queueMicrotask(this.loop);
	}

	#onVirtualKeyboardGeometryChange = () => {
		if (navigator.virtualKeyboard.boundingRect.height > 0) {
			this.running = false;
		} else {
			this.queueLoop();
		}
	};

	loop = () => {
		if (this.callbacks.size === 0 || !this.running) return;

		const [gp] = navigator.getGamepads();
		if (!gp) return;

		for (const [cb, button] of this.callbacks) {
			const buttonNum = Button[button];
			const wasPressed = this.pressed[buttonNum];
			const isPressed = gp.buttons[buttonNum]?.pressed;

			// possible issue where multiple CBs for the same button won't be called, only the first one.
			if (!wasPressed && isPressed) {
				this.pressed[buttonNum] = true;
				cb();
			} else if (wasPressed && !isPressed) {
				this.pressed[buttonNum] = false;
			}
		}

		const deadzone = 0.2; // Add deadzone to prevent accidental triggers
		const threshold = 0.7;

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
				const direction = hAxis > 0 ? "Right" : "Left";
				const wasPressed = this.stickDirection[direction];
				if (!wasPressed && Math.abs(hAxis) > threshold) {
					currentStickDirection[direction] = true;
				} else if (wasPressed && Math.abs(hAxis) < deadzone) {
					currentStickDirection[direction] = false;
				} else {
					currentStickDirection[direction] = wasPressed;
				}
			} else {
				const direction = vAxis > 0 ? "Down" : "Up";
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

		for (const [cb, direction] of this.stickCallbacks) {
			const wasPressed = this.stickDirection[direction];
			const isPressed = currentStickDirection[direction];

			if (!wasPressed && isPressed) {
				cb();
			}
		}
		// batch update the stick directions
		this.stickDirection = currentStickDirection;

		requestAnimationFrame(this.loop);
	};

	add(cb: () => void, button: ButtonName) {
		this.callbacks.set(cb, button);
		this.queueLoop();
	}

	addStick(cb: () => void, direction: Direction) {
		this.stickCallbacks.set(cb, direction);
		this.queueLoop();
	}

	delete(cb: () => void) {
		this.callbacks.delete(cb);
		this.stickCallbacks.delete(cb);
		if (this.callbacks.size === 0 && this.stickCallbacks.size === 0) {
			this.running = false;
		}
	}
}

const gamepadLoop = new GamepadLoop();

export function useGamepadButton(
	button: ButtonName,
	callback: () => void,
	deps: DependencyList,
	focused = true
) {
	const cb = useCallback(callback, deps);

	useEffect(() => {
		if (!focused) {
			gamepadLoop.delete(cb);
			return;
		}
		gamepadLoop.add(cb, button);
		return () => {
			gamepadLoop.delete(cb);
		};
	}, [focused, cb, button]);
}

export function useJoystick(
	direction: Direction,
	callback: () => void,
	deps: DependencyList,
	focused = true
) {
	const cb = useCallback(callback, deps);

	useEffect(() => {
		if (!focused) {
			gamepadLoop.delete(cb);
			return;
		}
		gamepadLoop.addStick(cb, direction);
		return () => {
			gamepadLoop.delete(cb);
		};
	}, [focused, cb, direction]);
}

export function useDirection(
	direction: Direction,
	callback: () => void,
	deps: DependencyList,
	focused = true
) {
	useJoystick(direction, callback, deps, focused);
	useGamepadButton(direction, callback, deps, focused);
}
