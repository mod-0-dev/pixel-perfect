/*
 * A Server Component page; the uploader is a client demo because the list
 * of files is the consumer's state and a selection is a handler
 * (Demos.tsx). Nothing here uploads.
 *
 * NOTHING HERE WRITES AN ID (D-035 §1): the browser suite finds its
 * sections by `data-testid`.
 */
import { Matrix } from '../../../harness/Matrix';

import { Uploader } from './Demos';

export default function FileUploadDemoPage() {
  return (
    <>
      <h1>5.10 FileUpload</h1>
      <p>
        Files, chosen or dropped: a native file input behind a Button, a dashed zone that takes a
        drop, and a list of what was chosen with how far each has got. It selects and shows; the
        upload is yours.
      </p>

      <section>
        <h2>At every width</h2>
        <p>In a Field, with three items: one uploading, one done, one refused. The long name truncates.</p>
        <Matrix>
          <Uploader />
        </Matrix>
      </section>

      {/* OUTSIDE THE MATRIX (D-035 §1). */}
      <section>
        <h2>With an error, and disabled</h2>
        <p>The Field&apos;s error puts the zone in the danger tone; disabled mutes it and takes no drop.</p>
        <Uploader testId="file-upload-error" error="Attach at least one receipt." />
        <Uploader testId="file-upload-disabled" disabled />
      </section>
    </>
  );
}
