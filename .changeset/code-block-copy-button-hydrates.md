---
'pixel-perfect': patch
---

`CodeBlock` renders its copy button wherever `copy` is on, and checks for
the Clipboard API when the button is pressed rather than when it renders.
The button used to exist only where `navigator.clipboard` did, which is a
different answer on the server and in the browser, so every server-rendered
block hydrated against different HTML and React re-rendered the page on
the client. Without a clipboard the press does nothing, as the spec always
said.
