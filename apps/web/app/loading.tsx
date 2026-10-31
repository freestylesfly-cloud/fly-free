/**
 * Route loading screen: the bird mark lifts gently while the FLY FREE wordmark
 * (heavy FLY, light FREE, as in the logo) fills with ink behind a signal-orange
 * edge. CSS lives in globals.css under "Loading screen".
 */
export default function Loading() {
  return (
    <div className="ff-loader" role="status" aria-live="polite">
      <div className="ff-loader-inner">
        <img src="/brand/bird-mark.png" alt="" width={110} height={72} className="ff-loader-bird" />
        <p className="ff-loader-word" aria-hidden="true">
          <span className="ff-loader-fly">FLY</span>
          <span className="ff-loader-free">FREE</span>
        </p>
        <span className="sr-only">Loading Fly Free…</span>
      </div>
    </div>
  );
}
