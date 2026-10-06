// Test-driver helper. Repeated timestamps do not prove another frame opportunity.
export async function nextAdvancingFrame(previous, nextFrame = () => new Promise(requestAnimationFrame)) {
  const timestamps = [];
  for (let attempt = 0; attempt < 8; attempt++) {
    const timestamp = await nextFrame();
    timestamps.push(timestamp);
    // Return malformed/backward evidence as well, for the caller to retain/reject.
    if (timestamp !== previous) break;
  }
  return timestamps;
}

export function isAdvancingFrame(previous, timestamps) {
  return Number.isFinite(previous) && timestamps.length > 0 && timestamps.length <= 8
    && timestamps.every(Number.isFinite)
    && timestamps.slice(0, -1).every(timestamp => timestamp === previous)
    && timestamps.at(-1) > previous;
}
