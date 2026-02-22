# Kotoba
Kotoba is an AI-powered Japanese dictation app that turns speech into clean, accurate text in real time

> **This repository is a fork of [amicalhq/amical](https://github.com/amicalhq/amical).**
> Many thanks to the original Amical project and its developers for their outstanding work.

## 🎯 About This Fork

This fork remakes it under the following principles:

- **Fully local** — No network calls to the cloud whatsoever. Your audio and transcribed text never leave your machine.
- **Japanese as a first-class language** — Better Whisper model selection for Japanese, punctuation normalization, full-width character handling, and IME coexistence.

## 🔮 Overview

**Kotoba** is an AI dictation app that runs entirely on your own machine.

- 🎤 High-accuracy speech recognition powered by **[Whisper](https://github.com/ggerganov/whisper.cpp)**
- 🦙 Local LLM text formatting and summarization via **[Ollama](https://ollama.ai)**
- 🔐 **Completely private** — audio and text are never sent to any external server
- 🪟 Floating widget for instant record/type with a single shortcut 
- 🇯🇵 Japanese-specific tuning (punctuation correction, full-width handling, model selection)

##   Setup Guide

### Downloading a Whisper Model

You can download models from the onboarding screen on the first launch.
For Japanese audio, the **`large-v3`** or **`large-v3-turbo`** model is recommended.

### Setting Up Ollama (Optional)

To use text formatting and summarization, install [Ollama](https://ollama.ai) and pull your preferred model:

```bash
ollama pull llama3.2
```

## 🎗 License

Released under the [MIT License](LICENSE).

Copyright (c) 2025 Naomi Chopra, Haritabh Singh (upstream Amical)

This fork inherits the same MIT License.
