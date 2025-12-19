// Trigonometry helpers for game physics

export const angleFromMouse = (cannonX: number, cannonY: number, mouseX: number, mouseY: number): number => {
  return Math.atan2(mouseY - cannonY, mouseX - cannonX);
};

export const updateVelocity = (x: number, y: number, vx: number, vy: number, gravity: number = 0) => {
  return {
    x: x + vx,
    y: y + vy,
    vx,
    vy: vy + gravity,
  };
};

export const boundingBoxCollision = (
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number
): boolean => {
  return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
};
