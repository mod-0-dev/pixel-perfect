import { Matrix } from '../../harness/Matrix';

/**
 * Proves the harness itself works before any component exists: a well-behaved
 * `fill` box, and a deliberately broken one that ignores its parent. If the
 * second is not flagged red, the harness is lying and every later result from
 * it is worthless.
 */
export default function HarnessPage() {
  return (
    <>
      <h1>Harness self-check</h1>

      <section>
        <h2>Well-behaved `fill` box</h2>
        <p>Declares no width. Fills whatever it is given, at every size.</p>
        <Matrix>
          <div className="demo-box">
            Fills its parent. Wraps instead of overflowing, because it never told
            anyone how wide it wanted to be.
          </div>
        </Matrix>
      </section>

      <section>
        <h2>Deliberately broken box</h2>
        <p>
          Sets <code>width: 720px</code> on itself. Expect the two narrower cells to be
          flagged. If they are not, the overflow detection is broken.
        </p>
        <Matrix>
          <div className="demo-box" style={{ width: 720 }}>
            I decided my own width. I do not fit.
          </div>
        </Matrix>
      </section>
    </>
  );
}
