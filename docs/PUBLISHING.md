# Publish the learning edition

This application is static: deploy the contents of dist/ to an HTTPS host. No database, backend, API key, build framework or paid speech service is required. Browser voice support varies.

## Local verification
Install Node.js 20 or later:
```bat
npm test
npm run check
npm start
```
Open http://localhost:3000 in Chrome or Edge. The server binds only to 127.0.0.1. Closing the terminal stops it.

## Netlify
Connect the repository. The supplied netlify.toml configures the validation command and dist as the published directory. Alternatively deploy dist directly. No credentials are embedded in the code. Review the host's current plan and sharing settings yourself.

## GitHub Pages
Run npm run publish:branch to create pages-site/. Publish only that folder's contents to a gh-pages branch, then choose that branch and its root in Repository Settings → Pages. Use a branch-based Pages deployment or a reviewed custom workflow that uploads dist/. All app paths, worker paths and manifest paths are relative, including a repository subpath. Do not publish the repository root as the website.

GitHub Pages docs: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Headers
dist/_headers supplies a CSP, camera-only permissions policy, referrer policy and content-type protection for compatible static hosts. Different providers may ignore this format; configure equivalent response headers in that provider and verify them. Serve .wasm as application/wasm, .mjs/.js as JavaScript and .webmanifest as application/manifest+json. The local server uses suitable MIME types. Resource providers open externally; only the existing Google Drive and YouTube privacy-enhanced demonstrations are framed.

## Offline
Users opt in under Voice & settings. The app shell and dictionaries are cached by the service worker. The separate Download camera assets button caches the bundled models and WASM assets. External source videos are not cached. A browser/system voice may still require a network. Offline removal unregisters this app's worker and deletes only its cache prefix. Personal recordings, clips and notes are not offline shell assets.

## Release checks
Automated checks validate indexes, profile separation, import rejection, asset integrity, worker dependencies and JavaScript syntax. The release has not been physically verified for webcam accuracy, speech output, personal video playback, PWA installation or every source provider. Test those in a real current desktop browser and obtain fluent-signer review before presenting recognition as reliable communication.

The existing ChatGPT Site can preserve its owner-only audience while a version is deployed. Public availability requires an explicit sharing change by the owner.

