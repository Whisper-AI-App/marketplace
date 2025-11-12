## [1.8.0](https://github.com/Ava-Technologies-Org/whisper-llm-cards/compare/v1.7.2...v1.8.0) (2025-11-12)

### ⚠ BREAKING CHANGES

* added `systemMessage` templates to LLM cards, with inteligent and self-healing `processSystemMessage()` method

### Features

* added `systemMessage` templates to LLM cards, with inteligent and self-healing `processSystemMessage()` method ([6bcc11d](https://github.com/Ava-Technologies-Org/whisper-llm-cards/commit/6bcc11df685672c27ac395ab0ca1e71c0eb1de7b))

## [1.7.2](https://github.com/Ava-Technologies-Org/whisper-llm-cards/compare/v1.7.1...v1.7.2) (2025-11-10)

### Bug Fixes

* not a real update ([ab08854](https://github.com/Ava-Technologies-Org/whisper-llm-cards/commit/ab08854536aea503f2dede0fd8cad50d8f6f59df))

## [1.7.1](https://github.com/Ava-Technologies-Org/whisper-llm-cards/compare/v1.7.0...v1.7.1) (2025-11-10)

### Bug Fixes

* testing deployment of updates, no real changes ([12ddf96](https://github.com/Ava-Technologies-Org/whisper-llm-cards/commit/12ddf96708a6f954ae8d211f08aa77fe9643b891))

## [1.7.0](https://github.com/Ava-Technologies-Org/whisper-llm-cards/compare/v1.6.0...v1.7.0) (2025-11-06)

### Features

* emulated updating sourceUrl for llama-3.2-1b-instruct-q4_0 to test distribution ([1ed14a9](https://github.com/Ava-Technologies-Org/whisper-llm-cards/commit/1ed14a9ee9d6831b3f676f10d9e7ddc10949e7fe))

## [1.6.0](https://github.com/Ava-Technologies-Org/whisper-llm-cards/compare/v1.5.0...v1.6.0) (2025-11-06)

### Features

* tiny card adjustment, purely to test distribution ([79c0264](https://github.com/Ava-Technologies-Org/whisper-llm-cards/commit/79c02643f05e4fb1bee20af858b7b6db69907057))

## [1.5.0](https://github.com/Ava-Technologies-Org/whisper-llm-cards/compare/v1.4.0...v1.5.0) (2025-11-06)

### Features

* prioritise getting latest minor version by checking latest entry on major channel, before checking minnor channel ([36189a8](https://github.com/Ava-Technologies-Org/whisper-llm-cards/commit/36189a81c41c485a21e46c370c4631d81329ac58))

## [1.4.0](https://github.com/Ava-Technologies-Org/whisper-llm-cards/compare/v1.3.1...v1.4.0) (2025-11-06)

### Features

* **card:** adjusted llama-3.2-1b-instruct-q4_0 name to make it friendlier and added more accurate download size GB ([77c93e1](https://github.com/Ava-Technologies-Org/whisper-llm-cards/commit/77c93e1a6a18ea7a31da8f055cbf2140ddbaca8a))

## [1.3.1](https://github.com/Ava-Technologies-Org/whisper-llm-cards/compare/v1.3.0...v1.3.1) (2025-11-06)

### Bug Fixes

* missing files in package.json `files` config ([680c1eb](https://github.com/Ava-Technologies-Org/whisper-llm-cards/commit/680c1eb1c74140fc4ba60639d634f4bd88a7f869))

## [1.3.0](https://github.com/Ava-Technologies-Org/whisper-llm-cards/compare/v1.2.0...v1.3.0) (2025-11-06)

### Features

* `postinstall` step to generate `dist/` when consuming via node ([3d85db2](https://github.com/Ava-Technologies-Org/whisper-llm-cards/commit/3d85db2f58028bbd65540751c526409078e57b3f))

## [1.2.0](https://github.com/Ava-Technologies-Org/whisper-llm-cards/compare/v1.1.0...v1.2.0) (2025-11-06)

### Features

* implement version management for resolving latest cards.json URL, with new versions.json to track channels, and updated release process ([9f36061](https://github.com/Ava-Technologies-Org/whisper-llm-cards/commit/9f360617e8d0f83e9ca292e48aee6c9b0028b703))

## [1.1.0](https://github.com/Ava-Technologies-Org/whisper-llm-cards/compare/v1.0.0...v1.1.0) (2025-11-06)

### Features

* show latest version tag on README.md for developer convenience ([009b48e](https://github.com/Ava-Technologies-Org/whisper-llm-cards/commit/009b48e7f61b7258db66bd648f940c1c32a9c033))

## 1.0.0 (2025-11-06)

### Features

* git init + working card LLMs with test and build scripts ([b2edb3e](https://github.com/Ava-Technologies-Org/whisper-llm-cards/commit/b2edb3edfb326bb726642835b57ecffb63126e61))
* README.md ([c1a77dc](https://github.com/Ava-Technologies-Org/whisper-llm-cards/commit/c1a77dc1f5f733183031004a079c5a04c29530b4))
* README.md edits ([5a534d2](https://github.com/Ava-Technologies-Org/whisper-llm-cards/commit/5a534d29f1f9d0ee642537863f11d6c9ef64413f))
* use `https://avatechnologies.org/whisper-llm-cards/refs/heads/main/cards.json` for latestConfigUrl ([3d8f6a4](https://github.com/Ava-Technologies-Org/whisper-llm-cards/commit/3d8f6a4941d1fb9f6c5397f88fd7cd22b4163efd))
* versioning, github deployment, tagging ([f08fa70](https://github.com/Ava-Technologies-Org/whisper-llm-cards/commit/f08fa70b6a7247e000d8d832bf600f3f332180e0))

### Bug Fixes

* correct property to use `cards` (not `models`), fixed mock data structure in test to use 'cards' instead of 'models' too ([c023983](https://github.com/Ava-Technologies-Org/whisper-llm-cards/commit/c023983df9022e5f1dcd41e5fd0b479727c154e3))
* corrected config URL default ([67fa3a4](https://github.com/Ava-Technologies-Org/whisper-llm-cards/commit/67fa3a4c074b46528526d9b9bfa4d499bd129eef))
* update repo url in package.json ([d6bc003](https://github.com/Ava-Technologies-Org/whisper-llm-cards/commit/d6bc00315992222b3a1a909be9a8121ec6d0e9b8))
